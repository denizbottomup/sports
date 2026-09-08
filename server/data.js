import { mkdir, readFile, writeFile, rename, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { DATA_DIR, MEDIA_DIR } from './paths.js';
import { idFor, mediaAllowed, parseFixtures, parseRss, parseEspnNews, parseEspnRoster } from './providers.js';
import { articleAllowed, exclusionReason, parseArticle, makeReading, readableNews, parseMatchDetails, parseTrtBroadcast, parseRefereeReport } from './reading.js';
import { clubRegistry, curatedMatchSources } from './registry.js';
import { trackedTeamMap, favoriteTeamIds, languagesInUse, accounts, publicUser } from './store.js';
import { teamById } from './teams.js';
import { summarizerEnabled, summarizeArticle } from './summarize.js';
import { apiFootballEnabled, findTeamId, fetchSquad } from './apifootball.js';

export { DATA_DIR, MEDIA_DIR };
export const changes = new EventEmitter();
const now = () => new Date().toISOString();
// Hesap yokken uygulama bu takımla açılır; ilk kullanıcı favorisini seçtiğinde takip kümesi hesaplardan türetilir.
const DEFAULT_TEAM = { id: '432', name: 'Galatasaray', short: 'Galatasaray', abbreviation: 'GS', logo: null, color: '#a31e32', league: 'tur.1', leagueName: 'Süper Lig', country: 'Türkiye' };
const europeanCompetitions = [
  { id: 'uefa.champions', name: 'Şampiyonlar Ligi' },
  { id: 'uefa.europa', name: 'Avrupa Ligi' },
  { id: 'uefa.europa.conf', name: 'Konferans Ligi' },
];
const MAX_TRACKED = 24;
const sourceMap = new Map(), validators = new Map(), active = new Set(), imageJobs = new Map();
let imageQueue = Promise.resolve(), saveQueue = Promise.resolve();
export let state = { version: 3, teams: { [DEFAULT_TEAM.id]: DEFAULT_TEAM }, fixtures: [], news: [], rosters: {}, readings: {}, summaries: {}, apiFootballIds: {}, matchDetails: {}, updatedAt: null };

function tracked() {
  const map = trackedTeamMap();
  if (!map.size) map.set(DEFAULT_TEAM.id, DEFAULT_TEAM);
  const teams = [...map.values()];
  if (teams.length > MAX_TRACKED) console.error(`Tracked team cap: ${teams.length} istendi, ilk ${MAX_TRACKED} izleniyor`);
  return teams.slice(0, MAX_TRACKED).map(team => ({ ...team, ...(teamById(team.id) || {}), ...(state.teams[team.id]?.logo ? { logo: state.teams[team.id].logo, logoSource: state.teams[team.id].logoSource } : {}) }));
}
// Rakip dosyası (kadro, künye, rakip basını) yalnızca favori seçilen takımlar için hazırlanır; takip listesi fikstür + kendi haberleriyle izlenir.
function dossierIds() {
  const favorites = favoriteTeamIds();
  return new Set(favorites.length ? favorites : [DEFAULT_TEAM.id]);
}
const register = source => {
  if (!sourceMap.has(source.id)) sourceMap.set(source.id, { ...source, status: 'pending', lastCheckedAt: null, lastSuccessAt: null, error: null, failures: 0, nextCheck: 0 });
  return sourceMap.get(source.id);
};
function pruneSources(trackedIds) {
  for (const [id, source] of sourceMap) if (source.teams && !source.teams.some(teamId => trackedIds.has(teamId))) { sourceMap.delete(id); validators.delete(id); }
}
function persist() {
  const serialized = JSON.stringify(state);
  saveQueue = saveQueue.then(async () => { await writeFile(path.join(DATA_DIR, 'snapshot.tmp'), serialized); await rename(path.join(DATA_DIR, 'snapshot.tmp'), path.join(DATA_DIR, 'snapshot.json')); }).catch(e => console.error('Snapshot write failed:', e.message));
}
function emit() { state.updatedAt = now(); persist(); changes.emit('update', { updatedAt: state.updatedAt }); }
async function limitedBody(response, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; if (size > limit) throw new Error('Kaynak yanıtı boyut sınırını aştı'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
async function sourceFetch(source, parse, apply) {
  const s = register(source);
  if (active.has(s.id) || s.nextCheck > Date.now()) return;
  active.add(s.id); s.lastCheckedAt = now();
  try {
    const v = validators.get(s.id);
    const response = await fetch(s.url, { headers: { 'User-Agent': 'Touchline/0.4 (+https://github.com/denizbottomup/sports)', ...(v?.etag ? { 'If-None-Match': v.etag } : {}), ...(v?.modified ? { 'If-Modified-Since': v.modified } : {}) }, signal: AbortSignal.timeout(18000) });
    if (response.status !== 304) {
      if (!response.ok) { const error = new Error(`HTTP ${response.status}`); error.retry = Number(response.headers.get('retry-after')) * 1000; throw error; }
      const body = (await limitedBody(response, 4 * 1024 * 1024)).toString('utf8');
      const parsed = parse(body);
      apply(parsed);
      validators.set(s.id, { etag: response.headers.get('etag'), modified: response.headers.get('last-modified') });
    }
    s.status = 'ok'; s.error = null; s.failures = 0; s.lastSuccessAt = now(); s.nextCheck = Date.now() + s.interval;
  } catch (error) {
    s.failures++; s.status = s.lastSuccessAt ? 'stale' : 'error'; s.error = error.message === 'The operation was aborted due to timeout' ? 'Kaynak zaman aşımına uğradı' : error.message;
    s.nextCheck = Date.now() + Math.min(30 * 60000, Math.max(s.interval * 2 ** Math.min(s.failures, 5), error.retry || 0));
    console.error(`Source ${s.id}: ${s.error}`);
  } finally { active.delete(s.id); emit(); }
}
export function sources() {
  return [...sourceMap.values()].map(({ nextCheck, failures, parse, urlRequire, urlExclude, titleExclude, teamId, ...s }) => ({ ...s, nextCheckAt: new Date(nextCheck || Date.now()).toISOString() }));
}
export function dashboard(user) {
  const account = publicUser(user);
  const favorite = user?.favorite ? { ...user.favorite, ...(state.teams[user.favorite.id] || {}) } : (user ? null : { ...DEFAULT_TEAM, ...(state.teams[DEFAULT_TEAM.id] || {}) });
  const empty = { user: account, team: favorite, focusFixtureIds: [], followed: [], fixtures: [], news: [], rosters: {}, sources: [], updatedAt: state.updatedAt, serverTime: now(), newsPollSeconds: 30, feedPolicy: { version: 1, excluded: 0 } };
  if (!favorite) return empty;
  const focus = focusOpponents(favorite.id);
  const fixtures = state.fixtures.filter(f => f.team.id === favorite.id && Date.parse(f.date) > Date.now() - 3 * 3600000);
  const followed = (user?.followed || []).map(team => {
    const current = { ...team, ...(state.teams[team.id] || {}) };
    const nextFixture = state.fixtures.find(f => f.team.id === team.id && Date.parse(f.date) > Date.now() - 3 * 3600000) || null;
    return { team: current, nextFixture };
  });
  const relevant = new Set([favorite.id, ...focus.map(f => f.opponent.id), ...followed.map(f => f.team.id)]);
  const fresh = state.news.filter(n => relevant.has(n.teamId) && (!n.publishedAt || Date.parse(n.publishedAt) > Date.now() - 30 * 86400000));
  const news = readableNews(fresh, readingsFor(user?.language || 'tr'));
  const rosters = Object.fromEntries(Object.entries(state.rosters).filter(([teamId]) => relevant.has(teamId)));
  return { ...empty, focusFixtureIds: focus.map(f => f.id), followed, fixtures: fixtures.map(f => ({ ...f, details: state.matchDetails?.[f.id] || null })), news, rosters, sources: sources().filter(s => !s.teams || s.teams.some(id => relevant.has(id))).map(({ teams, ...s }) => s), feedPolicy: { version: 1, excluded: fresh.length - news.length } };
}
function queueImage(url) {
  if (!url || !mediaAllowed(url)) return null;
  const id = idFor(url), file = `${id}.img`;
  if (!imageJobs.has(id)) {
    imageJobs.set(id, true);
    imageQueue = imageQueue.then(async () => {
      try {
        await stat(path.join(MEDIA_DIR, file)); return;
      } catch { /* First download of a provider supplied image. */ }
      try {
        let target = url, response;
        for (let redirects = 0; redirects < 4; redirects++) {
          if (!mediaAllowed(target)) throw new Error('Untrusted image host');
          response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Touchline/0.4' } });
          if (response.status >= 300 && response.status < 400) { target = new URL(response.headers.get('location'), target).href; await response.body?.cancel(); continue; }
          break;
        }
        const type = response?.headers.get('content-type')?.split(';')[0];
        if (!response?.ok || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(type)) throw new Error('Unsupported image');
        const data = await limitedBody(response, 5 * 1024 * 1024);
        await writeFile(path.join(MEDIA_DIR, `${file}.tmp`), data);
        await writeFile(path.join(MEDIA_DIR, `${id}.json`), JSON.stringify({ url, type, downloadedAt: now() }));
        await rename(path.join(MEDIA_DIR, `${file}.tmp`), path.join(MEDIA_DIR, file));
      } catch { imageJobs.delete(id); }
    });
  }
  return { url: `/media/${id}`, original: url };
}
function imageFields(image) { const asset = queueImage(image); return { image: asset?.url || null, imageSource: asset?.original || null }; }
function logoTeam(team) { const asset = queueImage(team.logo); return { ...team, logo: asset?.url || null, logoSource: asset?.original || null }; }
export function mergeNews(items, previous = state.news, timestamp = now()) {
  const map = new Map(previous.map(n => [n.id, n]));
  for (const n of items) {
    const old = map.get(n.id);
    const keepPrecise = old?.datePrecision === 'time' && n.datePrecision === 'day';
    map.set(n.id, { ...old, ...n, ...(keepPrecise ? { publishedAt: old.publishedAt, datePrecision: old.datePrecision } : {}), ...(n.image ? imageFields(n.image) : { image: old?.image || null, imageSource: old?.imageSource || null }), firstSeenAt: old?.firstSeenAt || timestamp });
  }
  // Takım başına ayrı kota: bir takımın yoğun gündemi diğer takımların haberlerini düşürmesin.
  const perTeam = new Map();
  const sorted = [...map.values()].filter(n => !n.publishedAt || Date.parse(n.publishedAt) > Date.now() - 30 * 86400000).sort((a, b) => Date.parse(b.publishedAt || b.firstSeenAt) - Date.parse(a.publishedAt || a.firstSeenAt));
  return sorted.filter(n => { const count = perTeam.get(n.teamId) || 0; perTeam.set(n.teamId, count + 1); return count < 150; });
}
function addNews(items) {
  state.news = mergeNews(items);
  state.readings ||= {};
  for (const n of items) {
    if ((n.official || n.readable) && !exclusionReason(n) && !state.readings[n.id] && n.summary) {
      const reading = makeReading(n, [n.summary]);
      if (reading) state.readings[n.id] = reading;
    }
  }
}
function competitionsFor(team) {
  const domestic = team.league ? [{ id: team.league, name: team.leagueName || team.league }] : [];
  return [...domestic, ...europeanCompetitions];
}
async function refreshFixtures() {
  const teams = tracked();
  // Rakip dosyası kaynakları da korunur; aksi halde her turda silinip yeniden kaydedilir,
  // ETag/backoff kaybolur ve kaynaklar 10 saniyede bir taranarak hız sınırına takılır.
  const keep = new Set(teams.map(t => t.id));
  for (const teamId of dossierIds()) for (const fixture of focusOpponents(teamId)) keep.add(fixture.opponent.id);
  pruneSources(keep);
  const work = [];
  for (const team of teams) {
    for (const league of competitionsFor(team)) {
      const optional = league.id.startsWith('uefa.');
      work.push(sourceFetch(
        { id: `fixtures-${league.id}-${team.id}`, teams: [team.id], name: `ESPN · ${team.short || team.name} · ${league.name}`, kind: 'Fikstür', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/teams/${team.id}/schedule?fixture=true`, publicUrl: `https://www.espn.com/soccer/team/fixtures/_/id/${team.id}`, interval: 15 * 60000, official: false },
        body => { const data = JSON.parse(body); if (optional && !Array.isArray(data.events)) return []; return parseFixtures(data, league, team.id); },
        fixtures => {
          const enriched = fixtures.map(f => ({ ...f, team: logoTeam(f.team), opponent: logoTeam(f.opponent), fetchedAt: now() }));
          state.fixtures = [...state.fixtures.filter(f => !(f.competition === league.id && f.team.id === team.id)), ...enriched].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
          if (enriched[0]) state.teams[team.id] = { ...team, ...enriched[0].team };
        }
      ));
    }
  }
  await Promise.allSettled(work);
}
function focusOpponents(teamId) {
  const domestic = state.teams[teamId]?.league || teamById(teamId)?.league || (teamId === DEFAULT_TEAM.id ? DEFAULT_TEAM.league : null);
  const next = state.fixtures.filter(f => f.team.id === teamId && Date.parse(f.date) > Date.now() - 3 * 3600000);
  const picked = [next.find(f => f.competition !== domestic), next.find(f => f.competition === domestic)].filter(Boolean);
  return [...new Map(picked.map(f => [f.opponent.id, f])).values()];
}
function pressSource(team, isOpponent) {
  const registered = clubRegistry[team.id]?.pressTerms;
  const terms = registered || [team.name, team.short].filter(Boolean);
  const query = new URLSearchParams({ q: `${terms[0]} when:7d`, hl: 'tr', gl: 'TR', ceid: 'TR:tr' });
  return {
    // Kayıtlı olmayan kulüplerde takım adı çoğu zaman şehir adıyla örtüşür (ör. "Erzurum BB");
    // basın başlığının futbol bağlamı taşıması istenir ki belediye/şehir haberleri akışa girmesin.
    source: { id: `press-${team.id}`, teams: [team.id], name: `Türkçe basın · ${team.name}`, kind: 'Haber dizini', url: `https://news.google.com/rss/search?${query}`, publicUrl: `https://news.google.com/search?q=${encodeURIComponent(terms[0])}&hl=tr&gl=TR&ceid=TR:tr`, official: false, interval: isOpponent ? 60000 : 120000, language: 'tr', ...(registered ? {} : { titleRequire: /spor|futbol|transfer|kadro|teknik direktor|hoca|taraftar|stadyum|hakem|puan|galibiyet|maglubiyet|deplasman|gol at|golle|macin|maci |maca |sakatl|milli ara/ }) },
    terms,
  };
}
async function refreshNews() {
  const work = [];
  const wanted = new Map();
  for (const team of tracked()) wanted.set(team.id, { team, isOpponent: false, league: team.league });
  for (const teamId of dossierIds()) for (const fixture of focusOpponents(teamId)) {
    const existing = wanted.get(fixture.opponent.id);
    wanted.set(fixture.opponent.id, { team: existing?.team || fixture.opponent, isOpponent: true, league: existing?.league || teamById(fixture.opponent.id)?.league || fixture.competition });
  }
  for (const { team, isOpponent, league } of wanted.values()) {
    for (const registered of clubRegistry[team.id]?.news || []) {
      const source = { ...registered, teams: [team.id] };
      work.push(sourceFetch(source, body => registered.parse(body, source), addNews));
    }
    const { source, terms } = pressSource(team, isOpponent);
    work.push(sourceFetch(source, body => parseRss(body, source, team.id, terms), addNews));
    if (league) {
      const espn = { id: `espn-news-${team.id}`, teams: [team.id], name: `ESPN · ${team.short || team.name}`, kind: 'Haber servisi', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/news?team=${team.id}&limit=20`, publicUrl: `https://www.espn.com/soccer/team/_/id/${team.id}`, official: false, interval: 5 * 60000, language: 'en' };
      work.push(sourceFetch(espn, body => parseEspnNews(JSON.parse(body), team.id), addNews));
    }
  }
  await Promise.allSettled(work);
}
const apiFootballChecks = new Map();
// Kadro fotoğrafları: ESPN futbol kadrolarında oyuncu fotoğrafı yoktur. APIFOOTBALL_KEY
// tanımlıysa kadro API-Football'dan fotoğraflı çekilir; kayıtlı resmî kulüp sayfası (registry)
// her zaman önceliklidir, her iki yol da başarısız olursa ESPN listesi gösterilir.
async function apiFootballRoster(team, favoriteId) {
  if (!apiFootballEnabled() || (apiFootballChecks.get(team.id) || 0) > Date.now()) return false;
  apiFootballChecks.set(team.id, Date.now() + 4 * 3600000);
  try {
    state.apiFootballIds ||= {};
    if (state.apiFootballIds[team.id] === undefined) {
      state.apiFootballIds[team.id] = await findTeamId(team.name);
      persist();
    }
    const apiId = state.apiFootballIds[team.id];
    if (!apiId) return false;
    const players = await fetchSquad(apiId);
    state.rosters[team.id] = { players: players.map(p => ({ ...p, ...imageFields(p.image) })), updatedAt: now(), source: 'API-Football kadro', sourceUrl: `https://www.espn.com/soccer/team/squad/_/id/${team.id}`, official: false };
    emit();
    return true;
  } catch (error) {
    console.error(`API-Football roster ${team.id}: ${error.message}`);
    apiFootballChecks.set(team.id, Date.now() + 3600000);
    return false;
  }
}
async function refreshRosters() {
  for (const teamId of dossierIds()) {
    for (const fixture of focusOpponents(teamId)) {
      const team = fixture.opponent;
      const registered = clubRegistry[team.id]?.roster;
      if (!registered && await apiFootballRoster(team, teamId)) continue;
      if (!registered && state.rosters[team.id]?.source === 'API-Football kadro') continue;
      const source = registered
        ? { id: `roster-${team.id}`, teams: [team.id, teamId], name: registered.name, kind: 'Kadro & oyuncu görselleri', url: registered.url, publicUrl: registered.publicUrl, official: true, interval: 4 * 3600000 }
        : { id: `roster-${team.id}`, teams: [team.id, teamId], name: `${team.name} · ESPN kadro`, kind: 'Kadro & oyuncu görselleri', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${fixture.competition}/teams/${team.id}/roster`, publicUrl: `https://www.espn.com/soccer/team/squad/_/id/${team.id}`, official: false, interval: 4 * 3600000 };
      await sourceFetch(source, body => registered ? registered.parse(body) : parseEspnRoster(JSON.parse(body)), players => {
        state.rosters[team.id] = { players: players.map(p => ({ ...p, ...imageFields(p.image) })), updatedAt: now(), source: source.name, sourceUrl: source.publicUrl, official: source.official };
      });
    }
  }
}
// Kullanıcının dili için etkili okuma haritası: dildeki özet varsa onu kullan; Türkçede
// elle yazılmış brief özete karşı önceliklidir, özet ise kısa aktarımın (excerpt) önüne geçer.
export function readingsFor(language) {
  const effective = { ...(state.readings || {}) };
  for (const [id, byLang] of Object.entries(state.summaries || {})) {
    const summary = byLang?.[language];
    if (summary && !(language === 'tr' && effective[id]?.kind === 'brief')) effective[id] = summary;
  }
  return effective;
}
function missingLanguages(id) {
  return languagesInUse().filter(lang => !state.summaries?.[id]?.[lang] && !(lang === 'tr' && state.readings?.[id]?.kind === 'brief'));
}
async function addSummaries(n, paragraphs) {
  if (!summarizerEnabled()) return false;
  let added = false;
  for (const lang of missingLanguages(n.id).slice(0, 4)) {
    try {
      const summary = await summarizeArticle({ title: n.title, source: n.source, language: n.language, paragraphs }, lang);
      state.summaries[n.id] ||= {};
      state.summaries[n.id][lang] = summary;
      added = true;
    } catch (error) { console.error(`Summary ${n.id} (${lang}): ${error.message}`); }
  }
  return added;
}
let readingRunning = false;
const articleChecks = new Map();
async function refreshReadings() {
  if (readingRunning) return;
  readingRunning = true;
  try {
    state.readings ||= {};
    state.summaries ||= {};
    const candidates = state.news.filter(n => (n.official || n.readable) && (articleAllowed(n.url) || n.summary) && !exclusionReason(n) && (articleChecks.get(n.id) || 0) < Date.now() && (!state.readings[n.id] || (summarizerEnabled() && missingLanguages(n.id).length > 0))).slice(0, 4);
    await Promise.allSettled(candidates.map(async n => {
      articleChecks.set(n.id, Date.now() + 3600000);
      try {
        let paragraphs = null;
        if (articleAllowed(n.url)) {
          let target = n.url, response;
          for (let redirects = 0; redirects < 3; redirects++) {
            if (!articleAllowed(target)) throw new Error('Unsupported article redirect');
            response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Touchline/0.4' } });
            if (response.status >= 300 && response.status < 400) { target = new URL(response.headers.get('location'), target).href; await response.body?.cancel(); continue; }
            break;
          }
          if (!response?.ok) throw new Error('Article unavailable');
          paragraphs = parseArticle((await limitedBody(response, 2 * 1024 * 1024)).toString('utf8'), target);
        } else if (n.summary) {
          // Tam metin erişimi olmayan kaynaklarda (ör. ESPN haber servisi) özet metni kullanılır.
          paragraphs = [n.summary];
        }
        if (!paragraphs) return;
        const reading = makeReading(n, paragraphs);
        if (reading && !state.readings[n.id]) state.readings[n.id] = reading;
        const done = await addSummaries(n, paragraphs);
        // Tüm diller tamamlanmadıysa (anahtar yok, API hatası) makale 10 dk sonra yeniden denenir.
        if (summarizerEnabled() && missingLanguages(n.id).length > 0) articleChecks.set(n.id, Date.now() + (done ? 600000 : 1800000));
      } catch { /* Keep an attributed short feed excerpt when the article is unavailable. */ }
    }));
    const ids = new Set(state.news.map(n => n.id));
    for (const id of Object.keys(state.readings)) if (!ids.has(id)) { delete state.readings[id]; articleChecks.delete(id); }
    for (const id of Object.keys(state.summaries)) if (!ids.has(id)) delete state.summaries[id];
    if (candidates.length) emit();
  } finally { readingRunning = false; }
}
async function refreshMatchDetails() {
  state.matchDetails ||= {};
  const fixtures = [...new Map([...dossierIds()].flatMap(teamId => focusOpponents(teamId)).map(f => [f.id, f])).values()];
  await Promise.allSettled(fixtures.map(async fixture => {
    const id = fixture.id;
    const involved = [fixture.team.id, fixture.opponent.id];
    const summary = { id: `match-${id}`, teams: involved, name: `${fixture.opponent.name} · Maç künyesi`, kind: 'Maç bilgileri', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${fixture.competition}/summary?event=${id}`, publicUrl: fixture.sourceUrl, interval: 15 * 60000, official: false };
    await sourceFetch(summary, body => parseMatchDetails(JSON.parse(body), fixture), details => {
      const old = state.matchDetails[id];
      state.matchDetails[id] = { ...details, ...(old?.refereeSource ? { referee: old.referee, refereeSource: old.refereeSource } : {}), broadcasts: [...details.broadcasts, ...(old?.broadcasts || []).filter(b => b.country === 'TR')] };
    });
    const curated = curatedMatchSources[id];
    if (curated?.trtAnnouncement) {
      const trt = { id: `broadcast-${id}-TR`, teams: involved, name: 'TRT 1 · Maç yayını', kind: 'Yayın bilgileri', url: 'https://www.trt1.com.tr/', publicUrl: 'https://www.trt1.com.tr/', interval: 15 * 60000, official: true };
      await sourceFetch(trt, body => parseTrtBroadcast(body, fixture), broadcast => {
        const old = state.matchDetails[id] || {};
        state.matchDetails[id] = { ...old, broadcasts: [...(old.broadcasts || []).filter(b => b.country !== 'TR'), broadcast] };
      });
    }
    if (curated?.referee) {
      const referee = { id: `referee-${id}`, teams: involved, name: curated.referee.name, kind: 'Hakem bilgileri', url: curated.referee.url, publicUrl: curated.referee.url, interval: 3600000, official: false };
      await sourceFetch(referee, body => parseRefereeReport(body, fixture, curated.referee), report => { state.matchDetails[id] = { ...state.matchDetails[id], referee: report.referee, refereeSource: report }; });
    }
  }));
  const known = new Set(state.fixtures.map(f => f.id));
  for (const id of Object.keys(state.matchDetails)) if (!known.has(id)) delete state.matchDetails[id];
}
async function pruneMedia() {
  try {
    const files = await Promise.all((await readdir(MEDIA_DIR)).filter(file => file.endsWith('.img')).map(async file => ({ file, ...(await stat(path.join(MEDIA_DIR, file))) })));
    let total = files.reduce((sum, file) => sum + file.size, 0);
    for (const file of files.sort((a, b) => a.mtimeMs - b.mtimeMs)) {
      if (file.mtimeMs < Date.now() - 30 * 86400000 || total > 256 * 1024 * 1024) {
        await unlink(path.join(MEDIA_DIR, file.file));
        await unlink(path.join(MEDIA_DIR, file.file.replace('.img', '.json'))).catch(() => {});
        imageJobs.delete(file.file.replace('.img', '')); total -= file.size;
      }
    }
  } catch (e) { console.error('Media cleanup:', e.message); }
}
async function refreshAll() {
  await refreshFixtures();
  await Promise.allSettled([refreshNews(), refreshRosters(), refreshMatchDetails()]);
  await refreshReadings();
}
export async function startData() {
  await mkdir(MEDIA_DIR, { recursive: true });
  try {
    const saved = JSON.parse(await readFile(path.join(DATA_DIR, 'snapshot.json'), 'utf8'));
    if (saved.version === 3 && saved.teams && Array.isArray(saved.fixtures) && Array.isArray(saved.news)) state = { summaries: {}, apiFootballIds: {}, ...saved };
    else if (saved.version === 2 && Array.isArray(saved.fixtures) && Array.isArray(saved.news)) {
      const { team, ...rest } = saved;
      state = { ...rest, version: 3, teams: { [team.id]: { ...DEFAULT_TEAM, ...team } } };
    }
  } catch { /* A new deployment can start without a previous snapshot. */ }
  await refreshAll();
  const timer = setInterval(() => { void refreshFixtures(); void refreshNews(); void refreshRosters(); void refreshMatchDetails(); void refreshReadings(); }, 10000);
  timer.unref();
  // Takım tercihi değişince yeni takımların verisi ilk tur beklenmeden toplansın.
  const onTeams = () => { void refreshAll(); };
  accounts.on('teams', onTeams);
  void pruneMedia();
  const cleanup = setInterval(() => { void pruneMedia(); }, 86400000); cleanup.unref();
  return () => { clearInterval(timer); clearInterval(cleanup); accounts.off('teams', onTeams); };
}

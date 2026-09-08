import { mkdir, readFile, writeFile, rename, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { idFor, mediaAllowed, parseFixtures, parseRss, parseSportingNews, parseSportingRoster, parseEspnRoster } from './providers.js';

export const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');
export const changes = new EventEmitter();
const now = () => new Date().toISOString();
const leagues = [
  { id: 'tur.1', name: 'Süper Lig' },
  { id: 'uefa.champions', name: 'Şampiyonlar Ligi' },
  { id: 'uefa.europa', name: 'Avrupa Ligi' },
  { id: 'uefa.europa.conf', name: 'Konferans Ligi' },
];
const sourceMap = new Map(), validators = new Map(), active = new Set(), imageJobs = new Map();
let imageQueue = Promise.resolve(), saveQueue = Promise.resolve();
export let state = { version: 2, team: { id: '432', name: 'Galatasaray', short: 'Galatasaray', abbreviation: 'GS', logo: null, color: '#a31e32' }, fixtures: [], news: [], rosters: {}, updatedAt: null };

const register = source => {
  if (!sourceMap.has(source.id)) sourceMap.set(source.id, { ...source, status: 'pending', lastCheckedAt: null, lastSuccessAt: null, error: null, failures: 0, nextCheck: 0 });
  return sourceMap.get(source.id);
};
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
    const response = await fetch(s.url, { headers: { 'User-Agent': 'Touchline/0.2 (+https://github.com/denizbottomup/sports)', ...(v?.etag ? { 'If-None-Match': v.etag } : {}), ...(v?.modified ? { 'If-Modified-Since': v.modified } : {}) }, signal: AbortSignal.timeout(18000) });
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
export function sources() { return [...sourceMap.values()].map(({ nextCheck, failures, ...s }) => ({ ...s, nextCheckAt: new Date(nextCheck || Date.now()).toISOString() })); }
export function dashboard() {
  const fixtures = state.fixtures.filter(f => Date.parse(f.date) > Date.now() - 3 * 3600000);
  return { ...state, fixtures, news: state.news.filter(n => !n.publishedAt || Date.parse(n.publishedAt) > Date.now() - 30 * 86400000), sources: sources(), serverTime: now(), newsPollSeconds: 30 };
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
          response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Touchline/0.2' } });
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
  return [...map.values()].filter(n => !n.publishedAt || Date.parse(n.publishedAt) > Date.now() - 30 * 86400000).sort((a, b) => Date.parse(b.publishedAt || b.firstSeenAt) - Date.parse(a.publishedAt || a.firstSeenAt)).slice(0, 350);
}
function addNews(items) { state.news = mergeNews(items); }

async function refreshFixtures() {
  await Promise.allSettled(leagues.map(league => sourceFetch({ id: `fixtures-${league.id}`, name: `ESPN · ${league.name}`, kind: 'Fikstür', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/teams/432/schedule?fixture=true`, publicUrl: 'https://www.espn.com/soccer/team/fixtures/_/id/432/galatasaray', interval: 15 * 60000, official: false }, body => parseFixtures(JSON.parse(body), league), fixtures => {
    const enriched = fixtures.map(f => ({ ...f, team: logoTeam(f.team), opponent: logoTeam(f.opponent), fetchedAt: now() }));
    state.fixtures = [...state.fixtures.filter(f => f.competition !== league.id), ...enriched].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (enriched[0]) state.team = enriched[0].team;
  })));
}
function focusOpponents() {
  const next = state.fixtures.filter(f => Date.parse(f.date) > Date.now() - 3 * 3600000);
  const picked = [next.find(f => f.competition !== 'tur.1'), next.find(f => f.competition === 'tur.1')].filter(Boolean);
  return [...new Map(picked.map(f => [f.opponent.id, f])).values()];
}
async function refreshNews() {
  const gs = { id: 'gs-news', name: 'Galatasaray · Resmî', kind: 'Kulüp haberleri', url: 'https://www.galatasaray.org/xml/gs.rss', publicUrl: 'https://www.galatasaray.org', official: true, interval: 30000, language: 'tr' };
  const work = [sourceFetch(gs, body => parseRss(body, gs, '432'), addNews)];
  for (const fixture of focusOpponents()) {
    const opponent = fixture.opponent;
    if (opponent.id === '2250') {
      const scp = { id: 'scp-news', name: 'Sporting CP · Resmî', kind: 'Kulüp haberleri', url: 'https://www.sporting.pt/pt/rss/noticias.xml', publicUrl: 'https://www.sporting.pt/pt/noticias/futebol/equipa-principal', official: true, interval: 30000, language: 'pt' };
      work.push(sourceFetch(scp, body => parseRss(body, scp, '2250'), addNews));
      const listing = { ...scp, id: 'scp-newsroom', url: scp.publicUrl, interval: 60000 };
      work.push(sourceFetch(listing, body => parseSportingNews(body, listing), addNews));
    }
    const terms = opponent.id === '2250' ? ['Sporting'] : [opponent.name];
    const press = { id: `press-${opponent.id}`, name: `Türkçe basın · ${opponent.name}`, kind: 'Haber dizini', url: `https://news.google.com/rss/search?${new URLSearchParams({ q: `${opponent.name} when:7d`, hl: 'tr', gl: 'TR', ceid: 'TR:tr' })}`, publicUrl: `https://news.google.com/search?q=${encodeURIComponent(opponent.name)}&hl=tr&gl=TR&ceid=TR:tr`, official: false, interval: 60000, language: 'tr' };
    work.push(sourceFetch(press, body => parseRss(body, press, opponent.id, terms), addNews));
  }
  await Promise.allSettled(work);
}
async function refreshRosters() {
  for (const f of focusOpponents()) {
    const team = f.opponent;
    const official = team.id === '2250';
    const source = { id: `roster-${team.id}`, name: `${team.name} · ${official ? 'Resmî kadro' : 'ESPN kadro'}`, kind: 'Kadro & oyuncu görselleri', url: official ? 'https://www.sporting.pt/pt/futebol/equipa-principal/plantel' : `https://site.api.espn.com/apis/site/v2/sports/soccer/${f.competition}/teams/${team.id}/roster`, publicUrl: official ? 'https://www.sporting.pt/pt/futebol/equipa-principal/plantel' : `https://www.espn.com/soccer/team/squad/_/id/${team.id}`, official, interval: 4 * 3600000 };
    await sourceFetch(source, body => official ? parseSportingRoster(body) : parseEspnRoster(JSON.parse(body)), players => {
      state.rosters[team.id] = { players: players.map(p => ({ ...p, ...imageFields(p.image) })), updatedAt: now(), source: source.name, sourceUrl: source.publicUrl, official };
    });
  }
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
export async function startData() {
  await mkdir(MEDIA_DIR, { recursive: true });
  try { const saved = JSON.parse(await readFile(path.join(DATA_DIR, 'snapshot.json'), 'utf8')); if (saved.version === 2 && Array.isArray(saved.fixtures) && Array.isArray(saved.news)) state = saved; } catch { /* A new deployment can start without a previous snapshot. */ }
  await refreshFixtures();
  await Promise.allSettled([refreshNews(), refreshRosters()]);
  const timer = setInterval(() => { void refreshFixtures(); void refreshNews(); void refreshRosters(); }, 10000);
  timer.unref();
  void pruneMedia();
  const cleanup = setInterval(() => { void pruneMedia(); }, 86400000); cleanup.unref();
  return () => { clearInterval(timer); clearInterval(cleanup); };
}

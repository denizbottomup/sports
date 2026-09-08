import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

export const idFor = value => createHash('sha256').update(value).digest('hex').slice(0, 24);
export const text = value => load(String(value ?? '')).text().replace(/\s+/g, ' ').trim();
export const fold = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ı/g, 'i');
export function safeUrl(value, base) {
  try { const url = new URL(value, base); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href.replace(/^http:/, 'https:') : null; } catch { return null; }
}
export function mediaAllowed(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.port && !u.username && !u.password && ['a.espncdn.com', 'scpconteudos.pt', 'www.sporting.pt', 'hlkiurt3.rocketcdn.com', 'kocaelispor.com.tr', 'media.api-sports.io'].includes(u.hostname); } catch { return false; }
}
export function teamFrom(raw) {
  return { id: String(raw.id), name: raw.displayName || raw.name, short: raw.shortDisplayName || raw.displayName || raw.name, abbreviation: raw.abbreviation || '', logo: safeUrl(raw.logos?.[0]?.href || raw.logo), color: /^[0-9a-f]{6}$/i.test(raw.color) ? `#${raw.color}` : '#205240' };
}
export function parseFixtures(data, league, teamId, now = Date.now()) {
  if (!Array.isArray(data.events)) throw new Error('Fikstür yanıtı beklenen biçimde değil');
  return data.events.flatMap(event => {
    const c = event.competitions?.[0];
    const own = c?.competitors?.find(t => String(t.team?.id) === String(teamId));
    const other = c?.competitors?.find(t => String(t.team?.id) !== String(teamId));
    const status = c?.status?.type;
    if (!own || !other || !Number.isFinite(Date.parse(event.date)) || status?.completed || Date.parse(event.date) < now - 3 * 3600000) return [];
    return [{ id: String(event.id), date: event.date, dateConfirmed: !/TBD|postponed|canceled/i.test(`${status?.detail} ${status?.name}`), status: status?.state === 'in' ? 'live' : /postponed/i.test(status?.name) ? 'postponed' : 'scheduled', competition: league.id, competitionName: league.name, home: own.homeAway === 'home', team: teamFrom(own.team), opponent: teamFrom(other.team), venue: c.venue?.fullName || null, round: event.week?.text || c.groups?.name || '', source: 'ESPN', sourceUrl: safeUrl(event.links?.find(l => l.href?.startsWith('https:'))?.href) || `https://www.espn.com/soccer/team/fixtures/_/id/${teamId}` }];
  });
}
export function parseEspnNews(data, teamId) {
  if (!Array.isArray(data.articles)) throw new Error('Haber yanıtı beklenen biçimde değil');
  return data.articles.flatMap(article => {
    const url = safeUrl(article.links?.web?.href);
    const title = text(article.headline);
    const summary = text(article.description);
    if (!url || !title || !summary) return [];
    return [{ id: idFor(url), title, summary: summary.slice(0, 400), url, image: safeUrl(article.images?.[0]?.url), publishedAt: Number.isFinite(Date.parse(article.published)) ? new Date(article.published).toISOString() : null, datePrecision: 'time', teamId, sourceId: `espn-news-${teamId}`, source: 'ESPN', official: false, readable: true, language: 'en', category: categoryOf(title) }];
  });
}
export function categoryOf(title) {
  const t = fold(title);
  if (/sakat|saglik|cezali|lesao|lesionado|boletim clinico|injur|suspens/.test(t)) return 'squad';
  if (/antrenman|hazirlik|treino|prepara|trabalho/.test(t)) return 'training';
  if (/teknik direktor|basin toplantis|conferencia de imprensa|declarac|antrenor/.test(t)) return 'coach';
  if (/transfer|reforca|contrata|hos geldin|imza/.test(t)) return 'transfer';
  return 'news';
}
function newsRecord(raw, source, teamId) {
  const title = text(raw.title);
  const url = safeUrl(raw.url);
  if (!title || !url) return null;
  return { id: idFor(url), title, summary: text(raw.summary).slice(0, 180), url, image: safeUrl(raw.image), publishedAt: Number.isFinite(Date.parse(raw.date)) ? new Date(raw.date).toISOString() : null, datePrecision: raw.datePrecision || 'time', teamId, sourceId: source.id, source: raw.publisher || source.name, official: source.official, language: source.language || 'tr', category: categoryOf(title) };
}
export function parseRss(xml, source, teamId, terms = []) {
  if (!/<rss[\s>]/i.test(xml)) throw new Error('RSS yerine farklı bir yanıt alındı');
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  const rawItems = parsed.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return items.flatMap(item => {
    const url = safeUrl(item.link);
    if (!url) return [];
    if (source.urlRequire && !url.includes(source.urlRequire)) return [];
    if (source.urlExclude && source.urlExclude.test(url)) return [];
    const publisher = typeof item.source === 'object' ? item.source['#text'] : item.source;
    const title = text(item.title).replace(publisher ? new RegExp(` - ${String(publisher).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : /$^/, '');
    if (terms.length && !terms.some(term => fold(title).includes(fold(term)))) return [];
    if (source.titleExclude && source.titleExclude.test(fold(title))) return [];
    if (source.titleRequire && !source.titleRequire.test(fold(title))) return [];
    const $ = load(String(item.description || ''));
    const row = newsRecord({ title, url, publisher, summary: source.official ? $.text() : '', date: item.pubDate || item['dc:date'], image: item.image?.url || $('img').first().attr('src') }, source, teamId);
    return row ? [row] : [];
  });
}
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Kısa terimlerde iki taraflı sınır aranır; 5+ harfte Türkçe ekleri yakalamak için sonek serbesttir.
export function termPattern(term) {
  const folded = fold(term);
  return new RegExp(folded.length >= 5 ? `(^|[^a-z0-9])${escapeRegex(folded)}` : `(^|[^a-z0-9])${escapeRegex(folded)}([^a-z0-9]|$)`);
}
export function parsePressFeed(xml, source, teamTerms) {
  if (!/<rss[\s>]/i.test(xml)) throw new Error('RSS yerine farklı bir yanıt alındı');
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  const rawItems = parsed.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return items.flatMap(item => {
    const url = safeUrl(item.link);
    const title = text(item.title);
    if (!url || !title) return [];
    const summary = text(item.description).slice(0, 400);
    const haystack = fold(`${title} ${summary}`);
    const publishedAt = Number.isFinite(Date.parse(item.pubDate)) ? new Date(item.pubDate).toISOString() : null;
    return teamTerms.flatMap(({ teamId, terms }) => {
      if (!terms.some(term => termPattern(term).test(haystack))) return [];
      return [{ id: idFor(`${url}#${teamId}`), title, summary, url, image: null, imageSource: null, publishedAt, datePrecision: 'time', teamId, sourceId: `pressfeed-${source.feedId}`, source: source.name, official: false, readable: summary.length > 40, language: 'tr', category: categoryOf(title) }];
    });
  });
}
export function parseSportingNews(html, source) {
  const $ = load(html);
  const rows = [];
  $('.itemList').each((_, el) => {
    const card = $(el);
    const a = card.find('a[href*="/noticias/futebol/equipa-principal/"]').first();
    const url = safeUrl(a.attr('href'), source.url);
    if (!url) return;
    const date = url.match(/\/(20\d{2}-\d{2}-\d{2})\//)?.[1];
    const style = card.find('.noticias__photo').attr('style') || '';
    const image = card.find('img').first().attr('src') || style.match(/url\(['"]?(.*?)['"]?\)/)?.[1];
    const row = newsRecord({ title: card.find('.itemList__title').text() || a.text(), summary: card.find('.itemList__description').text(), url, image, date: date ? `${date}T12:00:00Z` : null, datePrecision: 'day' }, source, source.teamId);
    if (row) rows.push(row);
  });
  if (!rows.length) throw new Error('Sporting haber listesi okunamadı');
  return rows;
}
export function parseSportingRoster(html) {
  const $ = load(html), players = [];
  $('.players__item').each((_, el) => {
    const card = $(el), url = safeUrl(card.find('a').attr('href'), 'https://www.sporting.pt');
    const name = card.find('.item__name').text().trim();
    if (!url || !name) return;
    const coach = url.includes('/equipa-tecnica/');
    const group = card.closest('ul').prevAll('.title').first().text().trim();
    const positions = { 'Guarda-redes': 'Kaleci', 'Defesa': 'Savunma', 'Médio': 'Orta saha', 'Avançado': 'Hücum', 'Equipa técnica': 'Teknik ekip' };
    players.push({ id: idFor(url), name, number: card.find('.item__number').text().trim(), position: positions[group] || group || (coach ? 'Teknik ekip' : 'Oyuncu'), image: safeUrl(card.find('img').attr('src')), sourceUrl: url, coach });
  });
  if (players.length < 11) throw new Error('Resmî kadro listesi okunamadı');
  return players;
}
export function parseEspnRoster(data) {
  if (!Array.isArray(data.athletes)) throw new Error('Kadro yanıtı beklenen biçimde değil');
  const positions = { G: 'Kaleci', D: 'Savunma', M: 'Orta saha', F: 'Hücum' };
  return data.athletes.map(a => ({ id: String(a.id), name: a.displayName, number: a.jersey || '', position: positions[a.position?.abbreviation] || a.position?.displayName || 'Oyuncu', image: safeUrl(a.headshot?.href), sourceUrl: safeUrl(a.links?.find(l => l.rel?.includes('playercard'))?.href), coach: false })).filter(a => a.name);
}

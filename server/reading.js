import { load } from 'cheerio';
import { fold, text } from './providers.js';
import { briefs } from './editorial.js';

export function exclusionReason(item) {
  const t = fold(item.title);
  if (/hangi kanal|saat kacta|ne zaman|canli (izle|yayin)|sifresiz mi|sifreli mi|nasil izlen|maci(nin)? hakemi|hakem.*belli oldu|maca dogru|onde (ver|assistir)|a que horas/.test(t)) return 'match-facts';
  if (/flas|sok[ !:]|surpriz karar|bomba|inanilmaz|soke|herkesi sasirt|yer yerinden|ortalik karis|iste (o|detay)|neler oluyor|olay (karar|aciklama)|beklenmedik|\.{3}|…|\?$|kimler var/.test(t)) return 'clickbait';
  if (/bilet|bilhetes|passolig|ingressos/.test(t)) return 'tickets';
  return null;
}
export function articleAllowed(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.port && !u.username && !u.password && (
    u.hostname === 'www.sporting.pt' && u.pathname.startsWith('/pt/noticias/futebol/equipa-principal/') ||
    u.hostname === 'www.galatasaray.org' && u.pathname.startsWith('/haber/futbol/'));
  } catch { return false; }
}
export function parseArticle(html, url) {
  const $ = load(html); $('script,style,nav,footer,aside,form').remove();
  const root = new URL(url).hostname === 'www.sporting.pt' ? $('.noticia__content .content__body').first() : $('[itemprop="articleBody"],.news-detail-content,.newsDetail,.news-content,.haber-detay').first();
  const paragraphs = root.find('p').map((_, e) => text($(e).text())).get().filter(p => p.length > 60 && !/copyright|todos os direitos|çerez|cookie/i.test(p));
  if (!paragraphs.length) throw new Error('Okunabilir haber metni bulunamadı');
  return paragraphs;
}
export function makeReading(item, paragraphs, checkedAt = new Date().toISOString()) {
  const brief = briefs.get(item.url);
  if (brief) return { ...brief, kind: 'brief', language: 'tr', checkedAt };
  // Short source excerpt only. Do not mirror or republish an entire third-party article.
  const words = paragraphs.join(' ').split(/\s+/);
  if (words.length < 12) return null;
  const titleWords = item.title.split(/\s+/).length;
  if (titleWords > 17) return null;
  const excerpt = words.slice(0, Math.max(8, 25 - titleWords)).join(' ') + (words.length > 25 - titleWords ? '…' : '');
  return { title: item.title, paragraphs: [excerpt], kind: 'excerpt', language: item.language, checkedAt };
}
export function readableNews(items, readings) {
  const unique = new Set();
  return items.flatMap(n => {
    if (exclusionReason(n)) return [];
    const reading = readings[n.id];
    if (!reading?.paragraphs?.length) return [];
    const key = fold(reading.title).replace(/[^\p{L}\p{N}]/gu, '');
    if (unique.has(key)) return [];
    unique.add(key);
    return [{ ...n, title: reading.title, summary: reading.paragraphs[0], category: reading.category || n.category, reading }];
  });
}
export function parseMatchDetails(data, fixture) {
  if (String(data.header?.id) !== fixture.id) throw new Error('Maç kimliği eşleşmiyor');
  const competition = data.header.competitions?.[0];
  const official = data.gameInfo?.officials?.find(o => /referee|hakem/i.test(o.type?.name || o.position?.name || '')) || data.gameInfo?.officials?.[0];
  return { referee: official?.displayName || official?.fullName || null, broadcasts: (competition?.broadcasts || []).flatMap(b => b.region && b.media?.shortName ? [{ country: b.region.toUpperCase(), channel: b.media.shortName, access: 'unknown', source: 'ESPN', sourceUrl: fixture.sourceUrl }] : []), source: 'ESPN', sourceUrl: fixture.sourceUrl, checkedAt: new Date().toISOString() };
}
export function parseTrtBroadcast(html, fixture) {
  const $ = load(html); $('script,style').remove();
  const body = text($('body').text());
  const day = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }).format(new Date(fixture.date));
  const match = body.match(/Sporting CP\s*-\s*Galatasaray.{0,180}/)?.[0] || '';
  if (fixture.opponent.id !== '2250' || !match.includes(day) || !match.includes('TRT 1')) throw new Error('Bu maç için TRT yayın duyurusu doğrulanamadı');
  return { country: 'TR', channel: 'TRT 1', access: fixture.date >= '2024-07-01' && fixture.date < '2027-07-01' ? 'free' : 'unknown', accessSourceUrl: 'https://www.trthaber.com/haber/spor/sampiyonlar-ligi-avrupa-ligi-ve-konferans-ligi-trtde-832018.html', note: 'Türkiye yayını. Yurt dışı ve uydu erişimi bölgesel kısıtlamalara tabi olabilir.', source: 'TRT 1 · yayın duyurusu', sourceUrl: 'https://www.trt1.com.tr/', checkedAt: new Date().toISOString() };
}
export function parseRefereeReport(html, fixture) {
  const $ = load(html); $('script,style').remove(); const body = text($('body').text());
  if (fixture.id !== '401915447' || fixture.date.slice(0,10) !== '2026-09-09' || !body.includes('9 Eylül') || !body.includes('Sporting')) throw new Error('Hakem haberinin maçı eşleşmiyor');
  const referee = body.match(/hakem\s+([A-ZÇĞİÖŞÜ][\p{L}]+\s+[A-ZÇĞİÖŞÜ][\p{L}]+)\s+yönetecek/u)?.[1];
  if (!referee) throw new Error('Hakem adı doğrulanamadı');
  return { referee, source: 'beIN SPORTS · UEFA ataması haberi', sourceUrl: 'https://beinsports.com.tr/haber/galatasaray-sporting-macinin-hakemi-belli-oldu', checkedAt: new Date().toISOString() };
}

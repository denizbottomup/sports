import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFixtures, parseRss, parseSportingRoster, mediaAllowed, safeUrl } from './providers.js';

test('fixture parser rejects past and completed fixtures and preserves TBD', () => {
  const event = (id, date, completed = false, detail = 'Scheduled') => ({ id, date, competitions: [{ status: { type: { completed, detail } }, competitors: [{ team: { id: '432', displayName: 'Galatasaray' }, homeAway: 'away' }, { team: { id: '2250', displayName: 'Sporting CP' }, homeAway: 'home' }] }] });
  const items = parseFixtures({ events: [event('past', '2026-09-01T19:00Z'), event('complete', '2026-09-09T19:00Z', true), event('next', '2026-09-09T19:00Z'), event('tbd', '2026-09-12T19:00Z', false, 'TBD')] }, { id: 'uefa.champions', name: 'Şampiyonlar Ligi' }, '432', Date.parse('2026-09-08T12:00Z'));
  assert.deepEqual(items.map(x => x.id), ['next', 'tbd']);
  assert.equal(items[0].opponent.name, 'Sporting CP'); assert.equal(items[0].home, false); assert.equal(items[1].dateConfirmed, false);
});
test('official RSS excludes other sports and preserves an unknown publication time', () => {
  const xml = '<rss><channel><item><title>Yelken</title><link>https://www.galatasaray.org/haber/su-sporlari/1</link></item><item><title>Hazırlıklar</title><link>https://www.galatasaray.org/haber/futbol/2</link><description>&lt;b&gt;Antrenman&lt;/b&gt;</description></item><item><title>Kadın futbol</title><link>https://www.galatasaray.org/haber/futbol/kadin-futbol/3</link></item></channel></rss>';
  const rows = parseRss(xml, { id: 'gs-news', name: 'Galatasaray', official: true, urlRequire: '/haber/futbol/', urlExclude: /kadin-futbol|akademi|altyapi/ }, '432');
  assert.equal(rows.length, 1); assert.equal(rows[0].publishedAt, null); assert.equal(rows[0].summary, 'Antrenman');
});
test('press stories require the opponent in the headline and are not official', () => {
  const xml = '<rss><channel><item><title>Sporting hazırlıkları - Yayıncı</title><source url="https://example.com">Yayıncı</source><link>https://news.google.com/rss/articles/one</link><pubDate>Tue, 08 Sep 2026 10:00:00 GMT</pubDate></item><item><title>Başka takım</title><link>https://news.google.com/rss/articles/two</link></item></channel></rss>';
  const rows = parseRss(xml, { id: 'press', name: 'Basın', official: false }, '2250', ['Sporting']);
  assert.equal(rows.length, 1); assert.equal(rows[0].title, 'Sporting hazırlıkları'); assert.equal(rows[0].source, 'Yayıncı'); assert.equal(rows[0].official, false);
});
test('image proxy admits only known public image hosts and strips executable URLs', () => {
  assert.equal(mediaAllowed('https://a.espncdn.com/i/teamlogos/soccer/500/432.png'), true);
  for (const url of ['http://127.0.0.1/image', 'https://a.espncdn.com.evil.example/a', 'https://user:pass@a.espncdn.com/a', 'https://a.espncdn.com:8443/a', 'file:///etc/passwd']) assert.equal(mediaAllowed(url), false);
  assert.equal(safeUrl('javascript:alert(1)'), null);
});
test('changed provider markup is treated as a failure, not an empty successful roster', () => {
  assert.throws(() => parseSportingRoster('<html>Unavailable</html>'), /okunamadı/);
});

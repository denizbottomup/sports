import test from 'node:test';
import assert from 'node:assert/strict';
import { exclusionReason, articleAllowed, parseArticle, makeReading, readableNews, parseMatchDetails, parseTrtBroadcast, parseRefereeReport } from './reading.js';
import { formatDate, formatHour } from '../web/src/sports/time.mjs';
const fixture = { id: '401915447', date: '2026-09-09T19:00Z', home: false, team: { id: '432', name: 'Galatasaray', short: 'Galatasaray' }, opponent: { id: '2250', name: 'Sporting CP', short: 'Sporting CP' }, sourceUrl: 'https://www.espn.com/soccer/match/_/gameId/401915447' };
const refereeSpec = { url: 'https://beinsports.com.tr/haber/galatasaray-sporting-macinin-hakemi-belli-oldu', name: 'beIN SPORTS · Hakem ataması', date: '2026-09-09', mustInclude: ['9 Eylül', 'Sporting'] };
test('clickbait, fixture questions and ticket sales stay out of news, factual injury news survives', () => {
  for (const title of ["Sporting'de Galatasaray maçı öncesi flaş karar!", 'Herkesi şaşırtacak karar...', 'Sporting maçı ne zaman, hangi kanalda?', 'Sporting Galatasaray maçının hakemi belli oldu', 'Galatasaray maç kadrosunda kimler var?', 'Sporting biletleri satışta']) assert.ok(exclusionReason({ title }), title);
  assert.equal(exclusionReason({title: 'Ibrahima Ba aldığı darbe nedeniyle kadroya alınmadı'}), null);
});
test('unreadable and blocked stories cannot reappear from old persisted snapshots; duplicate headlines collapse', () => {
 const stories = [{id:'a',title:'Sporting antrenmanı tamamladı'}, {id:'b',title:'Sporting antrenmanı tamamladı'}, {id:'c',title:'Flaş karar!'}, {id:'d',title:'Başlık var ama metin yok'}];
 const readings = Object.fromEntries(stories.slice(0,3).map(n => [n.id, {title:n.title,paragraphs:['Kaynak metni']} ]));
 assert.deepEqual(readableNews(stories,readings).map(n=>n.id),['a']);
});
test('article fetch rejects local addresses, credentials and redirects outside known football pages', () => {
 assert.equal(articleAllowed('https://www.sporting.pt/pt/noticias/futebol/equipa-principal/2026-09-07/report'),true);
 for(const url of ['https://127.0.0.1/private','http://www.sporting.pt/pt/noticias/futebol/equipa-principal/a','https://www.sporting.pt.evil.test/pt/noticias/futebol/equipa-principal/a','https://me@www.sporting.pt/pt/noticias/futebol/equipa-principal/a','https://www.sporting.pt:8443/pt/noticias/futebol/equipa-principal/a','https://www.galatasaray.org/admin']) assert.equal(articleAllowed(url),false);
});
test('article extraction excludes page furniture and never silently treats an error page as content', () => {
 const url='https://www.sporting.pt/pt/noticias/futebol/equipa-principal/report';
 assert.deepEqual(parseArticle('<nav>Navigation</nav><div class="noticia__content"><div class="content__body"><p>Sporting oyuncuları maç öncesindeki son antrenmanlarını bugün kulübün tesislerinde tamamladı.</p></div></div><footer>Footer</footer>',url),['Sporting oyuncuları maç öncesindeki son antrenmanlarını bugün kulübün tesislerinde tamamladı.']);
 assert.throws(()=>parseArticle('<p>Service unavailable</p>',url));
 const n={title:'Antrenman tamamlandı',url,language:'tr'};
 const reading=makeReading(n,[Array(90).fill('kelime').join(' ')]);
 assert.equal(reading.kind,'excerpt'); assert.ok(reading.paragraphs.join(' ').split(/\s+/).length+n.title.split(/\s+/).length<=25);
});
test('fixture facts validate event identity and broadcaster region without guessing encryption', () => {
 const data={header:{id:fixture.id,competitions:[{broadcasts:[{region:'us',media:{shortName:'CBSSN'}},{media:{shortName:'Unknown territory'}}]}]},gameInfo:{}};
 assert.throws(()=>parseMatchDetails(data,{...fixture,id:'different'}));
 const facts=parseMatchDetails(data,fixture);assert.equal(facts.referee,null);assert.equal(facts.broadcasts.length,1);assert.equal(facts.broadcasts[0].country,'US');assert.equal(facts.broadcasts[0].access,'unknown');
 assert.equal(parseTrtBroadcast('<body>Sporting CP - Galatasaray UEFA Şampiyonlar Ligi Maçı 9 Eylül Çarşamba günü saat 22.00’de TRT 1 ekranlarında</body>',fixture).channel,'TRT 1');
 assert.throws(()=>parseTrtBroadcast('<body>Sporting CP - Galatasaray 7 Eylül TRT 1</body>',fixture));
 assert.throws(()=>parseRefereeReport('<body>9 Eylül Sporting hakem Espen Eskas yönetecek</body>',{...fixture,date:'2026-09-16T19:00Z'},refereeSpec));
 assert.equal(parseRefereeReport('<body>9 Eylül Sporting maçını hakem Espen Eskas yönetecek</body>',fixture,refereeSpec).referee,'Espen Eskas');
});
test('local kickoff handles date rollover and daylight saving time',()=>{
 assert.equal(formatHour('2026-09-09T19:00Z','Europe/Istanbul'),'22:00');
 assert.equal(formatHour('2026-09-09T19:00Z','Europe/Lisbon'),'20:00');
 assert.equal(formatHour('2026-09-09T19:00Z','America/New_York'),'15:00');
 assert.equal(formatHour('2026-01-09T19:00Z','America/New_York'),'14:00');
 assert.equal(formatDate('2026-09-09T19:00Z',false,'Asia/Tokyo'),'10 Eyl');
});

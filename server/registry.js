// Kulüp başına resmî kaynak kayıtları. Yeni bir kulübün resmî akışını bağlamak için buraya kayıt eklemek yeterlidir;
// kaydı olmayan kulüpler ESPN kadrosu ve basın dizini ile izlenir. Parser konfigürasyonları (urlRequire, urlExclude,
// titleExclude) parseRss tarafından uygulanır.
import { parseRss, parseSportingNews, parseSportingRoster } from './providers.js';

export const clubRegistry = {
  '432': {
    pressTerms: ['Galatasaray'],
    news: [
      { id: 'gs-news', name: 'Galatasaray · Resmî', kind: 'Kulüp haberleri', url: 'https://www.galatasaray.org/xml/gs.rss', publicUrl: 'https://www.galatasaray.org', official: true, interval: 30000, language: 'tr', urlRequire: '/haber/futbol/', urlExclude: /kadin-futbol|akademi|altyapi/, parse: (body, source) => parseRss(body, source, '432') },
    ],
  },
  '2250': {
    pressTerms: ['Sporting'],
    news: [
      { id: 'scp-news', name: 'Sporting CP · Resmî', kind: 'Kulüp haberleri', url: 'https://www.sporting.pt/pt/rss/noticias.xml', publicUrl: 'https://www.sporting.pt/pt/noticias/futebol/equipa-principal', official: true, interval: 30000, language: 'pt', urlRequire: '/futebol/equipa-principal/', titleExclude: /sporting (kansas|gijon|huelva)|futsal|basketbol|futebol feminino/, parse: (body, source) => parseRss(body, source, '2250') },
      { id: 'scp-newsroom', name: 'Sporting CP · Resmî', kind: 'Kulüp haberleri', url: 'https://www.sporting.pt/pt/noticias/futebol/equipa-principal', publicUrl: 'https://www.sporting.pt/pt/noticias/futebol/equipa-principal', official: true, interval: 60000, language: 'pt', teamId: '2250', parse: (body, source) => parseSportingNews(body, source) },
    ],
    roster: { name: 'Sporting CP · Resmî kadro', url: 'https://www.sporting.pt/pt/futebol/equipa-principal/plantel', publicUrl: 'https://www.sporting.pt/pt/futebol/equipa-principal/plantel', parse: parseSportingRoster },
  },
};

// Maça özel, elle doğrulanmış künye kaynakları (editorial.js gibi tarihli içerik kayıtları).
// Fikstür ESPN olay kimliğiyle eşleşir; maç geçince kayıt etkisizdir ve silinebilir.
export const curatedMatchSources = {
  '401915447': {
    trtAnnouncement: true,
    referee: { url: 'https://beinsports.com.tr/haber/galatasaray-sporting-macinin-hakemi-belli-oldu', name: 'beIN SPORTS · Hakem ataması', date: '2026-09-09', mustInclude: ['9 Eylül', 'Sporting'] },
  },
};

// Türk spor basını RSS kaynakları: doğrudan yayıncı bağlantısı ve özet metni verirler.
// Haberler takım terimleriyle eşleşerek ilgili takımların akışına dağıtılır.
export const pressFeeds = [
  { id: 'trtspor', name: 'TRT Spor', url: 'https://www.trtspor.com.tr/rss/futbol.rss', publicUrl: 'https://www.trtspor.com.tr' },
  { id: 'fotomac', name: 'Fotomaç', url: 'https://www.fotomac.com.tr/rss/anasayfa.xml', publicUrl: 'https://www.fotomac.com.tr' },
  { id: 'aspor', name: 'A Spor', url: 'https://www.aspor.com.tr/rss/anasayfa.xml', publicUrl: 'https://www.aspor.com.tr' },
  { id: 'haberturk', name: 'Habertürk Spor', url: 'https://www.haberturk.com/rss/spor.xml', publicUrl: 'https://www.haberturk.com/spor' },
];

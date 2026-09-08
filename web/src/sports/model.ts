export type LeagueId = "tr" | "en" | "es" | "de" | "it" | "fr" | "pt";
export type View = "overview" | "news" | "pulse" | "saved" | "sources" | "fixtures";
export type NewsCategory = "official" | "injury" | "social" | "press";
export type Competition = "league" | "champions" | "europa" | "conference";
export interface Team { id: string; name: string; short: string; initials: string; league: LeagueId; colors: [string, string]; }
export const leagues: { id: LeagueId; name: string; country: string; flag: string }[] = [
  { id: "tr", name: "Süper Lig", country: "Türkiye", flag: "🇹🇷" },
  { id: "en", name: "Premier League", country: "İngiltere", flag: "🏴" },
  { id: "es", name: "LaLiga", country: "İspanya", flag: "🇪🇸" },
  { id: "de", name: "Bundesliga", country: "Almanya", flag: "🇩🇪" },
  { id: "it", name: "Serie A", country: "İtalya", flag: "🇮🇹" },
  { id: "fr", name: "Ligue 1", country: "Fransa", flag: "🇫🇷" },
  { id: "pt", name: "Primeira Liga", country: "Portekiz", flag: "🇵🇹" },
];
export const teams: Team[] = [
  { id: "gs", name: "Galatasaray", short: "Galatasaray", initials: "GS", league: "tr", colors: ["#a31e32", "#edba4e"] },
  { id: "fb", name: "Fenerbahçe", short: "Fenerbahçe", initials: "FB", league: "tr", colors: ["#172b4e", "#eac849"] },
  { id: "bjk", name: "Beşiktaş", short: "Beşiktaş", initials: "BJK", league: "tr", colors: ["#242b2c", "#eceee9"] },
  { id: "ts", name: "Trabzonspor", short: "Trabzonspor", initials: "TS", league: "tr", colors: ["#772e48", "#79b8cf"] },
  { id: "ars", name: "Arsenal", short: "Arsenal", initials: "ARS", league: "en", colors: ["#bd2d35", "#eee5d5"] },
  { id: "liv", name: "Liverpool", short: "Liverpool", initials: "LIV", league: "en", colors: ["#b8223b", "#f7e5cd"] },
  { id: "city", name: "Manchester City", short: "Man. City", initials: "MCI", league: "en", colors: ["#6096b6", "#ebf2f4"] },
  { id: "rma", name: "Real Madrid", short: "Real Madrid", initials: "RM", league: "es", colors: ["#525f96", "#e5d19a"] },
  { id: "bar", name: "Barcelona", short: "Barcelona", initials: "FCB", league: "es", colors: ["#843f66", "#e3b958"] },
  { id: "atm", name: "Atlético Madrid", short: "Atlético", initials: "ATM", league: "es", colors: ["#a83848", "#e9eaf0"] },
  { id: "bay", name: "Bayern Münih", short: "Bayern", initials: "FCB", league: "de", colors: ["#be3f4c", "#e2eafa"] },
  { id: "bvb", name: "Borussia Dortmund", short: "Dortmund", initials: "BVB", league: "de", colors: ["#35372c", "#e4ca49"] },
  { id: "lev", name: "Bayer Leverkusen", short: "Leverkusen", initials: "B04", league: "de", colors: ["#b83740", "#eae6de"] },
  { id: "int", name: "Inter", short: "Inter", initials: "INT", league: "it", colors: ["#244b93", "#d9c17a"] },
  { id: "mil", name: "Milan", short: "Milan", initials: "ACM", league: "it", colors: ["#a8313c", "#e5dbce"] },
  { id: "juv", name: "Juventus", short: "Juventus", initials: "JUV", league: "it", colors: ["#333b36", "#efeee8"] },
  { id: "psg", name: "Paris Saint-Germain", short: "PSG", initials: "PSG", league: "fr", colors: ["#274467", "#e79188"] },
  { id: "om", name: "Olympique Marsilya", short: "Marsilya", initials: "OM", league: "fr", colors: ["#488ba9", "#e7e8d9"] },
  { id: "lyo", name: "Olympique Lyon", short: "Lyon", initials: "OL", league: "fr", colors: ["#30548a", "#e8d09a"] },
  { id: "por", name: "Porto", short: "Porto", initials: "FCP", league: "pt", colors: ["#2955a3", "#e6ebef"] },
  { id: "ben", name: "Benfica", short: "Benfica", initials: "SLB", league: "pt", colors: ["#bf3942", "#e9d799"] },
  { id: "spo", name: "Sporting CP", short: "Sporting", initials: "SCP", league: "pt", colors: ["#347d59", "#dfdbac"] },
];
export const competitionNames: Record<Competition, string> = { league: "Lig maçı", champions: "Şampiyonlar Ligi", europa: "Avrupa Ligi", conference: "Konferans Ligi" };
export interface Fixture { id: string; team: Team; opponent: Team; competition: Competition; date: string; home: boolean; round: string; }
export function getFixtures(teamId: string): Fixture[] {
  const team = teams.find(t => t.id === teamId) ?? teams[0];
  const leagueTeams = teams.filter(t => t.league === team.league);
  const rival = leagueTeams[(leagueTeams.findIndex(t => t.id === team.id) + 1) % leagueTeams.length];
  const euro = [teams.find(t => t.id === "por")!, teams.find(t => t.id === "ars")!].find(t => t.league !== team.league)!;
  return [
    { id: `demo-${team.id}-league`, team, opponent: rival, competition: "league", date: "2026-09-14T20:00:00+03:00", home: false, round: "5. hafta" },
    ...(["champions", "europa", "conference"] as const).map(competition => ({ id: `demo-${team.id}-${competition}`, team, opponent: euro, competition, date: "2026-09-17T22:00:00+03:00", home: true, round: competition === "champions" ? "Lig aşaması" : "Alternatif senaryo" })),
  ];
}
export function fixtureDate(date: string) { return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" }).format(new Date(date)); }
export function fixtureTime(date: string) { return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(date)); }
export interface NewsItem { id: string; fixtureId: string; category: NewsCategory; title: string; summary: string; body: string; source: string; minutesAgo: number; impact: "Önemli gelişme" | "Takip edilmeli" | "Gündem"; isNew?: boolean; }
export const categoryLabels: Record<NewsCategory, string> = { official: "Resmî açıklama", injury: "Kadro & sağlık", social: "Taraftar gündemi", press: "Basın" };
export function getNews(fixture: Fixture): NewsItem[] {
  const name = fixture.opponent.name;
  const base = { fixtureId: fixture.id };
  return [
    { ...base, id: `${fixture.id}-training`, category: "official", title: `${name}'de maç hazırlıkları son antrenmanla devam etti`, summary: "Takım, taktik çalışmanın ardından duran top organizasyonları üzerinde durdu. Antrenmandan öne çıkanlar rakip dosyasında.", body: "Bu kurgusal senaryoda kulübün antrenman açıklaması yeni yayımlandı. Takımın taktik hazırlığı ve duran top çalışması haber olarak gösteriliyor. Gerçek kulüp açıklaması veya güncel haber değildir. Canlı bağlantı eklendiğinde burada özgün açıklamanın bağlantısı, yayın zamanı ve son kontrol bilgisi bulunacak.", source: "Kulüp açıklaması", minutesAgo: 12, impact: "Önemli gelişme", isNew: true },
    { ...base, id: `${fixture.id}-injury`, category: "injury", title: "Savunmada bir oyuncunun durumu maç saatinde netleşecek", summary: "Bireysel çalışmasını sürdüren oyuncu için henüz kesin bir kadro kararı yok. Son sağlık güncellemesi takip ediliyor.", body: "Örnek kadro senaryosu: bir savunma oyuncusunun durumu belirsiz, bir orta saha oyuncusu takım antrenmanına döndü. Antrenmana dönüş, kesin olarak maçta oynayacağı anlamına gelmez. Bunlar gerçek oyunculara ait sağlık bilgileri değildir.", source: "Örnek sağlık raporu", minutesAgo: 34, impact: "Takip edilmeli" },
    { ...base, id: `${fixture.id}-coach`, category: "press", title: "Teknik direktörün planında orta saha kontrolü öne çıkıyor", summary: "Maç öncesi basın toplantısı senaryosunda teknik ekip, ikinci toplara ve oyunun temposuna dikkat çekiyor.", body: "Bu bir basın toplantısı gösterim örneğidir. Gerçek kişiye ait bir alıntı kullanılmamıştır. Kaynak bağlandığında açıklamalar özgün dilde korunacak; Türkçe özet ayrıca işaretlenecek. Teknik yorum ile doğrulanmış kadro bilgisi ayrı sunulacak.", source: "Basın toplantısı", minutesAgo: 58, impact: "Gündem" },
    { ...base, id: `${fixture.id}-support`, category: "social", title: "Taraftarların gündemi: ilk 11 ve hücum tercihleri", summary: "Örnek konuşmalarda takıma güven yüksek; teknik direktörün kanat tercihleri ise görüşleri ikiye bölüyor.", body: "Bu kart canlı sosyal medya analizi değildir. Arayüzü göstermek için hazırlanmış örnek dağılımlar kullanır. Gerçek analizde paylaşım bağlantıları, platform, örneklem büyüklüğü ve belirsiz yorumlar görülebilecek. Taraftarın güveni maçın kazanılma olasılığı değildir.", source: "Örnek sosyal analiz", minutesAgo: 85, impact: "Gündem" },
    { ...base, id: `${fixture.id}-return`, category: "official", title: "Orta sahadan iyi haber: takım çalışmasına geri dönüş", summary: "Kontrollü çalışmanın ardından antrenmana katılım. Maç kadrosu için resmî açıklama bekleniyor.", body: "Kurgusal gelişme: antrenmana dönen oyuncu henüz maç kadrosuna alınmış olarak gösterilmiyor. Ürün, iyileşme haberi ile oyuncunun bu organizasyondaki uygunluğunu birbirinden ayırır.", source: "Kulüp açıklaması", minutesAgo: 132, impact: "Takip edilmeli" },
    { ...base, id: `${fixture.id}-schedule`, category: "press", title: "Yoğun fikstürde hazırlık süresi ve rotasyon gündemde", summary: "Lig ve Avrupa takvimi birlikte değerlendiriliyor. Rakibin son maçından bu yana geçen süre dosyaya eklendi.", body: "Fikstür yoğunluğunu anlatan örnek içeriktir. Gerçek maç takvimi değildir. Veri sağlayıcısı bağlandığında takımın tüm organizasyonlardaki maçları ortak takım kimliğiyle eşleştirilecek.", source: "Maç önü notları", minutesAgo: 180, impact: "Gündem" },
  ];
}
export function simulatedNews(fixture: Fixture): NewsItem { return { id: `${fixture.id}-simulation`, fixtureId: fixture.id, category: "official", title: "Yeni gelişme: maç kadrosu senaryosu güncellendi", summary: "Akış demosu: örnek bir kulüp açıklaması dosyana eklendi. Haber kartı, ayrıntılı özeti beklemeden görüntülendi.", body: "Bu haber ‘Akışı dene’ düğmesiyle oluşturuldu. Herhangi bir dış kaynaktan alınmadı. Canlı sürümde aynı arayüz yeni sunucu olaylarını karşılayacak.", source: "Akış simülasyonu", minutesAgo: 0, impact: "Önemli gelişme", isNew: true }; }
export interface PulseData { positive: number; negative: number; mixed: number; total: number; coach: number; change: number; }
export function getPulse(fixture: Fixture, platform: "x" | "youtube"): PulseData {
  const isEurope = fixture.competition !== "league";
  if (platform === "youtube") return isEurope ? { positive: 32, negative: 24, mixed: 24, total: 80, coach: 51, change: -3 } : { positive: 52, negative: 12, mixed: 16, total: 80, coach: 62, change: 4 };
  return isEurope ? { positive: 65, negative: 35, mixed: 28, total: 128, coach: 54, change: -5 } : { positive: 87, negative: 23, mixed: 18, total: 128, coach: 54, change: 8 };
}
export const demoOpinions = [
  { name: "Örnek görüş 01", target: "Maça güven", sentiment: "İyimser", text: "Son maçtaki enerjiyi korursak bu karşılaşmadan iyi bir sonuç çıkarabiliriz." },
  { name: "Örnek görüş 02", target: "Teknik direktör", sentiment: "Karışık", text: "Takıma inanıyorum ama hocanın ilk 11 tercihleri konusunda hâlâ soru işaretlerim var." },
  { name: "Örnek görüş 03", target: "Savunma", sentiment: "Endişeli", text: "Hücumda üretkeniz. Savunmada verdiğimiz boşluklar bu maçta sorun olabilir." },
];
export const storageKeys = { team: "touchline.team.v1", saved: "touchline.saved.v1", followed: "touchline.followed.v1" };
export function readStored<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T { try { const raw = localStorage.getItem(key); const value: unknown = raw ? JSON.parse(raw) : null; return valid(value) ? value : fallback; } catch { return fallback; } }
export function saveStored(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Retain in-memory preferences if browser storage is unavailable. */ } }
export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string");

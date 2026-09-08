import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, ExternalLink, Filter, Globe2, LayoutDashboard, Menu, MessageCircle, Newspaper, Plus, Radio, Search, ShieldCheck, SlidersHorizontal, Sparkles, Trophy, Users, X, Zap } from "lucide-react";
import { categoryLabels, competitionNames, demoOpinions, fixtureDate, fixtureTime, getFixtures, getNews, getPulse, isStringArray, leagues, readStored, saveStored, simulatedNews, storageKeys, teams, type Competition, type Fixture, type LeagueId, type NewsCategory, type NewsItem, type Team, type View } from "./model";
import "./base.css";
import "./sports.css";

const navItems = [
  { id: "overview" as const, label: "Genel bakış", icon: LayoutDashboard },
  { id: "news" as const, label: "Haber akışı", icon: Newspaper },
  { id: "pulse" as const, label: "Taraftar nabzı", icon: Activity },
  { id: "fixtures" as const, label: "Maç takvimi", icon: CalendarDays },
  { id: "saved" as const, label: "Kaydedilenler", icon: Bookmark },
];
const categoryIcons = { official: ShieldCheck, injury: Plus, social: MessageCircle, press: Newspaper };

function Crest({ team, size = "medium" }: { team: Team; size?: "tiny" | "small" | "medium" | "large" }) {
  return <span className={`crest crest-${size}`} style={{ "--crest-bg": team.colors[0], "--crest-ink": team.colors[1] } as CSSProperties} aria-label={`${team.name} monogramı`}><span>{team.initials}</span></span>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el?.showModal();
    return () => { el?.close(); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`tl-modal ${wide ? "wide" : ""}`} aria-labelledby="dialog-heading" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-header"><div><span className="eyebrow">TOUCHLINE</span><h2 id="dialog-heading">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={21} /></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}

function TeamPicker({ selected, league, onSelect, onClose }: { selected: string; league: LeagueId | "all"; onSelect: (team: Team) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeagueId | "all">(league);
  const matches = teams.filter(t => (filter === "all" || t.league === filter) && t.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")));
  return <Modal title="Senin takımın. Senin gündemin." onClose={onClose} wide>
    <p className="muted">Takımını seç, yaklaşan rakibinin dosyasını aç.</p>
    <label className="picker-search"><Search size={18} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Takım ara…" aria-label="Takım ara" /></label>
    <div className="league-filters"><button onClick={() => setFilter("all")} className={filter === "all" ? "selected" : ""}>Tüm ligler</button>{leagues.map(l => <button key={l.id} className={filter === l.id ? "selected" : ""} onClick={() => setFilter(l.id)}>{l.flag} {l.country}</button>)}</div>
    <div className="team-grid">{matches.map(team => <button key={team.id} className={`team-choice ${selected === team.id ? "selected" : ""}`} onClick={() => onSelect(team)}><Crest team={team} /><span><strong>{team.name}</strong><small>{leagues.find(l => l.id === team.league)?.name}</small></span>{selected === team.id && <Check size={18} />}</button>)}</div>
    {matches.length === 0 && <Empty title="Bu aramada takım bulunamadı" description="Başka bir isim dene veya tüm liglere göz at." />}
    <div className="demo-note"><CircleHelp size={15} /> İlk prototipte 7 ligden 22 örnek takım var. Tam takım listesi canlı veri bağlantısıyla eklenecek.</div>
  </Modal>;
}

function Empty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><Bookmark size={27} /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

function FixtureButton({ fixture, active, onSelect }: { fixture: Fixture; active: boolean; onSelect: () => void }) {
  const league = leagues.find(l => l.id === fixture.team.league)!;
  return <button className={`fixture-button ${active ? "active" : ""}`} onClick={onSelect} aria-pressed={active}>
    <div className="fixture-top"><span>{fixture.competition === "league" ? <Trophy size={13} /> : <Globe2 size={13} />}{fixture.competition === "league" ? league.name : competitionNames[fixture.competition]}</span><span>{fixtureDate(fixture.date)} · {fixtureTime(fixture.date)}</span></div>
    <div className="fixture-teams"><Crest team={fixture.home ? fixture.team : fixture.opponent} size="tiny" /><strong>{fixture.home ? fixture.team.short : fixture.opponent.short}</strong><span className="vs">vs</span><Crest team={fixture.home ? fixture.opponent : fixture.team} size="tiny" /><strong>{fixture.home ? fixture.opponent.short : fixture.team.short}</strong><ChevronRight size={16} /></div>
  </button>;
}

function NewsCard({ item, saved, onSave, onOpen }: { item: NewsItem; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const Icon = categoryIcons[item.category];
  return <article className={`news-card ${item.isNew ? "fresh" : ""}`}>
    <div className={`news-icon ${item.category}`}><Icon size={20} strokeWidth={1.7} /></div>
    <div className="news-body"><div className="news-meta"><span className={`category ${item.category}`}>{categoryLabels[item.category]}</span><span className="meta-dot">·</span><span title="Örnek senaryoya ait zaman">{item.minutesAgo === 0 ? "Şimdi · demo" : item.minutesAgo < 60 ? `${item.minutesAgo} dk önce` : `${Math.floor(item.minutesAgo / 60)} sa önce`}</span>{item.isNew && <span className="new-tag">YENİ</span>}</div>
      <button className="news-title" onClick={onOpen}>{item.title}</button><p>{item.summary}</p>
      <div className="news-footer"><span><span className="source-mark">{item.source[0]}</span>{item.source}</span><button onClick={onOpen}>Haberi incele <ArrowUpRight size={14} /></button></div>
    </div>
    <button className={`save-button ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? `Kaydı kaldır: ${item.title}` : `Haberi kaydet: ${item.title}`} aria-pressed={saved}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button>
  </article>;
}

function PulseCard({ fixture, expanded = false, onExpand }: { fixture: Fixture; expanded?: boolean; onExpand?: () => void }) {
  const [platform, setPlatform] = useState<"x" | "youtube">("x");
  const [details, setDetails] = useState(false);
  const pulse = getPulse(fixture, platform);
  const percent = Math.round(pulse.positive / pulse.total * 100);
  const negative = Math.round(pulse.negative / pulse.total * 100);
  const mixed = 100 - percent - negative;
  return <section className={`panel pulse-panel ${expanded ? "expanded" : ""}`}>
    <div className="panel-heading"><h3><Activity size={18} /> Taraftar nabzı</h3><span className="small-pill">Örnek analiz</span></div>
    <p className="panel-description">{fixture.opponent.short} taraftarı bu maça inanıyor mu?</p>
    <div className="pulse-platform" aria-label="Örnek analiz platformu"><button className={platform === "x" ? "active" : ""} onClick={() => setPlatform("x")} aria-pressed={platform === "x"}>𝕏 <span>X paylaşımları</span></button><button className={platform === "youtube" ? "active" : ""} onClick={() => setPlatform("youtube")} aria-pressed={platform === "youtube"}>▶ <span>YouTube</span></button><span>Son 24 saat</span></div>
    <div className="confidence"><div><span className="confidence-label">MAÇA GÜVEN</span><div className="confidence-value">%{percent}<span>{percent >= 60 ? "İyimser" : "Görüşler bölünmüş"}</span></div></div><span className={`trend ${pulse.change < 0 ? "down" : ""}`}>{pulse.change < 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}{pulse.change > 0 ? "+" : ""}{pulse.change} puan<small>önceki 24 saate göre</small></span></div>
    <div className="distribution" aria-label={`Örnek dağılım: yüzde ${percent} iyimser, ${mixed} karışık, ${negative} karamsar`}><span style={{ width: `${percent}%` }} /><span style={{ width: `${mixed}%` }} /><span style={{ width: `${negative}%` }} /></div>
    <div className="distribution-labels"><span><i />İyimser <strong>%{percent}</strong></span><span><i />Karışık <strong>%{mixed}</strong></span><span><i />Karamsar <strong>%{negative}</strong></span></div>
    <div className="pulse-insight"><Sparkles size={17} /><p>{fixture.competition === "league" ? "Takıma güven var. İlk 11 tercihleri ve savunma düzeni en çok tartışılan konular." : "Avrupa maçı için temkinli bir hava var. Taraftarlar orta saha kontrolünü belirleyici görüyor."}</p></div>
    <div className="coach-line"><span>Teknik direktöre destek</span><strong>%{pulse.coach}</strong></div><div className="coach-track"><span style={{ width: `${pulse.coach}%` }} /></div>
    <div className="sample-note"><Users size={13} />{pulse.total} temsili hesap · Gerçek ölçüm değil<button aria-label="Analiz yöntemi" onClick={() => setDetails(!details)} aria-expanded={details}><CircleHelp size={14} /></button></div>
    {details && <div className="method-note">Sayılar arayüzü göstermek için kurgulandı. Payda: {pulse.total} temsili hesap; {pulse.positive} iyimser, {pulse.mixed} karışık, {pulse.negative} karamsar. Platformlar ayrı tutulur. Gerçek sürümde belirsiz yorum sayısı ve kaynaklar da gösterilecek. Bu oran galibiyet olasılığı değildir.</div>}
    {expanded ? <div className="opinions"><h4>Konuşmalardan bir kesit</h4><p className="muted">Aşağıdaki metinler kurgusaldır; gerçek kullanıcılara ait değildir.</p>{demoOpinions.map(opinion => <article key={opinion.name}><div><span className="opinion-avatar"><Users size={16} /></span><strong>{opinion.name}</strong><span>{opinion.target}</span></div><p>“{opinion.text}”</p><small>{opinion.sentiment} · Örnek görüş</small></article>)}</div> : <button className="panel-link" onClick={onExpand}>Taraftar nabzını keşfet <ArrowRight size={15} /></button>}
  </section>;
}

function SquadPanel({ onOpen }: { onOpen: () => void }) {
  return <section className="panel squad-panel"><div className="panel-heading"><h3><Users size={18} /> Kadroda son durum</h3><span className="tiny-muted">Demo</span></div><p className="panel-description">Maç öncesi takip edilmesi gerekenler</p>
    {[{ role: "Savunma oyuncusu", detail: "Bireysel çalışıyor", status: "Belirsiz", cls: "uncertain", initials: "S" }, { role: "Orta saha oyuncusu", detail: "Takım antrenmanına döndü", status: "Geri döndü", cls: "returned", initials: "O" }, { role: "Hücum oyuncusu", detail: "Örnek maç cezası", status: "Cezalı", cls: "out", initials: "H" }].map(p => <div className="squad-row" key={p.role}><span className="player-avatar">{p.initials}</span><div><strong>{p.role}</strong><small>{p.detail}</small></div><span className={`status-pill ${p.cls}`}>{p.status}</span></div>)}
    <button className="panel-link" onClick={onOpen}>Kadro notlarını incele <ArrowRight size={15} /></button>
  </section>;
}

function SourcesView() {
  const sources = [
    { name: "Kulüp & federasyon", type: "Resmî haberler", letter: "K", text: "Antrenman, sağlık açıklamaları ve organizasyona özel kararlar. Kulüp bazında kaynak doğrulaması yapılacak.", url: "https://www.tff.org/Default.aspx?pageId=937", label: "TFF haber sayfası" },
    { name: "TRT Haber Spor", type: "Haber RSS", letter: "T", text: "RSS erişimi araştırma aşamasında doğrulandı. Bu web sürümüne henüz canlı akış olarak bağlanmadı.", url: "https://www.trthaber.com/sitene_ekle.html", label: "RSS kaynak listesi" },
    { name: "API-Football", type: "Fikstür & kadro", letter: "A", text: "API anahtarı ve her organizasyonun güncel sezon kapsamı gerekiyor. Anahtarlar yalnızca sunucuda saklanacak.", url: "https://www.api-football.com/coverage", label: "Veri kapsamı" },
    { name: "X", type: "Haber & taraftar görüşleri", letter: "𝕏", text: "Filtered Stream için geliştirici erişimi ve kullanım bütçesi gerekiyor. Henüz paylaşım toplanmıyor.", url: "https://docs.x.com/x-api/posts/filtered-stream/introduction", label: "Akış dokümanı" },
    { name: "YouTube", type: "Video & yorumlar", letter: "▶", text: "Yeni video bildirimleri ve yorum toplama ayrı bağlantılardır. Canlı yorum analizi henüz bağlı değil.", url: "https://developers.google.com/youtube/v3/docs/commentThreads/list", label: "Yorum API dokümanı" },
  ];
  return <div className="sources-grid">{sources.map(s => <section className="panel source-card" key={s.name}><div className="source-card-top"><span className="source-logo">{s.letter}</span><span className="connection-status">Bağlı değil</span></div><h3>{s.name}</h3><span className="eyebrow">{s.type}</span><p>{s.text}</p><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></section>)}<section className="source-next"><Radio size={28} /><h3>Her kaynağın durumu görünür.</h3><p>Bağlantı kurulduğunda son kontrol zamanı ve veri kapsamı burada yer alacak.</p></section></div>;
}

export default function SportsApp() {
  const [teamId, setTeamId] = useState(() => readStored(storageKeys.team, "gs", (v): v is string => typeof v === "string" && teams.some(t => t.id === v)));
  const [view, setView] = useState<View>("overview");
  const [competition, setCompetition] = useState<Competition>("league");
  const [euroCompetition, setEuroCompetition] = useState<Exclude<Competition, "league">>("champions");
  const [picker, setPicker] = useState<LeagueId | "all" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(() => readStored(storageKeys.saved, [] as string[], isStringArray));
  const [followed, setFollowed] = useState(() => readStored(storageKeys.followed, ["gs"], isStringArray));
  const [filter, setFilter] = useState<"all" | NewsCategory>("all");
  const [search, setSearch] = useState("");
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);
  const [info, setInfo] = useState(false);
  const [simulatedIds, setSimulatedIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const fixtures = useMemo(() => getFixtures(teamId), [teamId]);
  const fixture = fixtures.find(f => f.competition === competition)!;
  const team = fixture.team;
  const opponent = fixture.opponent;
  const news = useMemo(() => [...(simulatedIds.includes(fixture.id) ? [simulatedNews(fixture)] : []), ...getNews(fixture)], [fixture, simulatedIds]);
  const allNews = useMemo(() => teams.flatMap(t => getFixtures(t.id).flatMap(f => [...getNews(f), simulatedNews(f)])), []);
  const savedNews = allNews.filter(n => savedIds.includes(n.id));
  const visibleNews = (view === "saved" ? savedNews : news).filter(n => (filter === "all" || n.category === filter) && `${n.title} ${n.summary} ${n.source}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));
  const league = leagues.find(l => l.id === team.league)!;
  const isFollowing = followed.includes(teamId);
  const currentNav = navItems.find(n => n.id === view);

  useEffect(() => { saveStored(storageKeys.team, teamId); }, [teamId]);
  useEffect(() => { saveStored(storageKeys.saved, savedIds); }, [savedIds]);
  useEffect(() => { saveStored(storageKeys.followed, followed); }, [followed]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 3500); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    function shortcut(e: KeyboardEvent) { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); } if (e.key === "Escape") setMobileOpen(false); }
    window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut);
  }, []);

  function navigate(next: View) { setView(next); setSearch(""); setFilter("all"); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function chooseTeam(next: Team) { setTeamId(next.id); setCompetition("league"); setPicker(null); setMobileOpen(false); setSearch(""); setFilter("all"); setView("overview"); }
  function selectFixture(next: Fixture) { setCompetition(next.competition); setSearch(""); setFilter("all"); }
  function toggleSave(item: NewsItem) { const exists = savedIds.includes(item.id); setSavedIds(ids => exists ? ids.filter(id => id !== item.id) : [...ids, item.id]); setToast(exists ? "Haber kaydedilenlerden kaldırıldı." : "Haber kaydedildi. Daha sonra kaldığın yerden devam et."); }
  function simulate() { setSimulatedIds(ids => ids.includes(fixture.id) ? ids : [...ids, fixture.id]); setFilter("all"); setSearch(""); setView("news"); setToast("Örnek gelişme akışa eklendi. Bu bir canlı veri bağlantısı değil."); }

  return <div className="sports-app">
    {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Menüyü kapat" />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <button className="brand" onClick={() => navigate("overview")} aria-label="Touchline ana sayfa"><span className="brand-symbol"><span /><span /><span /></span>touchline<span className="brand-period">.</span></button>
      <div className="workspace-label">MAÇ ÖNCESİ AVANTAJIN</div>
      <nav className="primary-nav" aria-label="Ana menü">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined}><Icon size={19} /><span>{label}</span>{id === "saved" && savedIds.length > 0 && <small>{savedIds.length}</small>}{id === "news" && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-section-title"><span>LİGLER</span><Globe2 size={13} /></div>
      <nav className="league-nav" aria-label="Lig seçimi">{leagues.map(l => <button key={l.id} className={team.league === l.id ? "active" : ""} onClick={() => setPicker(l.id)}><span className="flag">{l.flag}</span><span>{l.name}</span>{team.league === l.id && <span className="league-dot" />}</button>)}</nav>
      <button className={`europe-link ${competition !== "league" ? "active" : ""}`} onClick={() => { setCompetition(euroCompetition); navigate("fixtures"); }}><Trophy size={17} />Avrupa kupaları<ChevronRight size={14} /></button>
      <div className="sidebar-section-title tracked-title"><span>TAKİP ETTİKLERİN</span><button onClick={() => setPicker("all")} aria-label="Takım seç"><Plus size={15} /></button></div>
      <div className="followed-teams">{followed.filter(id => teams.some(t => t.id === id)).map(id => { const t = teams.find(t => t.id === id)!; return <button key={id} className={teamId === id ? "active" : ""} onClick={() => chooseTeam(t)}><Crest team={t} size="tiny" /><span>{t.short}</span><ChevronRight size={14} /></button>; })}{followed.length === 0 && <p>Takımını seçip takibe al.</p>}</div>
      <div className="sidebar-bottom"><button className={view === "sources" ? "active" : ""} onClick={() => navigate("sources")}><Radio size={17} />Veri kaynakları<span className="offline-dot" /></button><button onClick={() => setInfo(true)}><CircleHelp size={17} />Touchline hakkında</button><div className="profile"><span>D</span><div><strong>Senin maç merkezin</strong><small>Web önizlemesi · v0.1</small></div><span className="profile-label">DEMO</span></div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Menüyü aç" aria-expanded={mobileOpen}><Menu size={22} /></button><span>Maç merkezi</span><ChevronRight size={13} /><strong>{view === "sources" ? "Veri kaynakları" : currentNav?.label}</strong></div><div className="topbar-right"><label className="global-search"><Search size={16} /><input ref={searchRef} value={search} onChange={e => { setSearch(e.target.value); if (view !== "saved") setView("news"); }} placeholder="Haberlerde ara" aria-label="Haberlerde ara" /><kbd>⌘ K</kbd></label><button className="demo-indicator" onClick={() => setInfo(true)}><span />Demo çalışma alanı</button><button className="icon-button notification-button" onClick={() => setInfo(true)} aria-label="Bildirim ve demo bilgisi"><Bell size={20} /></button></div></header>
      <main className="main-content">
        <div className="page-heading"><div><div className="page-eyebrow"><span /> FUTBOLUN GÜRÜLTÜSÜNDEN UZAK</div><h1>{view === "overview" ? <>Rakibini <em>tanı.</em></> : view === "sources" ? <>Bilginin <em>kaynağı.</em></> : view === "pulse" ? <>Tribünün <em>nabzı.</em></> : view === "saved" ? <>Aklında <em>kalanlar.</em></> : view === "fixtures" ? <>Sıradaki <em>maçlar.</em></> : <>Her gelişme, <em>tek yerde.</em></>}</h1><p>{view === "overview" ? "Maçtan önce bilmen gerekenler. Kaynaklı, düzenli, senin için." : view === "sources" ? "Hangi bilgi nereden geliyor? Bağlantı durumu ve kapsamı burada." : view === "pulse" ? "Rakibin taraftarı ne düşünüyor? Güven, destek ve konuşulanlar." : view === "saved" ? "Kaydettiğin gelişmeler, tüm takımlardan tek bir yerde." : view === "fixtures" ? "Lig ve Avrupa. Her maç için ayrı bir rakip dosyası." : "Rakibindeki gelişmeleri önemini ve kaynağını kaybetmeden takip et."}</p></div><button className="team-selector" onClick={() => setPicker("all")}><Crest team={team} size="small" /><span><small>TAKIMIM</small><strong>{team.short}</strong></span><ChevronDown size={17} /></button></div>

        <div className="preview-banner"><span><span className="preview-icon"><Sparkles size={14} /></span><strong>İlk bakış.</strong> Fikstür, haberler ve analizler örnek veridir.</span><button onClick={() => navigate("sources")}>Kaynak durumları <ArrowUpRight size={14} /></button></div>

        {view === "sources" ? <SourcesView /> : <>
          {view !== "saved" && <div className="fixture-strip"><FixtureButton fixture={fixtures[0]} active={competition === "league"} onSelect={() => selectFixture(fixtures[0])} /><FixtureButton fixture={fixtures.find(f => f.competition === euroCompetition)!} active={competition !== "league"} onSelect={() => selectFixture(fixtures.find(f => f.competition === euroCompetition)!)} /><button className="all-fixtures" onClick={() => navigate("fixtures")}><CalendarDays size={18} /><span>Tüm senaryolar</span><ArrowRight size={15} /></button></div>}

          {view === "fixtures" ? <section className="panel fixture-page"><div className="section-heading"><div><span className="eyebrow">ÖRNEK FİKSTÜR · EYLÜL 2026</span><h2>{team.name} maç senaryoları</h2></div><span className="small-pill">İstanbul saati</span></div><p className="muted">Avrupa kupaları alternatif örneklerdir; takımın gerçek katılımını veya maç takvimini göstermez.</p>{fixtures.map(f => <div className="calendar-row" key={f.id}><div className="calendar-date"><strong>{new Date(f.date).getUTCDate()}</strong><span>EYLÜL</span></div><div className="calendar-info"><small>{f.competition === "league" ? league.name : competitionNames[f.competition]} · {f.round}</small><div><Crest team={f.team} size="small" /><strong>{f.team.short}</strong><span>–</span><Crest team={f.opponent} size="small" /><strong>{f.opponent.short}</strong></div></div><span className="calendar-time">{fixtureTime(f.date)}<small>{f.home ? "İç saha" : "Deplasman"}</small></span><button className="button secondary" onClick={() => { setCompetition(f.competition); if (f.competition !== "league") setEuroCompetition(f.competition); navigate("overview"); }}>Dosyayı aç <ArrowRight size={15} /></button></div>)}</section> : <>

          {(view === "overview" || view === "pulse") && <section className="opponent-hero"><div className="pitch-art" aria-hidden="true"><div className="pitch-line" /><div className="pitch-circle" /><div className="pitch-box" /><span className="pitch-ball" /></div><div className="hero-top"><span className="hero-kicker"><span /> RAKİP DOSYASI <span className="hero-divider">/</span> {competition === "league" ? league.name : competitionNames[competition]}</span><span className="hero-demo">ÖRNEK SENARYO</span></div><div className="hero-main"><Crest team={opponent} size="large" /><div className="hero-team"><span>SIRADAKİ RAKİBİN</span><h2>{opponent.name}</h2><p><CalendarDays size={14} />{fixtureDate(fixture.date)} 2026 · {fixtureTime(fixture.date)}<span>·</span>{fixture.home ? "İç saha" : "Deplasman"}</p></div><button className={`follow-button ${isFollowing ? "following" : ""}`} onClick={() => { setFollowed(ids => isFollowing ? ids.filter(id => id !== teamId) : [...ids, teamId]); setToast(isFollowing ? "Takım takip listesinden çıkarıldı." : "Takım takip listene eklendi."); }}>{isFollowing ? <Check size={16} /> : <Plus size={16} />}{isFollowing ? "Takımın takipte" : "Takımını takip et"}</button></div><div className="hero-bottom"><span><Newspaper size={17} /><strong>{news.length}</strong> örnek gelişme</span><span><Users size={17} /><strong>3</strong> kadro notu</span><span><Activity size={17} />Taraftarlar <strong>{competition === "league" ? "iyimser" : "temkinli"}</strong></span><button onClick={() => { setFilter("official"); setView("news"); }}>Dosyayı keşfet <ArrowUpRight size={16} /></button></div></section>}

          {view === "pulse" ? <div className="pulse-page-grid"><PulseCard key={fixture.id} fixture={fixture} expanded /><div><section className="panel players-panel"><div className="panel-heading"><h3>Oyuncular hakkında</h3><span className="small-pill">Örnek</span></div><p className="panel-description">Memnuniyet ve en çok konuşulan konular</p>{[{ role: "Santrfor", score: 78, topic: "Bitiriciliği övülüyor" }, { role: "Orta saha", score: 64, topic: "Oyun kurulumuna destek" }, { role: "Stoper", score: 39, topic: "Pozisyon alma eleştiriliyor" }].map(p => <div className="player-sentiment" key={p.role}><div><span className="player-avatar">{p.role[0]}</span><span><strong>{p.role}</strong><small>{p.topic}</small></span><b>%{p.score}</b></div><div className="coach-track"><span style={{ width: `${p.score}%` }} /></div></div>)}<p className="sample-note">Oyuncu rolleri ve yüzdeler kurgusaldır.</p></section><section className="method-card"><ShieldCheck size={24} /><h3>Bir puandan fazlası.</h3><p>Maça güven, hocaya destek ve oyuncu memnuniyeti ayrı değerlendirilir. Aynı hesabın tekrarları yeni taraftar sayılmaz.</p><button onClick={() => setInfo(true)}>Nasıl çalışacak? <ArrowRight size={15} /></button></section></div></div> : <div className={`content-grid ${view === "saved" || view === "news" ? "full-feed" : ""}`}>
            <section className="feed-section"><div className="section-heading"><div><h2>{view === "saved" ? "Kaydettiğin haberler" : "Rakipte neler oluyor?"}<span className="count-pill">{view === "saved" ? savedNews.length : news.length}</span></h2><p>{view === "saved" ? "Seçtiğin haberler bu tarayıcıda saklanır." : "Maç öncesi gelişmeler, en yeniden başlayarak."}</p></div>{view !== "saved" && <button className="text-button" onClick={simulate} disabled={simulatedIds.includes(fixture.id)}><Zap size={14} />{simulatedIds.includes(fixture.id) ? "Örnek haber eklendi" : "Akışı dene"}</button>}</div>
              <div className="feed-toolbar"><div className="feed-tabs" aria-label="Haber kategorisi">{([{ id: "all", label: "Tümü" }, { id: "official", label: "Resmî" }, { id: "injury", label: "Kadro & sağlık" }, { id: "social", label: "Sosyal" }, { id: "press", label: "Basın" }] as const).map(tab => <button key={tab.id} className={filter === tab.id ? "active" : ""} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)}>{tab.label}</button>)}</div><span className="sort-label"><SlidersHorizontal size={14} />En yeni</span></div>
              {search && <div className="search-result-label"><Search size={14} />“{search}” için {visibleNews.length} sonuç<button onClick={() => setSearch("")}>Temizle <X size={12} /></button></div>}
              <div className="news-list">{visibleNews.map(item => <NewsCard key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => toggleSave(item)} onOpen={() => setActiveNews(item)} />)}</div>
              {visibleNews.length === 0 && <Empty title={view === "saved" && savedNews.length === 0 ? "İyi bir gelişmeyi kaybetme." : "Bu filtrede haber bulunamadı."} description={view === "saved" && savedNews.length === 0 ? "Haberlerin yanındaki yer imi simgesine dokun. Kaydettiklerin burada seni beklesin." : "Aramayı veya kategori filtresini değiştirerek diğer gelişmeleri görebilirsin."} action={<button className="button secondary" onClick={() => { if (view === "saved" && savedNews.length === 0) navigate("news"); else { setFilter("all"); setSearch(""); } }}>Haberleri göster <ArrowRight size={15} /></button>} />}
              {visibleNews.length > 0 && <div className="feed-end"><Check size={14} />{view === "saved" ? "Tüm kaydedilenler bu kadar." : "Örnek dosyadaki tüm gelişmeleri gördün."}</div>}
            </section>
            {view === "overview" && <aside className="insights-column"><PulseCard key={fixture.id} fixture={fixture} onExpand={() => navigate("pulse")} /><SquadPanel onOpen={() => { setFilter("injury"); setView("news"); }} /><div className="source-mini"><span className="source-mini-icon"><ShieldCheck size={18} /></span><div><strong>Kaynağı belli. Bağlamı yerinde.</strong><p>Her gelişmenin nereden geldiğini bil.</p></div><button onClick={() => navigate("sources")} aria-label="Veri kaynaklarını aç"><ArrowUpRight size={18} /></button></div></aside>}
          </div>}
          </>}
        </>}
        <footer className="page-footer"><span className="footer-brand">touchline.</span><span>Maç başlamadan, hikâyeyi anla.</span><button onClick={() => setInfo(true)}>Örnek veriler hakkında <ArrowUpRight size={12} /></button></footer>
      </main>
    </div>
    {picker !== null && <TeamPicker selected={teamId} league={picker} onClose={() => setPicker(null)} onSelect={chooseTeam} />}
    {activeNews && <Modal title="Gelişmenin ayrıntıları" onClose={() => setActiveNews(null)}><div className="detail-meta"><span className={`category ${activeNews.category}`}>{categoryLabels[activeNews.category]}</span><span className="small-pill">Kurgusal haber</span></div><h2 className="detail-title">{activeNews.title}</h2><p className="detail-summary">{activeNews.summary}</p><div className="detail-source"><ShieldCheck size={18} /><div><strong>{activeNews.source}</strong><small>Canlı kaynak bağlantısı bulunmuyor</small></div></div><p className="detail-body">{activeNews.body}</p><div className="demo-note"><CircleHelp size={16} />Bu içerik ürün önizlemesi için hazırlanmıştır; gerçek bir haber veya oyuncu durumu değildir.</div><button className="button primary" onClick={() => toggleSave(activeNews)}><Bookmark size={16} fill={savedIds.includes(activeNews.id) ? "currentColor" : "none"} />{savedIds.includes(activeNews.id) ? "Kaydedilenlerden kaldır" : "Bu haberi kaydet"}</button></Modal>}
    {info && <Modal title="Maç öncesi, bütün resim." onClose={() => setInfo(false)}><p className="detail-summary">Touchline, seçtiğin takımın yaklaşan rakibindeki gelişmeleri ve taraftarın nabzını bir araya getirir.</p><div className="info-features"><p><Globe2 size={20} /><span><strong>7 lig + Avrupa kupaları</strong>Türkiye, İngiltere, İspanya, Almanya, İtalya, Fransa ve Portekiz. Avrupa kupaları alternatif senaryolarla gösteriliyor.</span></p><p><Zap size={20} /><span><strong>Önce haber, ardından bağlam</strong>Bu prototipte “Akışı dene” örnek bir kart ekler. Gerçek zamanlı veri, cihaz bildirimi ve arka plan takibi henüz bağlı değil.</span></p><p><Activity size={20} /><span><strong>Şeffaf taraftar analizi</strong>Gösterilen görüşler ve yüzdeler kurgusaldır. Gerçek sürümde kaynak ve örneklem yeterliliği gösterilecek.</span></p></div><div className="demo-note">Takım seçimi, takip listen ve kaydettiğin haberler yalnızca bu tarayıcıda saklanır. Hesap açmana gerek yok.</div><button className="button primary" onClick={() => { setInfo(false); navigate("sources"); }}>Veri kaynaklarını gör <ArrowRight size={16} /></button></Modal>}
    <div className="toast-region" role="status" aria-live="polite">{toast && <div className="tl-toast"><Check size={17} />{toast}<button aria-label="Mesajı kapat" onClick={() => setToast("")}><X size={14} /></button></div>}</div>
  </div>;
}

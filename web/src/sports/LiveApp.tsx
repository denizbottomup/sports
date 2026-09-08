import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Bell, Bookmark, CalendarDays, Check, ChevronRight, CircleHelp, ExternalLink, Globe2, LayoutDashboard, LogOut, Menu, Newspaper, Radio, RefreshCw, Search, ShieldCheck, Trophy, Users, X } from 'lucide-react';
import type { Dashboard, LiveFixture, LiveNews, LiveTeam, Roster, User } from './live-types';
import MatchFacts from './MatchFacts';
import { formatDate as fmt, formatHour as hour } from './time.mjs';
import './base.css';
import './sports.css';
import './live.css';

type View = 'overview' | 'news' | 'fixtures' | 'squad' | 'pulse' | 'saved' | 'sources';
const nav = [
  { id: 'overview', label: 'Genel bakış', icon: LayoutDashboard },
  { id: 'news', label: 'Haber akışı', icon: Newspaper },
  { id: 'squad', label: 'Rakibin kadrosu', icon: Users },
  { id: 'pulse', label: 'Taraftar nabzı', icon: Activity },
  { id: 'fixtures', label: 'Maç takvimi', icon: CalendarDays },
  { id: 'saved', label: 'Kaydedilenler', icon: Bookmark },
] as const;
const categories: Record<string, string> = { all: 'Tümü', official: 'Resmî', press: 'Basın', training: 'Antrenman', squad: 'Kadro & sağlık', coach: 'Teknik ekip', transfer: 'Transfer' };
const languageNames: Record<string, string> = { tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca', es: 'İspanyolca', pt: 'Portekizce', it: 'İtalyanca' };
function readSaved(): LiveNews[] { try { const value = JSON.parse(localStorage.getItem('touchline.live.saved.v2') || '[]'); return Array.isArray(value) ? value.filter(n => n && n.reading?.paragraphs?.length && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.url === 'string' && /^https:\/\//.test(n.url)).slice(0, 100) : []; } catch { return []; } }

function Photo({ src, fallback, alt, className = '', eager = false }: { src?: string | null; fallback?: string | null; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [originalFailed, setOriginalFailed] = useState(false);
  useEffect(() => { setFailed(false); setOriginalFailed(false); }, [src]);
  const url = failed ? fallback : src;
  return url && !originalFailed ? <img className={className} src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => { if (!failed && fallback) setFailed(true); else setOriginalFailed(true); }} /> : <span className={`${className} image-placeholder`} role="img" aria-label={`${alt} · görsel bulunamadı`}><Users size={24} /></span>;
}
function Logo({ team, size = '' }: { team: LiveTeam; size?: string }) { return <Photo className={`real-logo ${size}`} src={team.logo} fallback={team.logoSource} alt={`${team.name} logosu`} eager />; }
function Empty({ title, children }: { title: string; children: ReactNode }) { return <section className="empty-state"><Radio size={25} /><h3>{title}</h3><p>{children}</p></section>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement; ref.current?.showModal(); return () => { ref.current?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="tl-modal" aria-labelledby="live-dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="modal-header"><h2 id="live-dialog-title">{title}</h2><button className="icon-button" onClick={close} aria-label="Pencereyi kapat"><X /></button></div><div className="modal-body">{children}</div></dialog>;
}
function Match({ fixture: f, selected, choose }: { fixture: LiveFixture; selected: boolean; choose: () => void }) {
  return <button className={`fixture-button ${selected ? 'active' : ''}`} onClick={choose} aria-pressed={selected}><div className="fixture-top"><span>{f.competition.startsWith('uefa.') ? <Globe2 size={14} /> : <Trophy size={14} />}{f.competitionName}</span><span>{fmt(f.date)} · {f.dateConfirmed ? hour(f.date) : 'Saat belirsiz'}</span></div><div className="fixture-teams"><Logo team={f.home ? f.team : f.opponent} /><strong>{f.home ? f.team.short : f.opponent.short}</strong><span className="vs">vs</span><Logo team={f.home ? f.opponent : f.team} /><strong>{f.home ? f.opponent.short : f.team.short}</strong><ChevronRight size={16} /></div></button>;
}
function NewsCard({ item, saved, save, open }: { item: LiveNews; saved: boolean; save: () => void; open: () => void }) {
  return <article className={`news-card live-news ${item.image ? 'has-photo' : ''}`}>
    {item.image ? <button className="news-photo-button" onClick={open} aria-label={`${item.title} ayrıntısı`}><Photo className="news-photo" src={item.image} fallback={item.imageSource} alt={item.title} /></button> : <div className={`news-icon ${item.official ? 'official' : 'press'}`}>{item.official ? <ShieldCheck size={22} /> : <Newspaper size={22} />}</div>}
    <div className="news-body"><div className="news-meta"><span className={`category ${item.official ? 'official' : 'press'}`}>{item.official ? 'Resmî açıklama' : 'Basın'}</span><span>·</span><time dateTime={item.publishedAt || undefined}>{fmt(item.publishedAt, item.datePrecision !== 'day')}</time>{item.reading && item.reading.kind !== 'summary' && item.reading.language !== 'tr' && <span className="language-pill">{item.reading.language.toUpperCase()}</span>}</div><button className="news-title" onClick={open}>{item.title}</button>{item.summary && <p>{item.summary}</p>}<div className="news-footer"><span>{item.source}</span><button className="read-news-button" onClick={open}>Haberi oku <ArrowRight size={14} /></button></div></div>
    <button className={`save-button ${saved ? 'saved' : ''}`} onClick={save} aria-label={`${saved ? 'Kaydı kaldır' : 'Haberi kaydet'}: ${item.title}`} aria-pressed={saved}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button>
  </article>;
}
function Squad({ roster, full = false }: { roster?: Roster; full?: boolean }) {
  if (!roster) return <Empty title="Kadro kaynağı bekleniyor">Bu rakibin kadro bilgisi henüz alınmadı. Oyuncu uygunluğu hakkında varsayım yapılmaz.</Empty>;
  const players = roster.players.filter(p => !p.coach);
  const shown = full ? players : [...players.filter(p => p.position === 'Hücum'), ...players.filter(p => p.position === 'Orta saha'), ...players.filter(p => !['Hücum', 'Orta saha'].includes(p.position))].slice(0, 4);
  const coach = roster.players.find(p => p.coach && p.number === 'TP');
  return <section className={`panel real-squad ${full ? 'full-squad' : ''}`}><div className="panel-heading"><h3><Users size={19} /> {full ? 'Rakibin oyuncuları' : 'Yakından tanı'}</h3><span className="small-pill">{players.length} oyuncu</span></div><p className="panel-description">{roster.official ? 'Kulübün resmî kadrosu' : 'ESPN kadro listesi'} · Maç kadrosu değildir.</p>
    <div className="players-grid">{shown.map(p => <a className="real-player" href={p.sourceUrl || roster.sourceUrl} target="_blank" rel="noreferrer" key={p.id}><div className="player-portrait"><Photo src={p.image} fallback={p.imageSource} alt={p.name} /><span>{p.number}</span></div><strong>{p.name}</strong><small>{p.position}</small></a>)}</div>
    {coach && <a className="real-coach" href={coach.sourceUrl!} target="_blank" rel="noreferrer"><Photo src={coach.image} fallback={coach.imageSource} alt={coach.name} /><span><small>TEKNİK DİREKTÖR</small><strong>{coach.name}</strong></span><ArrowUpRight size={17} /></a>}
    <div className="roster-source"><a href={roster.sourceUrl} target="_blank" rel="noreferrer">{roster.source} <ExternalLink size={12} /></a><span>Kontrol: {fmt(roster.updatedAt, true)}</span></div>
  </section>;
}
function Pulse({ opponent }: { opponent: LiveTeam }) {
  return <section className="panel real-pulse"><div className="panel-heading"><h3><Activity size={18} /> Taraftar nabzı</h3><span className="small-pill">Ölçüm bekliyor</span></div><h4>{opponent.name} taraftarı bu maça inanıyor mu?</h4><p>Maça güven, hocaya destek ve oyuncu memnuniyeti için henüz doğrulanmış sosyal yorum örneklemi yok.</p><div className="pending-metrics"><span>Maça güven <b>—</b></span><span>Hocaya destek <b>—</b></span><span>Oyuncu memnuniyeti <b>—</b></span></div><p className="source-disclosure">X ve YouTube yorum bağlantıları iş planında. Haberler bu analizi beklemeden akışa gelir.</p></section>;
}

export default function LiveApp({ user, onUser, onEditTeams }: { user: User; onUser: (user: User | null) => void; onEditTeams: () => void }) {
  const [data, setData] = useState<Dashboard | null>(null), [error, setError] = useState('');
  const [view, setView] = useState<View>('overview'), [fixtureId, setFixtureId] = useState('');
  const [scope, setScope] = useState<string>('opponent'), [filter, setFilter] = useState('all'), [query, setQuery] = useState('');
  const [saved, setSaved] = useState<LiveNews[]>(readSaved), [detail, setDetail] = useState<LiveNews | null>(null);
  const [info, setInfo] = useState(false), [menu, setMenu] = useState(false), [connected, setConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false), [newCount, setNewCount] = useState(0);
  const known = useRef<Set<string> | null>(null), refresh = useRef<() => void>(() => {});
  useEffect(() => {
    let closed = false, running = false, debounce: ReturnType<typeof setTimeout>;
    const abort = new AbortController();
    const fetchData = async () => {
      if (closed || running) return;
      running = true; setRefreshing(true);
      try {
        const response = await fetch('/api/dashboard', { signal: abort.signal, cache: 'no-store' });
        if (response.status === 401) { onUser(null); return; }
        if (!response.ok) throw new Error('Veri sunucusuna ulaşılamadı');
        const next: Dashboard = await response.json();
        if (!Array.isArray(next.fixtures) || !Array.isArray(next.news) || !Array.isArray(next.sources)) throw new Error('Veri yanıtı okunamadı');
        if (!closed) {
          if (known.current) setNewCount(n => n + next.news.filter(item => !known.current!.has(item.id)).length);
          known.current = new Set(next.news.map(item => item.id)); setData(next); setError('');
        }
      } catch (e) { if (!closed) setError(e instanceof Error ? e.message : 'Bağlantı hatası'); }
      finally { running = false; if (!closed) setRefreshing(false); }
    };
    refresh.current = () => { void fetchData(); };
    void fetchData();
    const events = new EventSource('/api/events');
    events.addEventListener('connected', () => { setConnected(true); void fetchData(); });
    events.addEventListener('update', () => { clearTimeout(debounce); debounce = setTimeout(() => { void fetchData(); }, 500); });
    events.onerror = () => setConnected(false);
    const timer = setInterval(() => { void fetchData(); }, 30000);
    const onVisible = () => { if (!document.hidden) void fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { closed = true; abort.abort(); events.close(); clearInterval(timer); clearTimeout(debounce); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  useEffect(() => { try { localStorage.setItem('touchline.live.saved.v2', JSON.stringify(saved)); } catch { /* Keep bookmarks in memory if storage is full. */ } }, [saved]);
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  function navigate(v: View) { setView(v); setMenu(false); setFilter('all'); setQuery(''); setNewCount(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function choose(f: LiveFixture) { setFixtureId(f.id); setScope('opponent'); setFilter('all'); setQuery(''); setView('overview'); }
  function toggle(n: LiveNews) { setSaved(rows => rows.some(p => p.id === n.id) ? rows.filter(p => p.id !== n.id) : [n, ...rows].slice(0, 100)); }
  const fixture = data?.fixtures.find(f => f.id === fixtureId) || data?.fixtures[0];
  const opponent = fixture?.opponent, roster = opponent && data?.rosters[opponent.id];
  const teamId = scope === 'opponent' ? opponent?.id : scope;
  const news = (data?.news || []).filter(n => n.teamId === teamId);
  const visible = (view === 'saved' ? saved : news).filter(n => (filter === 'all' || filter === 'official' && n.official || filter === 'press' && !n.official || n.category === filter) && `${n.title} ${n.summary} ${n.source}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
  const ownPreview = data?.news.find(n => n.teamId === data?.team.id && n.title.toLocaleLowerCase('tr').includes(opponent?.name.toLocaleLowerCase('tr') || 'no-match'));
  const photo = data?.news.find(n => n.teamId === opponent?.id && n.official && n.image && n.category === 'training') || data?.news.find(n => n.teamId === opponent?.id && n.official && n.image);
  const tracked = data ? data.focusFixtureIds.map(id => data.fixtures.find(f => f.id === id)).filter((f): f is LiveFixture => Boolean(f)).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)) : [];
  const sourceErrors = data?.sources.filter(s => ['error', 'stale'].includes(s.status)) || [];
  const title = view === 'overview' ? 'Rakibini tanı.' : view === 'sources' ? 'Kaynağına kadar.' : nav.find(n => n.id === view)?.label || '';

  return <div className="sports-app live-app">
    {menu && <button className="sidebar-backdrop" aria-label="Menüyü kapat" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'mobile-open' : ''}`}><button className="brand" onClick={() => navigate('overview')} aria-label="Touchline ana sayfa"><span className="brand-symbol"><span /><span /><span /></span>touchline<span className="brand-period">.</span></button><div className="workspace-label">MAÇ ÖNCESİ AVANTAJIN</div>
      <nav className="primary-nav" aria-label="Ana menü">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{id === 'saved' && saved.length > 0 && <small>{saved.length}</small>}{id === 'news' && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-section-title"><span>TAKIMIN</span><ShieldCheck size={14} /></div><button className="live-team-choice" onClick={onEditTeams} title="Takımlarını düzenle">{data && <Logo team={data.team} />}<span><strong>{user.favorite?.name || data?.team.name}</strong><small>{[user.favorite?.leagueName, user.favorite?.country].filter(Boolean).join(' · ') || 'Favori takımın'}</small></span><Check size={16} /></button>
      <div className="sidebar-section-title"><span>MAÇ ÖNCESİ TAKİP</span></div><div className="followed-teams">{tracked.map(f => <button key={f.id} className={fixture?.id === f.id ? 'active' : ''} onClick={() => choose(f)}><Logo team={f.opponent} /><span>{f.opponent.short}</span><small>{fmt(f.date)}</small></button>)}</div>
      {(data?.followed.length ?? 0) > 0 && <><div className="sidebar-section-title"><span>TAKİP LİSTEN</span></div><div className="followed-teams">{data?.followed.map(f => <button key={f.team.id} className={scope === f.team.id && view === 'news' ? 'active' : ''} onClick={() => { setScope(f.team.id); navigate('news'); }}><Logo team={f.team} /><span>{f.team.short}</span><small>{f.nextFixture ? fmt(f.nextFixture.date) : 'Fikstür bekleniyor'}</small></button>)}</div></>}
      <div className="sidebar-bottom"><button className={view === 'sources' ? 'active' : ''} onClick={() => navigate('sources')}><Radio size={18} />Veri kaynakları<span className={sourceErrors.length ? 'offline-dot' : 'online-dot'} /></button><button onClick={() => setInfo(true)}><CircleHelp size={18} />İş planı & kapsam</button><div className="profile">{user.picture ? <img className="profile-photo" src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span>{(user.name || '?').slice(0, 1).toLocaleUpperCase('tr')}</span>}<div className="profile-identity"><strong>{user.name}</strong><small>{user.email}</small></div><button className="icon-button" onClick={() => { void fetch('/api/auth/logout', { method: 'POST' }).finally(() => onUser(null)); }} aria-label="Çıkış yap" title="Çıkış yap"><LogOut size={15} /></button></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Menüyü aç" aria-expanded={menu} onClick={() => setMenu(true)}><Menu /></button><span>Maç merkezi</span><ChevronRight size={14} /><strong>{view === 'sources' ? 'Veri kaynakları' : nav.find(n => n.id === view)?.label}</strong></div><div className="topbar-right"><span className={`live-connection ${connected ? 'connected' : ''}`}><i />{connected ? 'Akış bağlı' : 'Yeniden bağlanıyor'}</span><button className="icon-button" disabled={refreshing} onClick={() => refresh.current()} aria-label="Verileri yenile"><RefreshCw size={18} className={refreshing ? 'spinning' : ''} /></button><button className="icon-button" onClick={() => setInfo(true)} aria-label="Bildirim planı"><Bell size={19} /></button></div></header>
      <main className="main-content"><div className="page-heading"><div><div className="page-eyebrow"><span /> {(data?.team.short || user.favorite?.short || '').toLocaleUpperCase('tr')} MAÇ MERKEZİ</div><h1>{title}</h1><p>Gerçek gelişmeler. Kaynağından, maç öncesine.</p></div>{data && <div className="live-selected-team"><Logo team={data.team} /><span><small>BENİM TAKIMIM</small><strong>{data.team.name}</strong></span></div>}</div>
        {error && <div className="live-banner warning" role="alert">{error}. {data ? 'Son alınan veriler gösteriliyor.' : 'Bağlantı yeniden denenecek.'}<button onClick={() => refresh.current()}>Tekrar dene</button></div>}
        {!data ? <Empty title="Rakip dosyan hazırlanıyor">Fikstür ve kaynaklar yükleniyor…</Empty> : <>
          <div className="live-banner"><ShieldCheck size={17} /><span><strong>Gerçek kaynaklar bağlı.</strong> Clickbait ve saat/kanal başlıkları elenir; haberler burada okunur.</span><button onClick={() => navigate('sources')}>{sourceErrors.length ? `${sourceErrors.length} kaynak uyarısı` : `${data.sources.filter(s => s.status === 'ok').length} kaynak çalışıyor`}<ArrowUpRight size={14} /></button></div>
          {view === 'sources' ? <><div className="sources-grid">{data.sources.map(s => <section className="panel source-card" key={s.id}><div className="source-card-top"><span className="source-logo">{s.official ? <ShieldCheck /> : <Radio />}</span><span className={`source-health ${s.status}`}>{({ pending: 'Bağlanıyor', ok: 'Çalışıyor', stale: 'Eski veri', error: 'Erişim hatası' })[s.status]}</span></div><h3>{s.name}</h3><span className="eyebrow">{s.kind}</span><p>Son kontrol: {fmt(s.lastCheckedAt, true)}<br />Son başarılı erişim: {fmt(s.lastSuccessAt, true)}<br />Kontrol aralığı: {s.interval < 60000 ? `${s.interval / 1000} saniye` : `${s.interval / 60000} dakika`}</p>{s.error && <p className="source-error">{s.error}</p>}<a href={s.publicUrl} target="_blank" rel="noreferrer">Kaynağı aç <ExternalLink size={15} /></a></section>)}</div><div className="source-disclosure">ESPN'in herkese açık uç noktaları kullanılıyor; sözleşmeli veri servisi değildir ve kapsam değişebilir. Basın dizinindeki başlıklar okunabilir kaynak metni olmadan akışa alınmaz. Muğlak başlıklar, bilet haberleri ve maç künyesine ait sorular elenir. Hazırlanan Türkçe özetler ile özgün dildeki kısa aktarımlar ayrı etiketlenir. Görseller kaynaklarından alınır ve sunucuda önbelleğe kaydedilir.</div></> : view === 'fixtures' ? <section className="panel fixtures-page"><div className="panel-heading"><h3><CalendarDays size={20} /> {data.team.short} · yaklaşan maçlar</h3><a href={`https://www.espn.com/soccer/team/fixtures/_/id/${data.team.id}`} target="_blank" rel="noreferrer">Fikstür kaynağı <ExternalLink size={14} /></a></div><p>Lig ve Avrupa takvimi birlikte. Saatler cihazının saat diliminde. İlk lig ve Avrupa rakibi aktif takipte.</p><div className="live-fixture-list">{data.fixtures.map(f => <Match key={f.id} fixture={f} selected={fixture?.id === f.id} choose={() => choose(f)} />)}</div>{!data.fixtures.length && <Empty title="Yaklaşan maç bulunamadı">Fikstür kaynaklarının durumunu kontrol edebilirsin.</Empty>}</section> : !fixture || !opponent ? <Empty title="Yaklaşan maç bekleniyor">Kaynaklar kontrol ediliyor. Doğrulanmış fikstür geldiğinde rakip dosyan açılacak.</Empty> : <>
            <div className="live-fixtures">{tracked.map(f => <Match fixture={f} selected={fixture.id === f.id} choose={() => choose(f)} key={f.id} />)}<button className="all-fixtures-button" onClick={() => navigate('fixtures')}><CalendarDays size={21} />Tüm maçlar<ArrowRight size={15} /></button></div>
            {view === 'overview' && <section className="live-hero">
              {photo && <div className="hero-photo"><Photo src={photo.image} fallback={photo.imageSource} alt={`${opponent.name} maç hazırlığı — ${photo.source}`} eager /></div>}
              <div className="hero-content"><div className="live-hero-top"><span><i /> RAKİP DOSYASI / {fixture.competitionName}</span><span className="hero-live-tag">GERÇEK FİKSTÜR</span></div><div className="hero-opponent"><Logo team={opponent} size="hero-logo" /><div><span>SIRADAKİ RAKİBİN</span><h2>{opponent.name}</h2><p><CalendarDays size={16} />{fmt(fixture.date)} · {fixture.dateConfirmed ? hour(fixture.date) : 'Saat kesinleşmedi'} · {fixture.home ? 'İç saha' : 'Deplasman'}</p>{fixture.venue && <p className="venue-label">{fixture.venue}</p>}</div></div><div className="live-hero-bottom"><span><Newspaper size={17} />{data.news.filter(n => n.teamId === opponent.id).length} gelişme</span><span><Users size={17} />{roster ? `${roster.players.filter(p => !p.coach).length} oyuncu` : 'Kadro bekleniyor'}</span><a href={fixture.sourceUrl} target="_blank" rel="noreferrer">Maç kaynağı <ArrowUpRight size={15} /></a></div></div>
              {photo && <span className="photo-credit">Fotoğraf: {photo.source}</span>}
            </section>}
            {(view === 'overview' || view === 'news') && <MatchFacts fixture={fixture} />}
            {view === 'squad' ? <><Squad roster={roster} full /><div className="source-disclosure">Bu liste kulüp/sağlayıcı kadrosudur. İlk 11 veya maça uygunluk listesi değildir. Sakatlık ve cezalar yalnızca ilgili kaynak haberiyle gösterilir.</div></> : view === 'pulse' ? <Pulse opponent={opponent} /> : <div className={`content-grid ${view !== 'overview' ? 'full-feed' : ''}`}>
              <section className="feed-section"><div className="section-heading"><div><h2>{view === 'saved' ? 'Kaydettiğin gelişmeler' : scope === 'opponent' ? 'Rakipte neler oluyor?' : scope === data.team.id ? `${data.team.short} cephesinde` : `${data.followed.find(f => f.team.id === scope)?.team.short || 'Takip'} gündemi`}<span className="count-pill">{visible.length}</span></h2><p>Kaynak yayın tarihine göre, en yeniden başlayarak.</p></div><span className="feed-live"><i />Kaynak takibi açık</span></div>
                {view !== 'saved' && <div className="feed-scope"><button className={scope === 'opponent' ? 'active' : ''} onClick={() => setScope('opponent')}><Logo team={opponent} />{opponent.short}</button><button className={scope === data.team.id ? 'active' : ''} onClick={() => setScope(data.team.id)}><Logo team={data.team} />{data.team.short}</button>{data.followed.map(f => <button key={f.team.id} className={scope === f.team.id ? 'active' : ''} onClick={() => setScope(f.team.id)}><Logo team={f.team} />{f.team.short}</button>)}</div>}
                <label className="live-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Haber, oyuncu veya kaynak ara…" aria-label="Haberlerde ara" />{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Aramayı temizle"><X size={15} /></button>}</label>
                <div className="feed-toolbar"><div className="feed-tabs">{Object.entries(categories).map(([id, label]) => <button key={id} aria-pressed={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div></div>
                {newCount > 0 && <button className="new-news-banner" onClick={() => { setNewCount(0); setFilter('all'); setQuery(''); }}><RefreshCw size={15} />Akışa {newCount} yeni gelişme geldi</button>}
                <div className="news-list">{visible.slice(0, view === 'overview' ? 12 : 150).map(n => <NewsCard item={n} key={n.id} saved={saved.some(p => p.id === n.id)} save={() => toggle(n)} open={() => setDetail(n)} />)}</div>
                {!visible.length && <Empty title={view === 'saved' ? 'Henüz kaydedilmiş haber yok' : 'Bu görünümde haber bulunamadı'}>{view === 'saved' ? 'Haberin yanındaki yer imiyle daha sonra okumak üzere kaydet.' : 'Filtreyi değiştir veya veri kaynaklarının durumunu kontrol et. Boş alanlar örnek içerikle doldurulmaz.'}</Empty>}
                {view === 'overview' && visible.length > 12 && <button className="button secondary see-all-news" onClick={() => navigate('news')}>Tüm {visible.length} gelişmeyi gör <ArrowRight size={16} /></button>}
              </section>
              {view === 'overview' && <aside className="insights-column"><Squad roster={roster} /><button className="button secondary squad-more" onClick={() => navigate('squad')}>Tüm kadroyu incele <ArrowRight size={15} /></button>{ownPreview && <section className="panel match-context"><div className="panel-heading"><h3><ShieldCheck size={18} /> Takımından maç önü</h3></div><button className="news-title" onClick={() => setDetail(ownPreview)}>{ownPreview.title}</button><p>{ownPreview.summary}</p><button className="read-news-button" onClick={() => setDetail(ownPreview)}>Haberi oku <ArrowRight size={15} /></button></section>}<Pulse opponent={opponent} /><div className="source-mini"><ShieldCheck size={23} /><div><strong>Son kontrol: {fmt(data.updatedAt, true)}</strong><p>Fikstür 15 dk · kadro 4 sa · resmî haber 30 sn.</p></div><button onClick={() => navigate('sources')} aria-label="Veri kaynaklarını aç"><ArrowUpRight size={18} /></button></div></aside>}
            </div>}
          </>}
        </>}
        <footer className="page-footer"><span className="footer-brand">touchline.</span><span>Maç başlamadan, hikâyeyi anla.</span><button onClick={() => setInfo(true)}>Kapsam & iş planı <ArrowUpRight size={13} /></button></footer>
      </main>
    </div>
    {detail && <Modal title="Haber" close={() => setDetail(null)}>{detail.image && <Photo className="detail-photo" src={detail.image} fallback={detail.imageSource} alt={detail.title} />}<div className="detail-meta"><span className={`category ${detail.official ? 'official' : 'press'}`}>{detail.official ? 'Resmî açıklama' : 'Basın haberi'}</span><time>{fmt(detail.publishedAt, detail.datePrecision !== 'day')}</time></div><h2 className="detail-title">{detail.title}</h2><div className="article-reading">{(detail.reading?.paragraphs || [detail.summary]).map((p, index) => <p key={index}>{p}</p>)}</div><div className="detail-source"><ShieldCheck size={20} /><div><strong>Kaynak: {detail.source}</strong><small>{detail.reading?.kind === 'summary' ? 'Kaynak metinden hazırlanan özet · Touchline' : detail.reading?.kind === 'brief' ? 'Türkçe haber özeti · Touchline' : 'Kaynaktan kısa aktarım'} · {languageNames[detail.reading?.language || 'tr'] || detail.reading?.language}</small><small>Kaynak kontrolü: {fmt(detail.reading?.checkedAt || detail.firstSeenAt, true)}</small></div></div><div className="detail-actions"><button className="button secondary" onClick={() => toggle(detail)}><Bookmark size={16} />{saved.some(n => n.id === detail.id) ? 'Kaydı kaldır' : 'Kaydet'}</button><a className="button secondary" href={detail.url} target="_blank" rel="noreferrer">Kaynağın tamamı <ExternalLink size={15} /></a><button className="button primary" onClick={() => setDetail(null)}>Akışa dön <ArrowRight size={16} /></button></div></Modal>}
    {info && <Modal title="Kapsam & iş planı" close={() => setInfo(false)}><p className="detail-summary">Favori takımın {data?.team.name || user.favorite?.name}. Lig ve Avrupa'daki sıradaki rakipler, haberleri ve mevcut kadroları gerçek kaynaklardan geliyor.</p><div className="info-features"><p><Users size={22} /><span><strong>Giriş ve takım seçimi · Çalışıyor</strong>Google ile giriş, favori takım ve en fazla 5 takımlık takip listesi hesabında saklanır; tercihler cihazlar arasında eşitlenir.</span></p><p><Radio size={22} /><span><strong>Haber akışı · Çalışıyor</strong>Resmî RSS 30 saniyede, basın dizini 60 saniyede kontrol edilir. Okunabilir metin ve başlık filtresi uygulanır. Kaynak keşfinden sonra açık sayfaya SSE ile iletilir. Kaynak gecikmesi bu süreye eklenebilir.</span></p><p><Activity size={22} /><span><strong>Taraftar nabzı · Sıradaki aşama</strong>Gerçek yorum erişimi ve yeterli örneklem olmadan yüzdeler gösterilmez. X/YouTube erişimi ve Türkçe çeviri ayrıca bağlanacak.</span></p><p><Bell size={22} /><span><strong>Bildirimler · İş planında</strong>Açık sayfa güncellenir. Tarayıcı kapalıyken push bildirimi henüz gönderilmez.</span></p></div><p className="source-disclosure">Haber kaydetme bu tarayıcıda tutulur. Takım dizini Süper Lig ve 6 büyük Avrupa ligini kapsar; favori takımın ilk lig ve Avrupa rakibi için rakip dosyası hazırlanır. Resmî kulüp akışı bağlı olmayan takımlarda akış basın dizini ve fikstürle sınırlıdır. Görsellerin hakları ilgili kulüp/yayıncıya aittir; kaynak adları haberlerde belirtilir.</p></Modal>}
  </div>;
}

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Plus, Search, ShieldCheck, X } from 'lucide-react';
import LiveApp from './LiveApp';
import type { User, UserTeam } from './live-types';
import './base.css';
import './sports.css';
import './live.css';

declare global { interface Window { google?: { accounts?: { id?: { initialize: (config: object) => void; renderButton: (el: HTMLElement, options: object) => void } } } } }

function Brand() {
  return <span className="brand auth-brand"><span className="brand-symbol"><span /><span /><span /></span>touchline<span className="brand-period">.</span></span>;
}

function Login({ clientId, onUser }: { clientId: string | null; onUser: (user: User) => void }) {
  const button = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const init = () => {
      if (cancelled || !button.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const r = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) });
            const body = await r.json();
            if (!r.ok) throw new Error(body.error || 'Giriş tamamlanamadı');
            onUser(body.user);
          } catch (e) { setError(e instanceof Error ? e.message : 'Giriş tamamlanamadı'); }
        },
      });
      window.google.accounts.id.renderButton(button.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', locale: 'tr', width: 280 });
    };
    if (window.google?.accounts?.id) init();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = init;
      script.onerror = () => setError('Google giriş bileşeni yüklenemedi. Bağlantını kontrol et.');
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [clientId, onUser]);
  return <div className="auth-shell"><div className="auth-card">
    <Brand />
    <h1>Maç öncesi avantajın.</h1>
    <p>Favori takımını seç; sıradaki rakibinin haberleri, kadrosu ve maç künyesi gerçek kaynaklardan tek dosyada toplansın.</p>
    {clientId ? <div className="google-button" ref={button} /> : <p className="auth-error">Google girişi henüz yapılandırılmadı: sunucuda GOOGLE_CLIENT_ID tanımlanmalı.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <small>Giriş yalnızca takım tercihlerini hesabına bağlamak için kullanılır. Tercihler sunucuda saklanır; başka amaçla veri toplanmaz.</small>
  </div></div>;
}

function TeamRow({ team, onPick, picked }: { team: UserTeam; onPick: () => void; picked: boolean }) {
  return <button type="button" className={`team-result ${picked ? 'picked' : ''}`} onClick={onPick} disabled={picked}>
    {team.logo ? <img src={team.logo} alt="" referrerPolicy="no-referrer" loading="lazy" /> : <span className="team-result-blank" />}
    <span><strong>{team.name}</strong><small>{[team.leagueName, team.country].filter(Boolean).join(' · ')}</small></span>
    {picked ? <Check size={15} /> : <Plus size={15} />}
  </button>;
}

function TeamSearch({ picked, onPick, placeholder }: { picked: string[]; onPick: (team: UserTeam) => void; placeholder: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserTeam[]>([]);
  const [note, setNote] = useState('');
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); setNote(''); return; }
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/teams?query=${encodeURIComponent(trimmed)}`, { signal: abort.signal });
        const body = await r.json();
        const teams = Array.isArray(body.teams) ? body.teams as UserTeam[] : [];
        setResults(teams);
        setNote(teams.length ? '' : 'Takım dizinde bulunamadı. Kapsam: Süper Lig ve 6 büyük Avrupa ligi.');
      } catch { /* Arama iptal edildi veya ağ hatası; sonuç listesi değişmez. */ }
    }, 250);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [query]);
  return <div className="team-search">
    <label className="live-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />{query && <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label="Aramayı temizle"><X size={14} /></button>}</label>
    {results.length > 0 && <div className="team-results">{results.map(team => <TeamRow key={team.id} team={team} picked={picked.includes(team.id)} onPick={() => { onPick(team); setQuery(''); }} />)}</div>}
    {note && <p className="team-search-note">{note}</p>}
  </div>;
}

function browserLanguage(languages: Record<string, string>): string {
  const candidate = (navigator.language || 'tr').slice(0, 2).toLowerCase();
  return languages[candidate] ? candidate : 'tr';
}

function Onboarding({ user, languages, onDone, onCancel }: { user: User; languages: Record<string, string>; onDone: (user: User) => void; onCancel?: () => void }) {
  const [favorite, setFavorite] = useState<UserTeam | null>(user.favorite);
  const [followed, setFollowed] = useState<UserTeam[]>(user.followed || []);
  const [language, setLanguage] = useState<string>(user.favorite ? user.language : browserLanguage(languages));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!favorite || saving) return;
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/me/teams', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite: favorite.id, followed: followed.map(t => t.id), language }) });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Tercihler kaydedilemedi');
      onDone(body.user);
    } catch (e) { setError(e instanceof Error ? e.message : 'Tercihler kaydedilemedi'); }
    finally { setSaving(false); }
  }
  return <div className="auth-shell"><div className="auth-card onboard-card">
    <Brand />
    <h1>{user.favorite ? 'Takımlarını düzenle.' : 'Takımını seç.'}</h1>
    <p>Rakip dosyası favori takımın için hazırlanır. Takip listesindeki takımların fikstürü ve haberleri de akışına eklenir.</p>
    <div className="onboard-section">
      <div className="sidebar-section-title"><span>FAVORİ TAKIMIN</span><ShieldCheck size={13} /></div>
      {favorite
        ? <div className="team-chip favorite-chip">{favorite.logo && <img src={favorite.logo} alt="" referrerPolicy="no-referrer" />}<span><strong>{favorite.name}</strong><small>{[favorite.leagueName, favorite.country].filter(Boolean).join(' · ')}</small></span><button type="button" className="icon-button" onClick={() => setFavorite(null)} aria-label={`Favori takımı kaldır: ${favorite.name}`}><X size={15} /></button></div>
        : <TeamSearch picked={[]} onPick={setFavorite} placeholder="Takım ara: Galatasaray, Arsenal, Porto…" />}
    </div>
    <div className="onboard-section">
      <div className="sidebar-section-title"><span>TAKİP LİSTEN · EN FAZLA 5</span><span className="count-pill">{followed.length}/5</span></div>
      {followed.length > 0 && <div className="team-chips">{followed.map(team => <span className="team-chip" key={team.id}>{team.logo && <img src={team.logo} alt="" referrerPolicy="no-referrer" />}<span><strong>{team.short}</strong></span><button type="button" className="icon-button" onClick={() => setFollowed(rows => rows.filter(t => t.id !== team.id))} aria-label={`Takibi bırak: ${team.name}`}><X size={14} /></button></span>)}</div>}
      {followed.length < 5
        ? <TeamSearch picked={[...followed.map(t => t.id), ...(favorite ? [favorite.id] : [])]} onPick={team => setFollowed(rows => rows.some(t => t.id === team.id) || rows.length >= 5 || team.id === favorite?.id ? rows : [...rows, team])} placeholder="Takip edilecek takım ara…" />
        : <p className="team-search-note">Takip listesi dolu. Yeni takım eklemek için birini çıkar.</p>}
    </div>
    <div className="onboard-section">
      <div className="sidebar-section-title"><span>HABER ÖZETLERİNİN DİLİ</span></div>
      <select className="language-select" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Haber özetlerinin dili">{Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>
      <p className="team-search-note">Kulüp haberlerinin özetleri bu dilde hazırlanır. Kaynak adı ve orijinal bağlantı her haberde korunur.</p>
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="onboard-actions">
      {onCancel && <button type="button" className="button secondary" onClick={onCancel}>Vazgeç</button>}
      <button type="button" className="button primary" disabled={!favorite || saving} onClick={() => void save()}>{saving ? 'Kaydediliyor…' : 'Devam et'} <ArrowRight size={15} /></button>
    </div>
  </div></div>;
}

const DEFAULT_LANGUAGES: Record<string, string> = { tr: 'Türkçe', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português', it: 'Italiano' };

export default function AuthGate() {
  const [me, setMe] = useState<User | null | undefined>(undefined);
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);
  const [languages, setLanguages] = useState<Record<string, string>>(DEFAULT_LANGUAGES);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    void fetch('/api/config').then(async r => { const c = await r.json(); setClientId(c.googleClientId ?? null); if (c.languages) setLanguages(c.languages); }).catch(() => setClientId(null));
    void fetch('/api/me', { cache: 'no-store' }).then(async r => setMe(r.ok ? (await r.json()).user : null)).catch(() => setMe(null));
  }, []);
  if (me === undefined || clientId === undefined) return <div className="auth-shell"><div className="auth-card"><Brand /><p className="auth-loading">Oturum kontrol ediliyor…</p></div></div>;
  if (!me) return <Login clientId={clientId} onUser={setMe} />;
  if (!me.favorite || editing) return <Onboarding user={me} languages={languages} onDone={next => { setMe(next); setEditing(false); }} onCancel={me.favorite ? () => setEditing(false) : undefined} />;
  return <LiveApp key={me.favorite.id} user={me} onUser={setMe} onEditTeams={() => setEditing(true)} />;
}

import { useState } from 'react';
import { CalendarDays, Radio, ShieldCheck } from 'lucide-react';
import type { LiveFixture } from './live-types';
import { formatDate, formatHour, localZone } from './time.mjs';
const countries = [['TR', 'Türkiye'], ['PT', 'Portekiz'], ['GB', 'Birleşik Krallık'], ['DE', 'Almanya'], ['FR', 'Fransa'], ['ES', 'İspanya'], ['IT', 'İtalya'], ['US', 'ABD']];
function initialCountry() { try { return localStorage.getItem('touchline.broadcast.country') || (localZone() === 'Europe/Istanbul' ? 'TR' : ''); } catch { return ''; } }
export default function MatchFacts({ fixture: f }: { fixture: LiveFixture }) {
  const [country, setCountry] = useState(initialCountry);
  const details = f.details;
  const broadcasts = (details?.broadcasts || []).filter(b => b.country === country && Date.now() - Date.parse(b.checkedAt || details?.checkedAt || '') < 86400000);
  const refereeSource = details?.refereeSource || details;
  return <section className="panel match-facts" aria-label="Maç künyesi"><div className="panel-heading"><h3><CalendarDays size={19} /> Maç künyesi</h3><span className="small-pill">{f.competitionName}</span></div>
    <div className="match-facts-grid"><div><small>BAŞLAMA SAATİ</small><strong>{f.dateConfirmed ? formatHour(f.date) : 'Saat kesinleşmedi'}</strong><span>{formatDate(f.date)} · {localZone()}</span><small>Cihazının saat dilimi · yaz/kış saati otomatik</small><span className="fact-source">Kaynak: {f.source}</span></div>
    <div><small>STADYUM</small><strong>{f.venue || 'Henüz doğrulanmadı'}</strong><span>{f.home ? 'İç saha' : 'Deplasman'}</span><span className="fact-source">Kaynak: {f.source}</span></div>
    <div><small>HAKEM</small><strong>{details?.referee || 'Henüz doğrulanmadı'}</strong>{details?.referee && <span className="fact-source">{refereeSource?.source}<br />Kontrol: {formatDate(refereeSource?.checkedAt || null, true)}</span>}</div></div>
    <div className="broadcast-heading"><h4><Radio size={17} /> Nereden izlerim?</h4><label>Yayın ülkesi<select aria-label="Yayın ülkesi" value={country} onChange={e => { setCountry(e.target.value); try { localStorage.setItem('touchline.broadcast.country', e.target.value); } catch { /* In-memory preference remains available. */ } }}><option value="">Ülke seç</option>{countries.map(([code, name]) => <option value={code} key={code}>{name}</option>)}<option value="OTHER">Diğer ülke</option></select></label></div>
    <div className="broadcast-list">{broadcasts.length ? broadcasts.map(b => <div className="broadcast-card" key={`${b.country}-${b.channel}`}><ShieldCheck size={19} /><div><strong>{b.channel}</strong><span className={b.access === 'free' ? 'free-access' : ''}>{b.access === 'free' ? 'Şifresiz · ücretsiz' : b.access === 'paid' ? 'Ücretli / abonelik gerekli' : 'Şifre / abonelik durumu doğrulanmadı'}</span>{b.note && <small>{b.note}</small>}<small>Kaynak: {b.source} · {formatDate(b.checkedAt || details?.checkedAt || null, true)}</small></div></div>) : <p className="broadcast-empty">{country ? 'Bu ülke için maçın yayıncısı ve şifre durumu henüz doğrulanmadı.' : 'Bulunduğun ülkeyi seçerek yayın bilgisini kontrol et.'}</p>}</div>
    <p className="fact-explanation">Saat dilimi maç saatini, yayın ülkesi erişebileceğin kanalları belirler.</p>
  </section>;
}

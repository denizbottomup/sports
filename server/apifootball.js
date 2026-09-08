// API-Football (api-sports.io) kadro sağlayıcısı. APIFOOTBALL_KEY tanımlıysa kadrolar buradan
// fotoğraflı gelir; tanımlı değilse veya bir istek başarısız olursa ESPN kadro yolu geçerli kalır.
// Takım kimliği eşlemesi ada göre yapılır ve snapshot'ta kalıcı önbelleklenir.
import { fold } from './providers.js';

export const apiFootballEnabled = () => Boolean(process.env.APIFOOTBALL_KEY);
const BASE = 'https://v3.football.api-sports.io';
const POSITIONS = { Goalkeeper: 'Kaleci', Defender: 'Savunma', Midfielder: 'Orta saha', Attacker: 'Hücum' };

async function apiGet(path) {
  const response = await fetch(`${BASE}${path}`, { headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`API-Football HTTP ${response.status}`);
  const body = await response.json();
  const errors = body.errors && (Array.isArray(body.errors) ? body.errors : Object.values(body.errors));
  if (errors && errors.length) throw new Error(`API-Football: ${errors.join(' ')}`.slice(0, 200));
  return body.response || [];
}

// "Erzurum" ↔ "Erzurumspor" gibi ek almış adlar için önek eşleşmesi de sayılır (en az 4 harf).
const tokenMatches = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
export function matchTeam(name, candidates) {
  const tokens = [...new Set(fold(name).split(/[^a-z0-9]+/).filter(t => t.length > 2))];
  let best = null, bestScore = 0;
  for (const candidate of candidates) {
    const candidateTokens = [...new Set(fold(candidate.name).split(/[^a-z0-9]+/).filter(t => t.length > 2))];
    let score = 0;
    for (const token of tokens) if (candidateTokens.some(other => tokenMatches(token, other))) score++;
    if (score > bestScore || (score === bestScore && score > 0 && best && candidate.name.length < best.name.length)) { best = candidate; bestScore = score; }
  }
  return bestScore > 0 ? best : null;
}

// Ad araması: doğrudan search parametresi 3+ harf ister; sonuçlardan en iyi eşleşme seçilir.
export async function findTeam(teamName) {
  const query = fold(teamName).split(/[^a-z0-9]+/).filter(t => t.length > 2).sort((a, b) => b.length - a.length)[0];
  if (!query) return null;
  const rows = await apiGet(`/teams?search=${encodeURIComponent(query)}`);
  const best = matchTeam(teamName, rows.map(r => r.team));
  return best ? { id: best.id, name: best.name } : null;
}

export function parseSquad(rows) {
  const players = (rows[0]?.players || []).map(p => ({
    id: `af-${p.id}`,
    name: p.name,
    number: p.number == null ? '' : String(p.number),
    position: POSITIONS[p.position] || p.position || 'Oyuncu',
    image: typeof p.photo === 'string' && p.photo.startsWith('https://media.api-sports.io/') ? p.photo : null,
    sourceUrl: null,
    coach: false,
  })).filter(p => p.name);
  if (players.length < 11) throw new Error('API-Football kadrosu eksik döndü');
  return players;
}

export async function fetchSquad(apiTeamId) {
  return parseSquad(await apiGet(`/players/squads?team=${apiTeamId}`));
}

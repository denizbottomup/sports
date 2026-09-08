import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from './paths.js';
import { fold, safeUrl } from './providers.js';

const FILE = path.join(DATA_DIR, 'teams.json');
export const directoryLeagues = [
  { id: 'tur.1', name: 'Süper Lig', country: 'Türkiye' },
  { id: 'eng.1', name: 'Premier League', country: 'İngiltere' },
  { id: 'esp.1', name: 'LaLiga', country: 'İspanya' },
  { id: 'ger.1', name: 'Bundesliga', country: 'Almanya' },
  { id: 'ita.1', name: 'Serie A', country: 'İtalya' },
  { id: 'fra.1', name: 'Ligue 1', country: 'Fransa' },
  { id: 'por.1', name: 'Primeira Liga', country: 'Portekiz' },
];
let directory = { version: 1, teams: [], updatedAt: null };

export function parseLeagueTeams(data, league) {
  const rows = data.sports?.[0]?.leagues?.[0]?.teams;
  if (!Array.isArray(rows)) throw new Error('Takım listesi beklenen biçimde değil');
  return rows.flatMap(({ team }) => {
    if (!team?.id || !(team.displayName || team.name)) return [];
    return [{ id: String(team.id), name: team.displayName || team.name, short: team.shortDisplayName || team.displayName || team.name, abbreviation: team.abbreviation || '', logo: safeUrl(team.logos?.[0]?.href) || null, league: league.id, leagueName: league.name, country: league.country }];
  });
}
async function persist() {
  try { await writeFile(`${FILE}.tmp`, JSON.stringify(directory)); await rename(`${FILE}.tmp`, FILE); } catch (e) { console.error('Team directory write failed:', e.message); }
}
export async function loadDirectory() {
  await mkdir(DATA_DIR, { recursive: true });
  try { const saved = JSON.parse(await readFile(FILE, 'utf8')); if (saved.version === 1 && Array.isArray(saved.teams)) directory = saved; } catch { /* Directory is fetched on first boot. */ }
}
export async function refreshDirectory() {
  const collected = [];
  for (const league of directoryLeagues) {
    try {
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/teams`, { headers: { 'User-Agent': 'Touchline/0.4 (+https://github.com/denizbottomup/sports)' }, signal: AbortSignal.timeout(18000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      collected.push(...parseLeagueTeams(await response.json(), league));
    } catch (e) { console.error(`Team directory ${league.id}: ${e.message}`); }
  }
  // Kısmi arıza eski dizini silmesin: yalnızca başarılı ligleri güncelle.
  if (collected.length) {
    const updatedLeagues = new Set(collected.map(t => t.league));
    const kept = directory.teams.filter(t => !updatedLeagues.has(t.league));
    directory = { version: 1, teams: [...kept, ...collected], updatedAt: new Date().toISOString() };
    await persist();
  }
}
export function startDirectory() {
  const timer = setInterval(() => { void refreshDirectory(); }, 24 * 3600000);
  timer.unref();
  return () => clearInterval(timer);
}
export function searchTeams(query, limit = 12) {
  const q = fold(query);
  if (q.length < 2) return [];
  const starts = [], contains = [];
  for (const team of directory.teams) {
    const name = fold(team.name), short = fold(team.short);
    if (name.startsWith(q) || short.startsWith(q) || fold(team.abbreviation) === q) starts.push(team);
    else if (name.includes(q) || short.includes(q)) contains.push(team);
  }
  return [...starts, ...contains].slice(0, limit);
}
export function teamById(id) { return directory.teams.find(team => team.id === String(id)) || null; }
export function directoryInfo() { return { count: directory.teams.length, updatedAt: directory.updatedAt, leagues: directoryLeagues }; }

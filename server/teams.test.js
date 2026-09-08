import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATA_DIR = await mkdtemp(path.join(tmpdir(), 'touchline-teams-'));
const { parseLeagueTeams } = await import('./teams.js');

test('league team parser validates shape and normalizes records', () => {
  const league = { id: 'tur.1', name: 'Süper Lig', country: 'Türkiye' };
  assert.throws(() => parseLeagueTeams({}, league), /beklenen biçimde değil/);
  const rows = parseLeagueTeams({ sports: [{ leagues: [{ teams: [
    { team: { id: 432, displayName: 'Galatasaray', shortDisplayName: 'Galatasaray', abbreviation: 'GAL', logos: [{ href: 'https://a.espncdn.com/i/teamlogos/soccer/500/432.png' }] } },
    { team: { id: 999 } },
  ] }] }] }, league);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { id: '432', name: 'Galatasaray', short: 'Galatasaray', abbreviation: 'GAL', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/432.png', league: 'tur.1', leagueName: 'Süper Lig', country: 'Türkiye' });
});

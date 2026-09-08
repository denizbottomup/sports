import test from 'node:test';
import assert from 'node:assert/strict';
import { matchTeam, parseSquad } from './apifootball.js';

test('team matching tolerates word order and suffix differences', () => {
  const candidates = [
    { id: 1, name: 'BB Erzurumspor' },
    { id: 2, name: 'Erzincanspor' },
    { id: 3, name: 'Besiktas JK' },
  ];
  assert.equal(matchTeam('Erzurum BB', candidates).id, 1);
  assert.equal(matchTeam('Besiktas', candidates).id, 3);
  assert.equal(matchTeam('Real Madrid', candidates), null);
});
test('squad parser maps positions, validates size and only trusts the API photo CDN', () => {
  const players = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Oyuncu ${i + 1}`, number: i + 1, position: 'Midfielder', photo: `https://media.api-sports.io/football/players/${i + 1}.png` }));
  players[0] = { ...players[0], position: 'Goalkeeper' };
  players[1] = { ...players[1], photo: 'https://evil.example/x.png' };
  players[2] = { ...players[2], number: null };
  const rows = parseSquad([{ team: { id: 9 }, players }]);
  assert.equal(rows.length, 12);
  assert.equal(rows[0].position, 'Kaleci');
  assert.equal(rows[1].image, null);
  assert.equal(rows[2].number, '');
  assert.throws(() => parseSquad([{ players: players.slice(0, 5) }]), /eksik/);
  assert.throws(() => parseSquad([]), /eksik/);
});

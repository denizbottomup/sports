import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATA_DIR = await mkdtemp(path.join(tmpdir(), 'touchline-store-'));
const store = await import('./store.js');
await store.loadStore();

test('account, session and team preference lifecycle', () => {
  const user = store.upsertUser({ sub: 'g-1', email: 'deniz@example.com', name: 'Deniz', picture: null });
  const token = store.createSession(user.id);
  assert.equal(store.userForSession(token).email, 'deniz@example.com');
  assert.equal(store.userForSession('unknown-token'), null);
  const favorite = { id: '432', name: 'Galatasaray', short: 'Galatasaray' };
  const followed = [{ id: '2250', name: 'Sporting CP', short: 'Sporting CP' }];
  store.setTeams(user.id, favorite, followed);
  assert.deepEqual(store.favoriteTeamIds(), ['432']);
  assert.deepEqual([...store.trackedTeamMap().keys()].sort(), ['2250', '432']);
  const shared = store.publicUser(store.userForSession(token));
  assert.equal(shared.language, 'tr');
  store.setTeams(user.id, favorite, followed, 'en');
  assert.equal(store.publicUser(store.userForSession(token)).language, 'en');
  assert.deepEqual(store.languagesInUse().sort(), ['en', 'tr']);
  assert.equal(shared.favorite.id, '432');
  assert.equal(shared.followed.length, 1);
  assert.equal('createdAt' in shared, false);
  store.deleteSession(token);
  assert.equal(store.userForSession(token), null);
});
test('re-login keeps team preferences', () => {
  store.upsertUser({ sub: 'g-1', email: 'deniz@example.com', name: 'Deniz Yeni', picture: 'https://example.com/p.png' });
  const user = store.publicUser(store.userForSession(store.createSession('g-1')));
  assert.equal(user.favorite.id, '432');
  assert.equal(user.name, 'Deniz Yeni');
});

import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { DATA_DIR } from './paths.js';

const FILE = path.join(DATA_DIR, 'users.json');
const SESSION_TTL = 30 * 86400000;
export const accounts = new EventEmitter();
let db = { version: 1, users: {}, sessions: {} };
let saveQueue = Promise.resolve();

export async function loadStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try { const saved = JSON.parse(await readFile(FILE, 'utf8')); if (saved.version === 1 && saved.users && saved.sessions) db = saved; } catch { /* A new deployment starts without accounts. */ }
  pruneSessions();
}
function persist() {
  const serialized = JSON.stringify(db);
  saveQueue = saveQueue.then(async () => { await writeFile(`${FILE}.tmp`, serialized); await rename(`${FILE}.tmp`, FILE); }).catch(e => console.error('User store write failed:', e.message));
}
function pruneSessions() { const cutoff = Date.now(); for (const [token, s] of Object.entries(db.sessions)) if (s.expiresAt < cutoff) delete db.sessions[token]; }

export function upsertUser(profile) {
  const old = db.users[profile.sub];
  db.users[profile.sub] = { id: profile.sub, email: profile.email, name: profile.name || profile.email, picture: profile.picture || null, favorite: old?.favorite || null, followed: old?.followed || [], language: old?.language || 'tr', createdAt: old?.createdAt || new Date().toISOString(), lastLoginAt: new Date().toISOString() };
  persist();
  return db.users[profile.sub];
}
export function createSession(userId) {
  pruneSessions();
  const token = randomBytes(32).toString('hex');
  db.sessions[token] = { userId, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL };
  persist();
  return token;
}
export function userForSession(token) {
  const session = token && db.sessions[token];
  if (!session || session.expiresAt < Date.now()) return null;
  return db.users[session.userId] || null;
}
export function deleteSession(token) { if (token && db.sessions[token]) { delete db.sessions[token]; persist(); } }
export function setTeams(userId, favorite, followed, language) {
  const user = db.users[userId];
  if (!user) return null;
  user.favorite = favorite; user.followed = followed;
  if (language) user.language = language;
  persist();
  accounts.emit('teams');
  return user;
}
export function favoriteTeamIds() { return [...new Set(Object.values(db.users).map(u => u.favorite?.id).filter(Boolean))]; }
export function trackedTeamMap() {
  const map = new Map();
  for (const user of Object.values(db.users)) for (const team of [user.favorite, ...(user.followed || [])]) if (team?.id) map.set(team.id, team);
  return map;
}
export const publicUser = user => user && { id: user.id, email: user.email, name: user.name, picture: user.picture, favorite: user.favorite, followed: user.followed || [], language: user.language || 'tr' };

export function languagesInUse() {
  const langs = new Set(['tr']);
  for (const user of Object.values(db.users)) if (user.language) langs.add(user.language);
  return [...langs];
}

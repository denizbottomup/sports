import express from 'express';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { dashboard, startData, changes } from './data.js';
import { MEDIA_DIR } from './paths.js';
import { loadStore, upsertUser, createSession, deleteSession, setTeams, publicUser } from './store.js';
import { verifyGoogleCredential, currentUser, cookieToken, setSessionCookie, clearSessionCookie } from './auth.js';
import { loadDirectory, refreshDirectory, startDirectory, searchTeams, teamById, directoryInfo } from './teams.js';
import { SUPPORTED_LANGUAGES, summarizerEnabled } from './summarize.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.get('/healthz', (_req, res) => res.type('text').send('ok\n'));
// Cookie oturumu kullanıldığı için durum değiştiren isteklerde Origin başlığı sunucunun kendi adresi olmalı.
app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && process.env.NODE_ENV === 'production' && req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: 'Yetkisiz istek kaynağı' }); } catch { return res.status(403).json({ error: 'Yetkisiz istek kaynağı' }); }
  }
  next();
});
app.get('/api/config', (_req, res) => res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null, languages: SUPPORTED_LANGUAGES, summaries: summarizerEnabled() }));
app.post('/api/auth/google', async (req, res) => {
  try {
    const profile = await verifyGoogleCredential(req.body?.credential);
    const user = upsertUser(profile);
    setSessionCookie(res, createSession(user.id));
    res.json({ user: publicUser(user) });
  } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Giriş tamamlanamadı' }); }
});
app.post('/api/auth/logout', (req, res) => { deleteSession(cookieToken(req)); clearSessionCookie(res); res.json({ ok: true }); });
app.get('/api/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Giriş gerekli' });
  res.set('Cache-Control', 'no-store').json({ user: publicUser(user) });
});
app.put('/api/me/teams', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Giriş gerekli' });
  const favorite = teamById(req.body?.favorite);
  if (!favorite) return res.status(400).json({ error: 'Favori takım dizinde bulunamadı' });
  const requested = Array.isArray(req.body?.followed) ? req.body.followed.map(String) : [];
  const followed = [...new Set(requested)].filter(id => id !== favorite.id).map(id => teamById(id)).filter(Boolean);
  if (followed.length !== [...new Set(requested)].filter(id => id !== favorite.id).length) return res.status(400).json({ error: 'Takip listesindeki bir takım dizinde bulunamadı' });
  if (followed.length > 5) return res.status(400).json({ error: 'En fazla 5 takım takip edilebilir' });
  const language = req.body?.language === undefined ? undefined : String(req.body.language);
  if (language !== undefined && !SUPPORTED_LANGUAGES[language]) return res.status(400).json({ error: 'Desteklenmeyen dil' });
  const updated = setTeams(user.id, favorite, followed, language);
  res.json({ user: publicUser(updated) });
});
app.get('/api/teams', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ teams: searchTeams(String(req.query.query ?? req.query.q ?? '')), directory: directoryInfo() });
});
app.get('/api/dashboard', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Giriş gerekli' });
  res.set('Cache-Control', 'no-store').json(dashboard(user));
});
let clients = 0;
app.get('/api/events', (req, res) => {
  if (!currentUser(req)) return res.status(401).end();
  if (clients >= 250) return res.status(503).end();
  clients++;
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 5000\nevent: connected\ndata: {}\n\n');
  let writable = true;
  const listener = update => { if (writable) writable = res.write(`event: update\ndata: ${JSON.stringify(update)}\n\n`); };
  res.on('drain', () => { writable = true; });
  changes.on('update', listener);
  const heartbeat = setInterval(() => { if (writable) writable = res.write(': keepalive\n\n'); }, 20000);
  req.on('close', () => { clients--; clearInterval(heartbeat); changes.off('update', listener); });
});
changes.setMaxListeners(260);
app.get('/media/:id', async (req, res) => {
  if (!/^[a-f0-9]{24}$/.test(req.params.id)) return res.status(404).end();
  try {
    const meta = JSON.parse(await readFile(path.join(MEDIA_DIR, `${req.params.id}.json`), 'utf8'));
    res.set({ 'Content-Type': meta.type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
    res.sendFile(path.join(MEDIA_DIR, `${req.params.id}.img`), err => { if (err && !res.headersSent) res.status(404).end(); });
  } catch { res.set('Cache-Control', 'no-store').status(404).end(); }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Bulunamadı' }));
const dist = path.resolve('web/dist');
app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }));
app.use(express.static(dist, { maxAge: 0, setHeaders: res => res.set('Cache-Control', 'no-cache') }));
app.get('/{*page}', (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html')));
app.use((err, _req, res, _next) => res.status(err.status === 404 ? 404 : err.status === 400 ? 400 : 500).json({ error: err.status === 404 ? 'Bulunamadı' : err.status === 400 ? 'Geçersiz istek' : 'Sunucu hatası' }));

const server = app.listen(Number(process.env.PORT || 3002), '0.0.0.0', () => console.log(`Touchline listening on ${process.env.PORT || 3002}`));
let stopData, stopDirectory;
async function boot() {
  await loadStore();
  await loadDirectory();
  refreshDirectory().then(() => console.log('Team directory ready')).catch(e => console.error('Team directory refresh failed:', e.message));
  stopDirectory = startDirectory();
  stopData = await startData();
  console.log('Initial data refresh complete');
}
boot().catch(e => console.error('Initial refresh failed:', e.message));
function shutdown() { stopData?.(); stopDirectory?.(); server.close(); server.closeAllConnections(); setTimeout(() => process.exit(0), 500).unref(); }
process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);

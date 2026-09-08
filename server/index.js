import express from 'express';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { dashboard, startData, changes, MEDIA_DIR } from './data.js';

const app = express();
app.disable('x-powered-by');
app.get('/healthz', (_req, res) => res.type('text').send('ok\n'));
app.get('/api/dashboard', (_req, res) => res.set('Cache-Control', 'no-store').json(dashboard()));
let clients = 0;
app.get('/api/events', (req, res) => {
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
app.use((err, _req, res, _next) => res.status(err.status === 404 ? 404 : 500).json({ error: err.status === 404 ? 'Bulunamadı' : 'Sunucu hatası' }));

const server = app.listen(Number(process.env.PORT || 3002), '0.0.0.0', () => console.log(`Touchline listening on ${process.env.PORT || 3002}`));
let stopData;
startData().then(stop => { stopData = stop; console.log('Initial data refresh complete'); }).catch(e => console.error('Initial refresh failed:', e.message));
function shutdown() { stopData?.(); server.close(); server.closeAllConnections(); setTimeout(() => process.exit(0), 500).unref(); }
process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);

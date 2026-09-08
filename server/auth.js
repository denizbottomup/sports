import { createPublicKey, verify } from 'node:crypto';
import { userForSession } from './store.js';

const COOKIE = 'tl_session';
const fail = (message, status) => Object.assign(new Error(message), { status });

export function cookieToken(req) {
  return (req.headers.cookie || '').split(/;\s*/).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || null;
}
export function currentUser(req) { return userForSession(cookieToken(req)); }
const secure = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '');
export function setSessionCookie(res, token) { res.append('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${secure()}`); }
export function clearSessionCookie(res) { res.append('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure()}`); }

let certCache = { keys: null, fetchedAt: 0 };
async function googleKeys(force = false) {
  if (force || !certCache.keys || Date.now() - certCache.fetchedAt > 6 * 3600000) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw fail('Google imza anahtarları alınamadı', 502);
    certCache = { keys: (await response.json()).keys || [], fetchedAt: Date.now() };
  }
  return certCache.keys;
}
const part = (value, json) => { try { return json ? JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) : Buffer.from(value, 'base64url'); } catch { return null; } };

// Google Identity Services ID token doğrulaması. Token dış servise gönderilmez; imza yerel olarak Google'ın açık anahtarlarıyla kontrol edilir.
export async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw fail('Google girişi yapılandırılmadı: GOOGLE_CLIENT_ID tanımlı değil', 503);
  if (typeof credential !== 'string' || credential.length > 4096) throw fail('Geçersiz kimlik bilgisi', 400);
  const [rawHeader, rawPayload, rawSignature] = credential.split('.');
  const header = rawHeader && part(rawHeader, true), payload = rawPayload && part(rawPayload, true), signature = rawSignature && part(rawSignature, false);
  if (!header || !payload || !signature || header.alg !== 'RS256') throw fail('Geçersiz kimlik bilgisi', 400);
  let jwk = (await googleKeys()).find(key => key.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find(key => key.kid === header.kid);
  if (!jwk) throw fail('Google kimliği doğrulanamadı', 401);
  const valid = verify('RSA-SHA256', Buffer.from(`${rawHeader}.${rawPayload}`), createPublicKey({ key: jwk, format: 'jwk' }), signature);
  const issuerOk = ['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss);
  if (!valid || payload.aud !== clientId || !issuerOk || Number(payload.exp) * 1000 < Date.now()) throw fail('Google kimliği doğrulanamadı', 401);
  if (!payload.sub || !payload.email || payload.email_verified !== true) throw fail('Doğrulanmış bir Google e-postası gerekli', 401);
  return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
}

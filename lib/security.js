const crypto = require('node:crypto');

const COOKIE_NAME = 'kotiki_admin_session';
const SESSION_TTL_SECONDS = 30 * 60;
const MAX_BODY_BYTES = 4096;
const memoryLimits = new Map();

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function sendJson(res, status, payload) {
  setSecurityHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

function methodOnly(req, res, method) {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  sendJson(res, 405, { error: 'Метод не поддерживается.' });
  return false;
}

function readBody(req) {
  const contentLength = Number(req.headers?.['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error('Слишком большой запрос.');
  }
  if (req.body && typeof req.body === 'object') {
    if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > MAX_BODY_BYTES) {
      throw new Error('Слишком большой запрос.');
    }
    return req.body;
  }
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) throw new Error('Слишком большой запрос.');
    return JSON.parse(req.body || '{}');
  }
  return {};
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // Read-only health checks may omit Origin.
  try {
    const parsed = new URL(origin);
    const host = String(req.headers.host || '').toLowerCase();
    return parsed.protocol === 'https:' && parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function getIp(req) {
  const realIp = String(req.headers['x-real-ip'] || '').trim();
  if (realIp) return realIp;
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').pop().trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function auditEvent(req, event, details = {}) {
  const ipHash = crypto.createHash('sha256').update(getIp(req)).digest('hex').slice(0, 16);
  // Never log passwords, recovery keys, cookies, or raw IP addresses.
  console.info(JSON.stringify({ service: 'KOTIKI_SHIELD', event, at: new Date().toISOString(), ipHash, ...details }));
}

async function consumeRateLimit(req, key, limit, windowSeconds) {
  const ip = getIp(req);
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisKey = `kotiki:${key}:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24)}`;

  if (redisUrl && redisToken) {
    const script = "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count";
    const response = await fetch(`${redisUrl.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['EVAL', script, '1', redisKey, String(windowSeconds)]])
    });
    if (!response.ok) throw new Error('Хранилище ограничения запросов недоступно.');
    const result = await response.json();
    const count = Number(result?.[0]?.result);
    if (!Number.isFinite(count)) throw new Error('Не удалось проверить лимит запросов.');
    return { allowed: count <= limit, mode: 'distributed', remaining: Math.max(0, limit - count) };
  }

  const now = Date.now();
  const existing = memoryLimits.get(redisKey);
  const state = !existing || now >= existing.resetAt ? { count: 0, resetAt: now + windowSeconds * 1000 } : existing;
  state.count += 1;
  memoryLimits.set(redisKey, state);
  if (memoryLimits.size > 5000) {
    for (const [k, v] of memoryLimits) if (now >= v.resetAt) memoryLimits.delete(k);
  }
  return { allowed: state.count <= limit, mode: 'best-effort', remaining: Math.max(0, limit - state.count) };
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ah = crypto.createHash('sha256').update(a).digest();
  const bh = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ah, bh) && a.length === b.length;
}

function sessionSecret() {
  const secret = process.env.KOTIKI_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) return null;
  return secret;
}

function makeSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error('Не настроен KOTIKI_SESSION_SECRET (минимум 32 символа).');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, role: 'owner', nonce: crypto.randomBytes(12).toString('hex') })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  for (const item of cookies) {
    const idx = item.indexOf('=');
    if (idx < 0) continue;
    if (item.slice(0, idx).trim() === name) return item.slice(idx + 1).trim();
  }
  return '';
}

function verifySession(req) {
  const secret = sessionSecret();
  if (!secret) return false;
  const token = readCookie(req, COOKIE_NAME);
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!constantTimeEqual(signature, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'owner' && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function requireSameOrigin(req, res) {
  // State-changing authentication endpoints must include the exact same HTTPS origin.
  // Requests with no Origin are rejected here; read-only endpoints may still omit it.
  if (req.headers.origin && checkOrigin(req)) return true;
  sendJson(res, 403, { error: 'Запрос с другого источника заблокирован.' });
  return false;
}

module.exports = {
  COOKIE_NAME, SESSION_TTL_SECONDS, setSecurityHeaders, sendJson, methodOnly, readBody,
  checkOrigin, consumeRateLimit, constantTimeEqual, makeSession, verifySession, auditEvent,
  setSessionCookie, clearSessionCookie, requireSameOrigin
};

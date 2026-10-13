const test = require('node:test');
const assert = require('node:assert/strict');
const security = require('../lib/security');

test('constantTimeEqual accepts equal strings and rejects mismatches', () => {
  assert.equal(security.constantTimeEqual('same-value', 'same-value'), true);
  assert.equal(security.constantTimeEqual('same-value', 'other-value'), false);
  assert.equal(security.constantTimeEqual('', 'x'), false);
  assert.equal(security.constantTimeEqual(null, 'x'), false);
});

test('checkOrigin rejects absent, malformed, insecure, and cross-site origins', () => {
  assert.equal(security.checkOrigin({ headers: { host: 'example.com' } }), false);
  assert.equal(security.checkOrigin({ headers: { origin: 'https://example.com', host: 'example.com' } }), true);
  assert.equal(security.checkOrigin({ headers: { origin: 'http://example.com', host: 'example.com' } }), false);
  assert.equal(security.checkOrigin({ headers: { origin: 'https://attacker.example', host: 'example.com' } }), false);
  assert.equal(security.checkOrigin({ headers: { origin: 'not a URL', host: 'example.com' } }), false);
});

test('readBody rejects oversized parsed and string bodies', () => {
  assert.deepEqual(security.readBody({ headers: {}, body: { ok: true } }), { ok: true });
  assert.throws(() => security.readBody({ headers: {}, body: { data: 'x'.repeat(5000) } }), /Слишком большой/);
  assert.throws(() => security.readBody({ headers: { 'content-length': '9000' }, body: '{}' }), /Слишком большой/);
  assert.throws(() => security.readBody({ headers: {}, body: '{' + 'x'.repeat(5000) }), /Слишком большой/);
});

test('readBody rejects non-object JSON payloads', () => {
  for (const body of ['null', 'false', '123', '"text"', '[]']) {
    assert.throws(() => security.readBody({ headers: {}, body }), /Некорректные данные/);
  }
  assert.throws(() => security.readBody({ headers: {}, body: null }), /Некорректные данные/);
  assert.throws(() => security.readBody({ headers: {}, body: [] }), /Некорректные данные/);
  assert.deepEqual(security.readBody({ headers: {} }), {});
  assert.deepEqual(security.readBody({ headers: {}, body: '' }), {});
});

test('session signatures are verified and tampering is rejected', () => {
  const previous = process.env.KOTIKI_SESSION_SECRET;
  process.env.KOTIKI_SESSION_SECRET = 'test-only-secret-that-is-at-least-32-characters';
  try {
    const token = security.makeSession();
    const req = { headers: { cookie: `${security.COOKIE_NAME}=${token}` } };
    assert.equal(security.verifySession(req), true);
    const [payload, signature] = token.split('.');
    const tamperedPayload = (payload[0] === 'a' ? 'b' : 'a') + payload.slice(1);
    const tampered = `${tamperedPayload}.${signature}`;
    assert.equal(security.verifySession({ headers: { cookie: `${security.COOKIE_NAME}=${tampered}` } }), false);
    assert.equal(security.verifySession({ headers: { cookie: '' } }), false);
    assert.equal(security.verifySession({ headers: { cookie: `${security.COOKIE_NAME}=${'x'.repeat(2049)}` } }), false);
    assert.equal(security.verifySession({ headers: { cookie: `${security.COOKIE_NAME}=not*base64.signature` } }), false);
  } finally {
    if (previous === undefined) delete process.env.KOTIKI_SESSION_SECRET;
    else process.env.KOTIKI_SESSION_SECRET = previous;
  }
});

test('session verification rejects expired, overlong, malformed, and unexpected claims', () => {
  const crypto = require('node:crypto');
  const previous = process.env.KOTIKI_SESSION_SECRET;
  const secret = 'test-only-secret-that-is-at-least-32-characters';
  process.env.KOTIKI_SESSION_SECRET = secret;
  const tokenFor = claims => {
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  };
  const now = Math.floor(Date.now() / 1000);
  const valid = { role: 'owner', exp: now + 600, nonce: 'a'.repeat(24) };
  const isValid = claims => security.verifySession({
    headers: { cookie: `${security.COOKIE_NAME}=${tokenFor(claims)}` }
  });
  try {
    assert.equal(isValid(valid), true);
    assert.equal(isValid({ ...valid, exp: now - 1 }), false);
    assert.equal(isValid({ ...valid, exp: now + 3601 }), false);
    assert.equal(isValid({ ...valid, role: 'visitor' }), false);
    assert.equal(isValid({ ...valid, nonce: 'not-a-valid-nonce' }), false);
    assert.equal(isValid({ ...valid, exp: 'tomorrow' }), false);
  } finally {
    if (previous === undefined) delete process.env.KOTIKI_SESSION_SECRET;
    else process.env.KOTIKI_SESSION_SECRET = previous;
  }
});

test('session cookie is HttpOnly, Secure, SameSite=Strict, and short-lived', () => {
  let cookie = '';
  const res = { setHeader(name, value) { if (name === 'Set-Cookie') cookie = value; } };
  security.setSessionCookie(res, 'test-token');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Max-Age=1800/);
});


test('distributed rate limit uses one atomic Redis command and bounds network time', async () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const previousFetch = global.fetch;
  let request;
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  global.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, async json() { return [{ result: 3 }]; } };
  };
  try {
    const result = await security.consumeRateLimit({ headers: { 'x-real-ip': '203.0.113.10' } }, 'test', 2, 60);
    assert.equal(result.allowed, false);
    assert.equal(result.mode, 'distributed');
    assert.equal(request.url, 'https://redis.example/pipeline');
    assert.equal(request.body.length, 1);
    assert.equal(request.body[0][0], 'EVAL');
    assert.match(request.body[0][1], /if count == 1 then redis\.call\('EXPIRE'/);
    assert.equal(request.body[0][2], '1');
    assert.equal(request.body[0][4], '60');
    assert.ok(request.options.signal);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});


test('security headers include cross-origin isolation and legacy policy protections', () => {
  const headers = {};
  const res = { setHeader(name, value) { headers[name] = value; } };
  security.setSecurityHeaders(res);
  assert.equal(headers['Cross-Origin-Opener-Policy'], 'same-origin');
  assert.equal(headers['Cross-Origin-Resource-Policy'], 'same-origin');
  assert.equal(headers['X-Permitted-Cross-Domain-Policies'], 'none');
  assert.equal(headers['X-DNS-Prefetch-Control'], 'off');
});

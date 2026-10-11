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


test('distributed rate limit uses an atomic fixed-window expiry script', async () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const originalFetch = global.fetch;
  const calls = [];
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  global.fetch = async (url, options) => {
    calls.push({ url, options, commands: JSON.parse(options.body) });
    return { ok: true, json: async () => [{ result: calls.length === 1 ? 1 : 2 }] };
  };
  try {
    const first = await security.consumeRateLimit({ headers: { 'x-real-ip': '192.0.2.1' } }, 'login-test', 5, 900);
    const second = await security.consumeRateLimit({ headers: { 'x-real-ip': '192.0.2.1' } }, 'login-test', 5, 900);
    assert.equal(first.mode, 'distributed');
    assert.equal(first.remaining, 4);
    assert.equal(second.remaining, 3);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.url, 'https://redis.example/pipeline');
      assert.equal(call.commands.length, 1);
      assert.equal(call.commands[0][0], 'EVAL');
      assert.match(call.commands[0][1], /if count == 1 then redis\.call\('EXPIRE'/);
      assert.equal(call.commands[0][2], '1');
      assert.equal(call.commands[0][4], '900');
    }
  } finally {
    global.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});

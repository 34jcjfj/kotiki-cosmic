const test = require('node:test');
const assert = require('node:assert/strict');
const security = require('../lib/security');

test('constantTimeEqual accepts equal strings and rejects mismatches', () => {
  assert.equal(security.constantTimeEqual('same-value', 'same-value'), true);
  assert.equal(security.constantTimeEqual('same-value', 'other-value'), false);
  assert.equal(security.constantTimeEqual('', 'x'), false);
  assert.equal(security.constantTimeEqual(null, 'x'), false);
});

test('checkOrigin allows absent Origin for non-browser clients', () => {
  assert.equal(security.checkOrigin({ headers: { host: 'example.com' } }), true);
});

test('checkOrigin requires matching HTTPS origin and request host', () => {
  assert.equal(security.checkOrigin({ headers: { origin: 'https://example.com', host: 'example.com' } }), true);
  assert.equal(security.checkOrigin({ headers: { origin: 'http://example.com', host: 'example.com' } }), false);
  assert.equal(security.checkOrigin({ headers: { origin: 'https://attacker.example', host: 'example.com' } }), false);
  assert.equal(security.checkOrigin({ headers: { origin: 'not a URL', host: 'example.com' } }), false);
});

test('session signatures are verified and tampering is rejected', () => {
  const previous = process.env.KOTIKI_SESSION_SECRET;
  process.env.KOTIKI_SESSION_SECRET = 'test-only-secret-that-is-at-least-32-characters';
  try {
    const token = security.makeSession();
    const req = { headers: { cookie: `${security.COOKIE_NAME}=${token}` } };
    assert.equal(security.verifySession(req), true);
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
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

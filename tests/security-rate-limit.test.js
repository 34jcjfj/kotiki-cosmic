const test = require('node:test');
const assert = require('node:assert/strict');
const security = require('../lib/security');

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
    const first = await security.consumeRateLimit(
      { headers: { 'x-real-ip': '192.0.2.1' } }, 'login-test', 5, 900
    );
    const second = await security.consumeRateLimit(
      { headers: { 'x-real-ip': '192.0.2.1' } }, 'login-test', 5, 900
    );
    assert.equal(first.mode, 'distributed');
    assert.equal(first.remaining, 4);
    assert.equal(second.remaining, 3);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.url, 'https://redis.example/pipeline');
      assert.equal(call.commands.length, 1);
      assert.equal(call.commands[0][0], 'EVAL');
      assert.ok(call.commands[0][1].includes("if count == 1 then redis.call('EXPIRE'"));
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

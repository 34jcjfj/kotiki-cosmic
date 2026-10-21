const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Discord webhook requests have a finite upstream timeout', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'api', 'admin', 'discord-webhook.js'), 'utf8');
  assert.match(source, /signal:\s*AbortSignal\.timeout\(5000\)/);
  assert.match(source, /redirect:\s*'error'/);
});

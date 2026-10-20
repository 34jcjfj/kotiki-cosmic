const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('site identifies the official 2.2 release consistently', () => {
  const html = read('public/index.html');
  assert.match(html, /name="kotiki-cosmic-version" content="2\.2\.0"/);
  assert.match(html, /RELEASE 2\.2/);
  assert.match(html, /Версия 2\.2\.0 · RELEASE/);
  assert.doesNotMatch(html, /BETA 2\.2|Версия 1\.0/);
});

test('smart mode measures device capabilities and adapts to real frame rate', () => {
  const html = read('public/index.html');
  const js = read('public/assets/js/site.js');
  const css = read('public/assets/css/site.css');
  assert.match(html, /id="performanceFps"/);
  assert.match(html, /id="performanceToggle"/);
  assert.match(js, /hardwareConcurrency/);
  assert.match(js, /deviceMemory/);
  assert.match(js, /measuredFps/);
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /visibilitychange/);
  assert.match(css, /html\.page-hidden/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('on-demand diagnostics cover accessibility basics and server health', () => {
  const html = read('public/index.html');
  const js = read('public/assets/js/site.js');
  assert.match(html, /id="runDiagnostics"/);
  assert.match(html, /id="diagnosticResults"/);
  assert.match(js, /img:not\(\[alt\]\)/);
  assert.match(js, /unnamedButtons/);
  assert.match(js, /unnamedLinks/);
  assert.match(js, /api\('\/api\/health'/);
  assert.match(js, /не полный аудит безопасности/);
});

test('production response policy keeps essential security headers', () => {
  const config = read('vercel.json');
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /X-Frame-Options/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /no-store, max-age=0/);
});

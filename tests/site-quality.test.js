const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('site identifies the official 2.3 release consistently', () => {
  const html = read('public/index.html');
  assert.match(html, /name="kotiki-cosmic-version" content="2\.3\.0"/);
  assert.match(html, /RELEASE 2\.3/);
  assert.match(html, /Версия 2\.3\.0 · RELEASE/);
  assert.doesNotMatch(html, /BETA 2\.3|Версия 1\.0/);
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


test('Discord statistics are visible, resilient, and use the current invite', () => {
  const html = read('public/index.html');
  const js = read('public/assets/js/site.js');
  const css = read('public/assets/css/site.css');
  assert.match(html, /id="serverStats"/);
  assert.match(html, /discord\.gg\/fh2HZHT4p/);
  assert.match(js, /approximate_member_count/);
  assert.match(js, /approximate_presence_count/);
  assert.match(js, /AbortController/);
  assert.match(css, /reveal-pending\{filter:none!important\}/);
});


test('release motion tuning keeps the released product out of Beta and preserves low-cost effects', () => {
  const html = read('public/index.html');
  const css = read('public/assets/css/site.css');
  assert.match(html, /release-banner/);
  assert.match(html, /Версия 2\.3\.0 · RELEASE/);
  assert.doesNotMatch(html, /class="beta-release/);
  assert.match(css, /\.smart-lite \.cosmic-glow/);
  assert.match(css, /lite-planet-breathe/);
  assert.match(css, /\.gothic-title\{animation-duration:7\.5s!important\}/);
  assert.match(css, /\.orbit\.two\{animation-duration:96s!important\}/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});


test('cosmic background and interactive comet sheen remain present and motion-safe'', () => {
  const html = read('public/index.html');
  const css = read('public/assets/css/site.css');
  assert.match(html, /class="meteor-layer"/);
  assert.match(css, /@keyframes meteor-fall/);
  assert.match(css, /\.meteor-layer i\{/);
  assert.match(css, /\.smart-lite \.meteor-layer i/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /RELEASE 2\.4 — low-cost interactive comet sheen/);
  assert.match(css, /\.btn\.primary:hover::after/);
  assert.match(css, /\.btn\.primary::after\{transition:none!important\}/);
});

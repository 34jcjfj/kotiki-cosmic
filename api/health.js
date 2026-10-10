const { sendJson, methodOnly } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'GET')) return;
  const configured = Boolean(process.env.KOTIKI_ADMIN_PASSWORD && process.env.KOTIKI_RECOVERY_KEY && process.env.KOTIKI_SESSION_SECRET && Buffer.byteLength(process.env.KOTIKI_SESSION_SECRET || '', 'utf8') >= 32);
  return sendJson(res, configured ? 200 : 503, {
    ok: configured,
    service: 'KOTIKI SHIELD',
    mode: configured ? 'server-auth-ready' : 'setup-required',
    rateLimit: process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? 'distributed' : 'best-effort',
    note: configured ? 'Серверная авторизация настроена.' : 'Нужно добавить серверные переменные окружения.'
  });
};

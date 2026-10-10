const { sendJson, methodOnly, readBody, consumeRateLimit, constantTimeEqual, makeSession, setSessionCookie, requireSameOrigin, auditEvent } = require('../../lib/security');

module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireSameOrigin(req, res)) return;
  if (!process.env.KOTIKI_ADMIN_PASSWORD || !process.env.KOTIKI_RECOVERY_KEY || !process.env.KOTIKI_SESSION_SECRET) return sendJson(res, 503, { error: 'Сначала настрой серверные переменные окружения.' });
  let body;
  try { body = readBody(req); } catch { return sendJson(res, 400, { error: 'Некорректные данные запроса.' }); }
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password || password.length > 256) return sendJson(res, 400, { error: 'Введи корректный пароль.' });
  try {
    const limit = await consumeRateLimit(req, 'login', 5, 15 * 60);
    if (!limit.allowed) { auditEvent(req, 'login_rate_limited', { rateLimit: limit.mode }); return sendJson(res, 429, { error: 'Слишком много попыток. Подожди 15 минут и попробуй снова.' }); }
    if (!constantTimeEqual(password, process.env.KOTIKI_ADMIN_PASSWORD)) { auditEvent(req, 'login_failed', { rateLimit: limit.mode }); return sendJson(res, 401, { error: 'Неверный пароль.' }); }
    auditEvent(req, 'login_success', { rateLimit: limit.mode });
    setSessionCookie(res, makeSession());
    return sendJson(res, 200, { ok: true, expiresIn: 1800 });
  } catch (err) {
    return sendJson(res, 503, { error: err.message || 'Служба защиты временно недоступна.' });
  }
};

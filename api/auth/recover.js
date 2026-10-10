const { sendJson, methodOnly, readBody, consumeRateLimit, constantTimeEqual, makeSession, setSessionCookie, requireSameOrigin, auditEvent } = require('../../lib/security');

module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireSameOrigin(req, res)) return;
  if (!process.env.KOTIKI_RECOVERY_KEY || !process.env.KOTIKI_SESSION_SECRET) return sendJson(res, 503, { error: 'Восстановление ещё не настроено на сервере.' });
  let body;
  try { body = readBody(req); } catch { return sendJson(res, 400, { error: 'Некорректные данные запроса.' }); }
  const key = typeof body.key === 'string' ? body.key : '';
  if (!key || key.length > 512) return sendJson(res, 400, { error: 'Введи корректный ключ восстановления.' });
  try {
    const limit = await consumeRateLimit(req, 'recover', 3, 30 * 60);
    if (!limit.allowed) { auditEvent(req, 'recovery_rate_limited', { rateLimit: limit.mode }); return sendJson(res, 429, { error: 'Слишком много попыток восстановления. Подожди 30 минут.' }); }
    if (!constantTimeEqual(key, process.env.KOTIKI_RECOVERY_KEY)) { auditEvent(req, 'recovery_failed', { rateLimit: limit.mode }); return sendJson(res, 401, { error: 'Ключ восстановления не подошёл.' }); }
    auditEvent(req, 'recovery_success', { rateLimit: limit.mode });
    setSessionCookie(res, makeSession());
    return sendJson(res, 200, { ok: true, expiresIn: 1800 });
  } catch (err) {
    return sendJson(res, 503, { error: err.message || 'Служба восстановления временно недоступна.' });
  }
};

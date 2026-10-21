const { sendJson, methodOnly, readBody, consumeRateLimit, verifySession, requireSameOrigin, auditEvent } = require('../../lib/security');

module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireSameOrigin(req, res)) return;
  if (!await verifySession(req)) {
    auditEvent(req, 'admin_action_rejected', { route: '/api/admin/discord-webhook', reason: 'invalid_session' });
    return sendJson(res, 401, { error: 'Войди в панель владельца.' });
  }

  let body;
  try { body = readBody(req, 8192); } catch { return sendJson(res, 400, { error: 'Некорректные данные запроса.' }); }
  const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!webhookUrl || webhookUrl.length > 500) return sendJson(res, 400, { error: 'Вставь корректную ссылку вебхука.' });
  if (!message || message.length > 2000) return sendJson(res, 400, { error: 'Сообщение должно содержать от 1 до 2000 символов.' });

  let url;
  try { url = new URL(webhookUrl); } catch { return sendJson(res, 400, { error: 'Ссылка вебхука имеет неверный формат.' }); }
  if (url.protocol !== 'https:' || url.hostname !== 'discord.com' || url.port || url.username || url.password || url.search || url.hash || !/^\/api\/webhooks\/[0-9]{17,22}\/[A-Za-z0-9._-]{20,}$/.test(url.pathname)) {
    return sendJson(res, 400, { error: 'Разрешены только прямые ссылки Discord-вебхуков вида discord.com/api/webhooks/…' });
  }

  try {
    const limit = await consumeRateLimit(req, 'discord_webhook_send', 5, 60);
    if (!limit.allowed) { res.setHeader('Retry-After', '60'); auditEvent(req, 'admin_webhook_rate_limited', { rateLimit: limit.mode }); return sendJson(res, 429, { error: 'Слишком часто. Подожди минуту перед следующей отправкой.' }); }
    const response = await fetch(url.href, {
      method: 'POST',
      redirect: 'error',
      // Bound upstream wait time so Discord/network stalls cannot occupy the serverless function indefinitely.
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message, allowed_mentions: { parse: [] } })
    });
    if (!response.ok) {
      auditEvent(req, 'admin_webhook_upstream_rejected', { upstreamStatus: response.status });
      if (response.status === 401 || response.status === 404) return sendJson(res, 400, { error: 'Discord отклонил ссылку вебхука. Проверь, что она актуальна.' });
      if (response.status === 429) return sendJson(res, 429, { error: 'Discord временно ограничил отправку. Попробуй чуть позже.' });
      return sendJson(res, 502, { error: 'Discord не принял сообщение. Попробуй позже.' });
    }
    auditEvent(req, 'admin_webhook_sent');
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    auditEvent(req, 'admin_webhook_service_error');
    return sendJson(res, 503, { error: 'Не удалось связаться с Discord или службой ограничения запросов.' });
  }
};

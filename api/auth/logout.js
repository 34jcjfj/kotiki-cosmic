const { sendJson, methodOnly, clearSessionCookie, requireSameOrigin, revokeSession } = require('../../lib/security');
module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireSameOrigin(req, res)) return;
  try {
    await revokeSession(req);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  } catch {
    clearSessionCookie(res);
    return sendJson(res, 503, { error: 'Cookie удалена, но сервер не смог подтвердить завершение сессии. Повтори выход чуть позже.' });
  }
};

const { sendJson, methodOnly, clearSessionCookie, requireSameOrigin, revokeSession } = require('../../lib/security');
module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireSameOrigin(req, res)) return;
  try {
    const result = await revokeSession(req);
    clearSessionCookie(res);
    if (result.revoked && result.mode !== 'distributed') {
      return sendJson(res, 503, { error: 'Cookie удалена, но распределённый отзыв сессии не настроен. Скопированная сессия может действовать до истечения срока.' });
    }
    return sendJson(res, 200, { ok: true });
  } catch {
    clearSessionCookie(res);
    return sendJson(res, 503, { error: 'Cookie удалена, но сервер не смог подтвердить завершение сессии. Повтори выход чуть позже.' });
  }
};

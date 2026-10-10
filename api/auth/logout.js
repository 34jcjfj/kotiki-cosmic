const { sendJson, methodOnly, clearSessionCookie, requireSameOrigin } = require('../../lib/security');
module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireSameOrigin(req, res)) return;
  clearSessionCookie(res);
  return sendJson(res, 200, { ok: true });
};

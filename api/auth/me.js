const { sendJson, methodOnly, verifySession } = require('../../lib/security');
module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'GET')) return;
  if (!verifySession(req)) return sendJson(res, 401, { ok: false, error: 'Войди в панель владельца.' });
  return sendJson(res, 200, { ok: true, role: 'owner' });
};

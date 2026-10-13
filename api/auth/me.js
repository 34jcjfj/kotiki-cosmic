const { sendJson, methodOnly, verifySession, auditEvent } = require('../../lib/security');
module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'GET')) return;
  if (!await verifySession(req)) {
    auditEvent(req, 'admin_session_rejected', { route: '/api/auth/me' });
    return sendJson(res, 401, { ok: false, error: 'Войди в панель владельца.' });
  }
  auditEvent(req, 'admin_session_verified', { route: '/api/auth/me' });
  return sendJson(res, 200, { ok: true, role: 'owner' });
};

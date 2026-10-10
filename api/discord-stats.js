const { sendJson, methodOnly } = require('../lib/security');

const DEFAULT_GUILD_ID = '1431670233474662601';

module.exports = async function handler(req, res) {
  if (!methodOnly(req, res, 'GET')) return;

  const guildId = process.env.DISCORD_GUILD_ID || DEFAULT_GUILD_ID;
  if (!/^\d{17,20}$/.test(guildId)) {
    return sendJson(res, 500, { ok: false, error: 'DISCORD_GUILD_ID is not configured correctly.' });
  }

  try {
    const response = await fetch(
      `https://discord.com/api/guilds/${guildId}/widget.json`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
    );

    if (!response.ok) {
      // Discord only serves this endpoint when the server's public widget is enabled.
      return sendJson(res, 503, {
        ok: false,
        service: 'KOTIKI Discord public stats',
        error: 'Discord public server widget is unavailable. It may be disabled or not accessible.',
        setup: 'Enable the server widget in Discord settings, then try again.'
      });
    }

    const widget = await response.json();
    const presenceCount = Number(widget.presence_count);

    // Return aggregate public data only; never forward member names, avatars, invite links,
    // or other individual-level widget fields to the public stats endpoint.
    return sendJson(res, 200, {
      ok: true,
      service: 'KOTIKI Discord public stats',
      guild_id: String(widget.id || guildId),
      server_name: typeof widget.name === 'string' ? widget.name : null,
      online_count: Number.isFinite(presenceCount) ? presenceCount : null,
      public_channel_count: Array.isArray(widget.channels) ? widget.channels.length : null,
      total_member_count: null,
      total_member_count_note: 'Discord public widget does not provide a reliable total member count.',
      source: 'Discord public server widget',
      fetched_at: new Date().toISOString()
    });
  } catch {
    return sendJson(res, 502, {
      ok: false,
      service: 'KOTIKI Discord public stats',
      error: 'Could not retrieve public statistics from Discord right now.'
    });
  }
};

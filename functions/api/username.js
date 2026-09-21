// /functions/api/username.js
// POST { username } — sets the username for the currently logged-in user.
// Enforces: only once per 30 days, unique, valid format.
// Reads session from X-SS-Session header (Android) OR ss_session cookie (web).

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, request);
  }

  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) return json({ error: 'Server config error' }, 500, request);

  let cookieValue = null;
  const headerSession = request.headers.get('X-SS-Session');
  if (headerSession) {
    cookieValue = headerSession;
  } else {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/(?:^|;\s*)ss_session=([^;]+)/);
    if (match) cookieValue = decodeURIComponent(match[1]);
  }

  if (!cookieValue) return json({ error: 'Not signed in' }, 401, request);

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return json({ error: 'Invalid session' }, 401, request);

  const [payloadB64, providedSig] = parts;
  let payloadStr;
  try { payloadStr = base64urlDecode(payloadB64); }
  catch (e) { return json({ error: 'Invalid session' }, 401, request); }

  const expectedSig = await hmacSign(payloadStr, sessionSecret);
  if (expectedSig !== providedSig) return json({ error: 'Invalid session' }, 401, request);

  let session;
  try { session = JSON.parse(payloadStr); }
  catch (e) { return json({ error: 'Invalid session' }, 401, request); }

  if (!session.userId) return json({ error: 'User not found' }, 400, request);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Invalid JSON' }, 400, request); }

  const username = (body.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return json({ error: 'Username must be 3-20 characters: letters, numbers, underscore.' }, 400, request);
  }

  if (!env.DB) return json({ error: 'Database unavailable' }, 500, request);

  try {
    const me = await env.DB.prepare(
      'SELECT username, username_changed_at FROM users WHERE id = ?'
    ).bind(session.userId).first();

    if (!me) return json({ error: 'User not found' }, 404, request);

    const now = Date.now();
    const cooldownMs = 30 * 24 * 60 * 60 * 1000;

    if (me.username && me.username !== username) {
      const lastChanged = me.username_changed_at || 0;
      const elapsed = now - lastChanged;
      if (elapsed < cooldownMs) {
        const nextAllowed = lastChanged + cooldownMs;
        return json({
          error: 'Cooldown',
          nextAllowedAt: nextAllowed,
          message: 'You can only change your username once every 30 days.'
        }, 429, request);
      }
    }

    if (me.username === username) {
      return json({ success: true, username, unchanged: true }, 200, request);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ?'
    ).bind(username, session.userId).first();
    if (existing) return json({ error: 'Username taken' }, 409, request);

    await env.DB.prepare(
      'UPDATE users SET username = ?, username_changed_at = ? WHERE id = ?'
    ).bind(username, now, session.userId).run();

    return json({ success: true, username, changedAt: now }, 200, request);
  } catch (e) {
    return json({ error: 'Database error', detail: String(e) }, 500, request);
  }
}

// ============ helpers ============
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = [
    'https://smartsaver.pages.dev',
    'https://localhost',
    'http://localhost'
  ];
  const allowOrigin = allowed.includes(origin) ? origin : 'https://smartsaver.pages.dev';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-SS-Session',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  };
}

function json(obj, status, request) {
  const headers = Object.assign(
    {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    corsHeaders(request)
  );
  return new Response(JSON.stringify(obj), { status: status || 200, headers: headers });
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64urlEncodeBytes(new Uint8Array(sig));
}
function base64urlEncodeBytes(bytes) { let b = ''; for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i]); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function base64urlDecode(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; return atob(str); }

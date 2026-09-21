// /functions/api/friends/data.js
// GET ?friendId=N — returns a friend's PUBLIC goal progress (no amounts).
// Reads session from X-SS-Session header (Android) OR ss_session cookie (web).

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const friendId = parseInt(url.searchParams.get('friendId')) || 0;
  if (!friendId) return json({ error: 'Friend ID required' }, 400, request);

  const session = await getSession(request, env);
  if (!session || !session.userId) return json({ error: 'Not signed in' }, 401, request);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500, request);

  const me = session.userId;
  try {
    const friendship = await env.DB.prepare(
      'SELECT id FROM friends WHERE user_id = ? AND friend_user_id = ?'
    ).bind(me, friendId).first();
    if (!friendship) return json({ error: 'Not friends' }, 403, request);

    const friend = await env.DB.prepare(
      'SELECT id, username, name, picture FROM users WHERE id = ?'
    ).bind(friendId).first();
    if (!friend) return json({ error: 'User not found' }, 404, request);

    const goalsRaw = await env.DB.prepare(
      'SELECT name, target, saved, target_date FROM goals WHERE user_id = ? ORDER BY created_at ASC'
    ).bind(friendId).all();

    const goals = (goalsRaw.results || []).map(g => {
      const pct = (g.target && g.target > 0) ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
      return {
        name: g.name,
        progress: pct,
        targetDate: g.target_date || ''
      };
    });

    return json({
      success: true,
      friend: {
        id: friend.id,
        username: friend.username,
        name: friend.name,
        picture: friend.picture
      },
      goals: goals
    }, 200, request);
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

async function getSession(request, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) return null;

  let cookieValue = null;
  const headerSession = request.headers.get('X-SS-Session');
  if (headerSession) {
    cookieValue = headerSession;
  } else {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/(?:^|;\s*)ss_session=([^;]+)/);
    if (match) cookieValue = decodeURIComponent(match[1]);
  }

  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, providedSig] = parts;
  let payloadStr;
  try { payloadStr = base64urlDecode(payloadB64); } catch (e) { return null; }
  const expectedSig = await hmacSign(payloadStr, secret);
  if (expectedSig !== providedSig) return null;
  try { return JSON.parse(payloadStr); } catch (e) { return null; }
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64urlEncodeBytes(new Uint8Array(sig));
}
function base64urlEncodeBytes(bytes) { let b = ''; for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i]); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function base64urlDecode(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; return atob(str); }

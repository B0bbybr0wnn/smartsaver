// /functions/api/buzzes.js
// GET — returns all unseen buzzes for the current user.
// Reads session from X-SS-Session header (Android) OR ss_session cookie (web).

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const session = await getSession(request, env);
  if (!session || !session.userId) return json({ error: 'Not signed in' }, 401, request);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500, request);

  const me = session.userId;
  try {
    const rows = await env.DB.prepare(
      'SELECT b.id, b.created_at, u.username, u.name, u.picture FROM buzzes b JOIN users u ON u.id = b.from_user_id WHERE b.to_user_id = ? AND b.seen = 0 ORDER BY b.created_at DESC LIMIT 50'
    ).bind(me).all();

    return json({
      success: true,
      buzzes: (rows.results || []).map(b => ({
        id: b.id,
        fromUsername: b.username,
        fromName: b.name,
        fromPicture: b.picture,
        createdAt: b.created_at
      }))
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

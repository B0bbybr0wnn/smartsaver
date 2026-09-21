// /functions/api/buzz.js
// POST { friendId, action } — action 'send' to buzz, 'seen' to mark all as seen.
// Reads session from X-SS-Session header (Android) OR ss_session cookie (web).

export async function onRequest(context) {
  const { env, request } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const session = await getSession(request, env);
  if (!session || !session.userId) return json({ error: 'Not signed in' }, 401);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Invalid JSON' }, 400); }

  const action = body.action || 'send';
  const me = session.userId;

  try {
    if (action === 'seen') {
      await env.DB.prepare('UPDATE buzzes SET seen = 1 WHERE to_user_id = ?').bind(me).run();
      return json({ success: true }, 200);
    }

    const friendId = parseInt(body.friendId) || 0;
    if (!friendId) return json({ error: 'Friend ID required' }, 400);

    const friendship = await env.DB.prepare(
      'SELECT id FROM friends WHERE user_id = ? AND friend_user_id = ?'
    ).bind(me, friendId).first();
    if (!friendship) return json({ error: 'Not friends' }, 403);

    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await env.DB.prepare(
      'SELECT id FROM buzzes WHERE from_user_id = ? AND to_user_id = ? AND created_at > ?'
    ).bind(me, friendId, dayAgo).first();
    if (recent) return json({ error: 'Already buzzed them in the last 24 hours. Give it a rest.' }, 429);

    await env.DB.prepare(
      'INSERT INTO buzzes (from_user_id, to_user_id, seen, created_at) VALUES (?, ?, 0, ?)'
    ).bind(me, friendId, Date.now()).run();

    return json({ success: true }, 200);
  } catch (e) {
    return json({ error: 'Database error', detail: String(e) }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
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

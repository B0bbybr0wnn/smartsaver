// /functions/api/friends/decline.js
// POST { requestId } — decline an incoming friend request.

export async function onRequest(context) {
  const { env, request } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const session = await getSession(request, env);
  if (!session || !session.userId) return json({ error: 'Not signed in' }, 401);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Invalid JSON' }, 400); }

  const requestId = parseInt(body.requestId) || 0;
  if (!requestId) return json({ error: 'Request ID required' }, 400);

  const me = session.userId;
  try {
    const req = await env.DB.prepare(
      'SELECT id, status FROM friend_requests WHERE id = ? AND to_user_id = ?'
    ).bind(requestId, me).first();

    if (!req) return json({ error: 'Request not found' }, 404);
    if (req.status !== 'pending') return json({ error: 'Already handled' }, 409);

    await env.DB.prepare('UPDATE friend_requests SET status = ?, responded_at = ? WHERE id = ?')
      .bind('declined', Date.now(), requestId).run();

    return json({ success: true }, 200);
  } catch (e) {
    return json({ error: 'Database error', detail: String(e) }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)ss_session=([^;]+)/);
  if (!match) return null;
  const secret = env.SESSION_SECRET;
  if (!secret) return null;
  const cookieValue = decodeURIComponent(match[1]);
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

// /functions/api/buzzes.js
// GET — returns all unseen buzzes for the current user.

export async function onRequest(context) {
  const { env, request } = context;
  const session = await getSession(request, env);
  if (!session || !session.userId) return json({ error: 'Not signed in' }, 401);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500);

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
    }, 200);
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

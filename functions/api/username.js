// /functions/api/username.js
// POST { username } — sets the username for the currently logged-in user.

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)ss_session=([^;]+)/);
  if (!match) return json({ error: 'Not signed in' }, 401);

  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) return json({ error: 'Server config error' }, 500);

  const cookieValue = decodeURIComponent(match[1]);
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return json({ error: 'Invalid session' }, 401);

  const [payloadB64, providedSig] = parts;
  let payloadStr;
  try { payloadStr = base64urlDecode(payloadB64); }
  catch (e) { return json({ error: 'Invalid session' }, 401); }

  const expectedSig = await hmacSign(payloadStr, sessionSecret);
  if (expectedSig !== providedSig) return json({ error: 'Invalid session' }, 401);

  let session;
  try { session = JSON.parse(payloadStr); }
  catch (e) { return json({ error: 'Invalid session' }, 401); }

  if (!session.userId) return json({ error: 'User not found' }, 400);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Invalid JSON' }, 400); }

  const username = (body.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return json({ error: 'Username must be 3-20 characters: letters, numbers, underscore.' }, 400);
  }

  if (!env.DB) return json({ error: 'Database unavailable' }, 500);

  try {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
      .bind(username, session.userId).first();
    if (existing) return json({ error: 'Username taken' }, 409);

    await env.DB.prepare('UPDATE users SET username = ? WHERE id = ?')
      .bind(username, session.userId).run();

    return json({ success: true, username: username }, 200);
  } catch (e) {
    return json({ error: 'Database error' }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64urlEncodeBytes(new Uint8Array(sig));
}

function base64urlEncodeBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
    }

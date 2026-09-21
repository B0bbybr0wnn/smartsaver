// /functions/auth/me.js
// Returns the current user's session info.
// Reads session from EITHER:
//   1. The X-SS-Session header (Android APK / Capacitor — no cookies)
//   2. The ss_session cookie (browser / PWA)

export async function onRequest(context) {
  const { env, request } = context;

  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    return json({ user: null, error: 'no_secret' }, 500);
  }

  // Try header first (Android), then fall back to cookie (web)
  let cookieValue = null;

  const headerSession = request.headers.get('X-SS-Session');
  if (headerSession) {
    cookieValue = headerSession;
  } else {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/(?:^|;\s*)ss_session=([^;]+)/);
    if (match) cookieValue = decodeURIComponent(match[1]);
  }

  if (!cookieValue) {
    return json({ user: null }, 200);
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 2) {
    return json({ user: null }, 200);
  }

  const [payloadB64, providedSig] = parts;
  let payloadStr;
  try {
    payloadStr = base64urlDecode(payloadB64);
  } catch (e) {
    return json({ user: null }, 200);
  }

  const expectedSig = await hmacSign(payloadStr, sessionSecret);
  if (expectedSig !== providedSig) {
    return json({ user: null }, 200);
  }

  let session;
  try {
    session = JSON.parse(payloadStr);
  } catch (e) {
    return json({ user: null }, 200);
  }

  const age = Date.now() - (session.iat || 0);
  if (age > 30 * 24 * 60 * 60 * 1000) {
    return json({ user: null }, 200);
  }

  let username = null;
  let usernameChangedAt = null;
  if (env.DB && session.userId) {
    try {
      const row = await env.DB.prepare('SELECT username, username_changed_at FROM users WHERE id = ?')
        .bind(session.userId).first();
      if (row) {
        username = row.username || null;
        usernameChangedAt = row.username_changed_at || null;
      }
    } catch (e) {}
  }

  return json({
    user: {
      sub: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
      userId: session.userId || null,
      username: username,
      usernameChangedAt: usernameChangedAt
    }
  }, 200);
}

// ============ helpers ============
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
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

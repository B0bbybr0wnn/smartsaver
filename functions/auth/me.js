// /functions/auth/me.js
// Returns the current user's session info.
// Reads session from EITHER:
//   1. The X-SS-Session header (Android APK — no cookies)
//   2. The ss_session cookie (browser / PWA)
// Also includes a debug log to compare header vs cookie sessions.

export async function onRequest(context) {
  const { env, request } = context;

  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    return json({ user: null, error: 'no_secret' }, 500);
  }

  const headerSession = request.headers.get('X-SS-Session');
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)ss_session=([^;]+)/);
  const cookieSession = match ? decodeURIComponent(match[1]) : null;

  console.log('DEBUG:', JSON.stringify({
    headerPresent: !!headerSession,
    headerLength: headerSession ? headerSession.length : null,
    cookiePresent: !!cookieSession,
    cookieLength: cookieSession ? cookieSession.length : null,
    identical: headerSession === cookieSession,
    headerStart: headerSession ? headerSession.substring(0, 20) : null,
    cookieStart: cookieSession ? cookieSession.substring(0, 20) : null
  }));

  let cookieValue = null;
  if (headerSession) {
    cookieValue = headerSession;
  } else if (cookieSession) {
    cookieValue = cookieSession;
  }

  if (!cookieValue) {
    return json({ user: null }, 200);
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 2) {
    return json({ user: null, debug: 'parts_count_wrong', count: parts.length }, 200);
  }

  const [payloadB64, providedSig] = parts;
  let payloadStr;
  try {
    payloadStr = base64urlDecode(payloadB64);
  } catch (e) {
    return json({ user: null, debug: 'base64_decode_failed' }, 200);
  }

  const expectedSig = await hmacSign(payloadStr, sessionSecret);
  if (expectedSig !== providedSig) {
    return json({
      user: null,
      debug: 'hmac_mismatch',
      expectedStart: expectedSig.substring(0, 12),
      providedStart: providedSig.substring(0, 12),
      expectedLen: expectedSig.length,
      providedLen: providedSig.length,
      payloadStart: payloadStr.substring(0, 30)
    }, 200);
  }

  let session;
  try {
    session = JSON.parse(payloadStr);
  } catch (e) {
    return json({ user: null, debug: 'json_parse_failed' }, 200);
  }

  const age = Date.now() - (session.iat || 0);
  if (age > 30 * 24 * 60 * 60 * 1000) {
    return json({ user: null, debug: 'session_expired' }, 200);
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

// /functions/auth/google/callback.js
// Handles the redirect back from Google. Exchanges code for tokens,
// verifies user info, saves the user to D1, then sets a signed session cookie.
// Supports two return paths:
//   - web: sets cookie + redirects to /?auth=success
//   - android: redirects to smartsaver://auth/callback?session=... (deep link)

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const rawState = url.searchParams.get('state') || 'web:';

  // Parse platform from state (format: "platform:nonce")
  const platform = rawState.split(':')[0] || 'web';

  if (error) {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=denied', 302)
      : Response.redirect(url.origin + '/?auth=denied', 302);
  }
  if (!code) {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=missing_code', 302)
      : Response.redirect(url.origin + '/?auth=error', 302);
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const sessionSecret = env.SESSION_SECRET;
  const db = env.DB;

  if (!clientId || !clientSecret || !sessionSecret) {
    return new Response('Server config error: missing OAuth secrets', { status: 500 });
  }

  const redirectUri = url.origin + '/auth/google/callback';

  // 1. Exchange code for tokens
  let tokenRes;
  try {
    tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
  } catch (e) {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=token_failed', 302)
      : Response.redirect(url.origin + '/?auth=error', 302);
  }

  if (!tokenRes.ok) {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=token_failed', 302)
      : Response.redirect(url.origin + '/?auth=error', 302);
  }

  const tokens = await tokenRes.json();
  const idToken = tokens.id_token;

  if (!idToken) {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=no_id_token', 302)
      : Response.redirect(url.origin + '/?auth=error', 302);
  }

  // 2. Verify & decode the ID token with Google
  let userInfo;
  try {
    const verifyRes = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + idToken);
    if (!verifyRes.ok) {
      return platform === 'android'
        ? Response.redirect('smartsaver://auth/callback?error=verify_failed', 302)
        : Response.redirect(url.origin + '/?auth=error', 302);
    }
    userInfo = await verifyRes.json();
  } catch (e) {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=verify_failed', 302)
      : Response.redirect(url.origin + '/?auth=error', 302);
  }

  if (userInfo.aud !== clientId && userInfo.aud !== '442317206640-sea65a3b1a11aa4lauqi9avqjoqa9nos.apps.googleusercontent.com') {
    return platform === 'android'
      ? Response.redirect('smartsaver://auth/callback?error=aud_mismatch', 302)
      : Response.redirect(url.origin + '/?auth=error', 302);
  }

  // 3. Save/update user in D1
  let userId = null;
  if (db) {
    try {
      const now = Date.now();
      const existing = await db.prepare(
        'SELECT id FROM users WHERE google_sub = ?'
      ).bind(userInfo.sub).first();

      if (existing) {
        userId = existing.id;
        await db.prepare(
          'UPDATE users SET email = ?, name = ?, picture = ?, last_login = ? WHERE id = ?'
        ).bind(userInfo.email || '', userInfo.name || '', userInfo.picture || '', now, userId).run();
      } else {
        const result = await db.prepare(
          'INSERT INTO users (google_sub, email, name, picture, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userInfo.sub, userInfo.email || '', userInfo.name || '', userInfo.picture || '', now, now).run();
        userId = result.meta.last_row_id;
      }
    } catch (e) {
      console.error('DB error:', e);
    }
  }

  // 4. Build session payload
  const session = {
    sub: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name || '',
    picture: userInfo.picture || '',
    userId: userId,
    iat: Date.now()
  };

  // 5. Sign it with HMAC-SHA256
  const payload = JSON.stringify(session);
  const signature = await hmacSign(payload, sessionSecret);
  const cookieValue = base64urlEncode(payload) + '.' + signature;

  // ============ ANDROID FLOW ============
  // Redirect to the custom deep link. The app receives this URL,
  // extracts the session, and stores it. No cookie needed.
  if (platform === 'android') {
  // Send the session AND a debug marker
  const debug = 'sid=' + session.userId + '&email=' + encodeURIComponent(session.email || '') + '&len=' + cookieValue.length;
  const deepLink = 'smartsaver://auth/callback?session=' + encodeURIComponent(cookieValue) + '&' + debug;
  return Response.redirect(deepLink, 302);
  }

  // ============ WEB FLOW ============
  // Set cookie as before.
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const secure = isLocalhost ? '' : 'Secure; ';

  const headers = new Headers();
  headers.append('Set-Cookie',
    'ss_session=' + cookieValue + '; ' +
    'Path=/; ' +
    'HttpOnly; ' +
    secure +
    'SameSite=Lax; ' +
    'Max-Age=' + (60 * 60 * 24 * 30)
  );
  headers.append('Location', url.origin + '/?auth=success');

  return new Response(null, { status: 302, headers });
}

// ============ helpers ============
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

function base64urlEncode(str) {
  return base64urlEncodeBytes(new TextEncoder().encode(str));
}

function base64urlEncodeBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

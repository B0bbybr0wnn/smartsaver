// /functions/auth/google.js
// Starts the Google OAuth flow — redirects user to Google's consent screen.
// Supports two platforms: web (browser) and android (TWA/Capacitor APK).

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response('Server config error: GOOGLE_CLIENT_ID missing', { status: 500 });
  }

  const platform = url.searchParams.get('platform') || 'web';
  const redirectUri = url.origin + '/auth/google/callback';

  // Encode platform + nonce in state so the callback knows where to redirect
  const nonce = crypto.randomUUID();
  const state = platform + ':' + nonce;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: state
  });

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();

  return Response.redirect(authUrl, 302);
    }

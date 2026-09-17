// /functions/auth/logout.js
// Clears the session cookie.

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const headers = new Headers();
  headers.append('Set-Cookie',
    'ss_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax'
  );
  headers.append('Location', url.origin + '/?auth=logout');

  return new Response(null, { status: 302, headers });
}

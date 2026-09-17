// /functions/api/data.js
// GET — returns the logged-in user's full data from the cloud.

export async function onRequest(context) {
  const { env, request } = context;
  const session = await getSession(request, env);
  if (!session) return json({ error: 'Not signed in' }, 401);
  if (!session.userId) return json({ error: 'User not found' }, 400);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500);

  try {
    const goalsRaw = await env.DB.prepare('SELECT name, target, saved, target_date, created_at FROM goals WHERE user_id = ? ORDER BY created_at ASC').bind(session.userId).all();
    const decisionsRaw = await env.DB.prepare('SELECT name, price, balance, income, expenses, verdict, result, created_at FROM decisions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(session.userId).all();
    const spendsRaw = await env.DB.prepare('SELECT amount, note, created_at FROM spends WHERE user_id = ? ORDER BY created_at DESC LIMIT 300').bind(session.userId).all();
    const contribsRaw = await env.DB.prepare('SELECT goal_name, amount, created_at FROM contributions WHERE user_id = ? ORDER BY created_at ASC LIMIT 500').bind(session.userId).all();

    const goals = (goalsRaw.results || []).map(g => ({
      name: g.name, target: g.target, saved: g.saved,
      targetDate: g.target_date || '', createdAt: g.created_at
    }));
    const decisions = (decisionsRaw.results || []).map(d => ({
      name: d.name, price: d.price, balance: d.balance, income: d.income, expenses: d.expenses,
      verdict: d.verdict, result: d.result,
      date: new Date(d.created_at).toLocaleDateString(), ts: d.created_at
    }));
    const spends = (spendsRaw.results || []).map(s => ({
      amount: s.amount, note: s.note, ts: s.created_at, dayKey: dayKeyFromTs(s.created_at)
    }));
    const contributions = (contribsRaw.results || []).map(c => ({
      goalName: c.goal_name, amount: c.amount, ts: c.created_at
    }));

    return json({ success: true, goals, decisions, spends, contributions }, 200);
  } catch (e) {
    return json({ error: 'Database error', detail: String(e) }, 500);
  }
}

function dayKeyFromTs(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
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

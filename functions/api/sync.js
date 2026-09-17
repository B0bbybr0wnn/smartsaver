// /functions/api/sync.js
// POST { goals, decisions, contributions, spends, templates, snapshot, currency, interests, streak }
// Overwrites the cloud copy of all user data with what the app sends.

export async function onRequest(context) {
  const { env, request } = context;
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const session = await getSession(request, env);
  if (!session) return json({ error: 'Not signed in' }, 401);
  if (!session.userId) return json({ error: 'User not found' }, 400);
  if (!env.DB) return json({ error: 'Database unavailable' }, 500);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Invalid JSON' }, 400); }

  const userId = session.userId;
  const now = Date.now();

  try {
    // Delete existing rows for this user, then insert fresh (simplest, avoids duplicate handling)
    await env.DB.prepare('DELETE FROM goals WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM decisions WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM spends WHERE user_id = ?').bind(userId).run();
    await env.DB.prepare('DELETE FROM contributions WHERE user_id = ?').bind(userId).run();

    const goals = body.goals || [];
    for (const g of goals) {
      await env.DB.prepare(
        'INSERT INTO goals (user_id, name, target, saved, target_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(userId, g.name || '', g.target || 0, g.saved || 0, g.targetDate || null, g.createdAt || now, now).run();
    }

    const decisions = (body.decisions || []).slice(0, 100);
    for (const d of decisions) {
      await env.DB.prepare(
        'INSERT INTO decisions (user_id, name, price, balance, income, expenses, verdict, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(userId, d.name || '', d.price || 0, d.balance || 0, d.income || 0, d.expenses || 0, d.verdict || '', d.result || '', d.ts || now).run();
    }

    const spends = (body.spends || []).slice(0, 300);
    for (const s of spends) {
      await env.DB.prepare(
        'INSERT INTO spends (user_id, amount, note, created_at) VALUES (?, ?, ?, ?)'
      ).bind(userId, s.amount || 0, s.note || '', s.ts || now).run();
    }

    const contributions = (body.contributions || []).slice(0, 500);
    for (const c of contributions) {
      await env.DB.prepare(
        'INSERT INTO contributions (user_id, goal_name, amount, created_at) VALUES (?, ?, ?, ?)'
      ).bind(userId, c.goalName || '', c.amount || 0, c.ts || now).run();
    }

    return json({
      success: true,
      counts: {
        goals: goals.length,
        decisions: decisions.length,
        spends: spends.length,
        contributions: contributions.length
      },
      syncedAt: now
    }, 200);
  } catch (e) {
    return json({ error: 'Database error', detail: String(e) }, 500);
  }
}

// ============ helpers ============
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

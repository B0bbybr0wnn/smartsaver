// ============ STATE ============
const state = {
  currency: localStorage.getItem('ss_currency') || 'USD',
  theme: localStorage.getItem('ss_theme') || 'dark',
  lang: localStorage.getItem('ss_lang') || 'en',
  interests: JSON.parse(localStorage.getItem('ss_interests') || '[]'),
  onboarded: localStorage.getItem('ss_onboarded') === 'true',
  snapshot: JSON.parse(localStorage.getItem('ss_snapshot') || 'null'),
  goals: JSON.parse(localStorage.getItem('ss_goals') || '[]'),
  decisions: JSON.parse(localStorage.getItem('ss_decisions') || '[]'),
  contributions: JSON.parse(localStorage.getItem('ss_contributions') || '[]'),
  spends: JSON.parse(localStorage.getItem('ss_spends') || '[]'),
  templates: JSON.parse(localStorage.getItem('ss_templates') || '[]'),
  streak: JSON.parse(localStorage.getItem('ss_streak') || '{"current":0,"longest":0,"lastDay":null,"history":[]}'),
  convertFrom: localStorage.getItem('ss_convertFrom') || 'USD',
  convertTo: localStorage.getItem('ss_convertTo') || 'EUR',
  currentTool: 'savings',
  user: null,
  authChecked: false,
  friends: [],
  incoming: [],
  outgoing: [],
  buzzes: [],
  notifSound: localStorage.getItem('ss_notifSound') !== 'false',
  lastSeenAt: parseInt(localStorage.getItem('ss_lastSeenAt') || '0')
};

const API = 'https://smartsaver.pages.dev';
// ============ ADMOB ============
let AdMob = null;
let BannerAdPosition = null;
let BannerAdSize = null;
async function initAds() {
  if (!isNative()) return;
  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    BannerAdPosition = mod.BannerAdPosition;
    BannerAdSize = mod.BannerAdSize;
    await AdMob.initialize({});
    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111',
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true
    });
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
 }

const CURRENCIES = [
  { code: 'USD' }, { code: 'EUR' }, { code: 'GBP' }, { code: 'JPY' }, { code: 'CNY' },
  { code: 'INR' }, { code: 'NGN' }, { code: 'CAD' }, { code: 'AUD' }, { code: 'AED' },
  { code: 'CHF' }, { code: 'SEK' }, { code: 'ZAR' }, { code: 'KES' }, { code: 'GHS' },
  { code: 'BRL' }, { code: 'MXN' }, { code: 'PHP' }, { code: 'SGD' }, { code: 'NOK' },
  { code: 'DKK' }, { code: 'PLN' }, { code: 'TRY' }, { code: 'EGP' }, { code: 'KRW' }
];

const SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹', NGN: '₦',
  CAD: 'C$', AUD: 'A$', AED: 'د.إ', CHF: 'Fr', SEK: 'kr', ZAR: 'R', KES: 'KSh',
  GHS: 'GH₵', BRL: 'R$', MXN: 'MX$', PHP: '₱', SGD: 'S$', NOK: 'kr', DKK: 'kr',
  PLN: 'zł', TRY: '₺', EGP: 'E£', KRW: '₩'
};

const INTERESTS = [
  'Saving money', 'Managing my budget', 'Making better spending decisions',
  'Paying off debt', 'Building an emergency fund', 'Tracking my financial goals'
];

const LANGUAGES = ['en', 'de', 'es'];
const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

let ratesCache = null;
let ratesCacheTime = 0;

function getSymbol() { return SYMBOLS[state.currency] || state.currency; }
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return getSymbol() + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function saveGoals() { localStorage.setItem('ss_goals', JSON.stringify(state.goals)); }
function saveDecisions() { localStorage.setItem('ss_decisions', JSON.stringify(state.decisions)); }
function saveContributions() { localStorage.setItem('ss_contributions', JSON.stringify(state.contributions)); }
function saveSpends() { localStorage.setItem('ss_spends', JSON.stringify(state.spends)); }
function saveTemplates() { localStorage.setItem('ss_templates', JSON.stringify(state.templates)); }
function saveStreak() { localStorage.setItem('ss_streak', JSON.stringify(state.streak)); }

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// ============ STREAK ============
function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function recordActivity() {
  const today = todayKey();
  if (state.streak.lastDay === today) return;
  if (state.streak.lastDay === yesterdayKey()) state.streak.current += 1;
  else state.streak.current = 1;
  state.streak.lastDay = today;
  if (state.streak.current > state.streak.longest) state.streak.longest = state.streak.current;
  if (!state.streak.history) state.streak.history = [];
  if (!state.streak.history.includes(today)) state.streak.history.push(today);
  if (state.streak.history.length > 400) state.streak.history = state.streak.history.slice(-400);
  saveStreak();
}
function currentStreak() {
  const today = todayKey();
  const yest = yesterdayKey();
  if (state.streak.lastDay === today || state.streak.lastDay === yest) return state.streak.current;
  return 0;
}

// ============ TOAST ============
function showToast(msg) {
  let t = document.getElementById('ss-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'ss-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ============ ICONS ============
function icon(name, size) {
  size = size || 20;
  const icons = {
    spark: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
  };
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
}

// ============ THEME ============
function applyTheme() {
  if (state.theme === 'light') document.body.classList.add('light');
  else document.body.classList.remove('light');
}
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('ss_theme', state.theme);
  applyTheme();
}

// ============ LANGUAGE ============
function toggleLanguage() {
  const i = LANGUAGES.indexOf(state.lang);
  state.lang = LANGUAGES[(i + 1) % LANGUAGES.length];
  localStorage.setItem('ss_lang', state.lang);
  applyTranslations();
  refreshHome();
  renderGoals();
  renderTemplates();
  renderTips();
  const toolDisplay = document.getElementById('tool-display');
  if (toolDisplay) toolDisplay.textContent = t('tool_' + state.currentTool);
  buildInterestGrid();
  buildInterestModal();
}

// ============ AUTH ============
function isNative() {
  return typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
}

function getSessionHeader() {
  const stored = localStorage.getItem('ss_session_cookie');
  if (!stored) return {};
  return { 'X-SS-Session': stored };
}

async function checkAuth() {
  try {
    const headers = getSessionHeader();
    const res = await fetch(API + '/auth/me', { credentials: 'include', headers });
    const data = await res.json();
    state.user = data.user || null;
  } catch (e) { state.user = null; }
  state.authChecked = true;
  renderAuthUI();
  if (state.user) {
    setTimeout(() => cloudPullThenMaybePush(), 300);
    setTimeout(() => fetchBuzzes(), 500);
    setTimeout(() => refreshFriends(), 600);
  }
  renderNotifBell();
  setTimeout(renderNotifBell, 800);
  }
function renderAuthUI() {
  const authCard = document.getElementById('auth-card');
  if (!authCard) return;
  if (state.user) {
    authCard.innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;">' +
        (state.user.picture
          ? '<img src="' + state.user.picture + '" style="width:52px;height:52px;border-radius:50%;border:1px solid var(--border);" onerror="this.style.display=\'none\'" />'
          : '<div style="width:52px;height:52px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--accent);">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>') +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:15px;font-weight:700;letter-spacing:-0.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (state.user.name || state.user.email || 'Signed in') + '</div>' +
          '<div style="font-size:12px;color:var(--text-mute);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (state.user.email || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn secondary" style="margin-top:14px;color:var(--bad);" onclick="signOut()">' + (state.lang === 'de' ? 'Abmelden' : state.lang === 'es' ? 'Cerrar sesión' : 'Sign out') + '</button>';
  } else {
    authCard.innerHTML =
      '<div style="text-align:center;padding:8px 0;">' +
        '<div style="font-size:15px;font-weight:700;letter-spacing:-0.02em;margin-bottom:6px;">' + (state.lang === 'de' ? 'Anmelden zum Synchronisieren' : state.lang === 'es' ? 'Inicia sesión para sincronizar' : 'Sign in to sync') + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-mute);line-height:1.5;margin-bottom:14px;">' + (state.lang === 'de' ? 'Deine Daten bleiben auf diesem Gerät.' : state.lang === 'es' ? 'Tus datos permanecen en este dispositivo.' : 'Your data stays on this device.') + '</div>' +
      '</div>' +
      '<button class="btn" style="background:#fff;color:#1f1f1f;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);" onclick="signIn()">' +
        '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>' +
        'Sign in with Google' +
      '</button>';
  }
  const fRow = document.getElementById('friends-row');
  if (fRow) fRow.style.display = (state.user && state.user.username) ? 'flex' : 'none';
  const syncCard = document.getElementById('sync-card');
  if (syncCard) syncCard.style.display = state.user ? 'block' : 'none';
  refreshSettingsUI();
  }

async function signIn() {
  if (isNative()) {
    try {
      const Browser = window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
      if (Browser) {
        await Browser.open({
          url: API + '/auth/google?platform=android',
          presentationStyle: 'popover'
        });
        return;
      }
    } catch (e) {
      console.warn('Native sign-in failed, falling back:', e);
    }
  }
  window.location.href = API + '/auth/google';
}

async function signOut() {
  if (isNative()) {
    try {
      const Browser = window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
      if (Browser) {
        await Browser.open({ url: API + '/auth/logout' });
      }
    } catch (e) {}
    localStorage.removeItem('ss_session_cookie');
    state.user = null;
    renderAuthUI();
    showToast(state.lang === 'de' ? 'Abgemeldet' : state.lang === 'es' ? 'Sesión cerrada' : 'Signed out');
    return;
  }
  window.location.href = API + '/auth/logout';
}

function handleAuthQuery() {
  const url = new URL(window.location.href);
  const auth = url.searchParams.get('auth');
  if (auth) {
    if (auth === 'success') showToast(state.lang === 'de' ? 'Angemeldet' : state.lang === 'es' ? 'Sesión iniciada' : 'Signed in');
    else if (auth === 'denied') showToast(state.lang === 'de' ? 'Abgelehnt' : state.lang === 'es' ? 'Denegado' : 'Denied');
    else if (auth === 'logout') showToast(state.lang === 'de' ? 'Abgemeldet' : state.lang === 'es' ? 'Sesión cerrada' : 'Signed out');
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.pathname + (url.search ? '?' + url.searchParams.toString() : ''));
  }
}

// ============ NATIVE DEEP LINK HANDLER ============
function initDeepLinkHandler() {
  if (!isNative()) return;
  try {
    const AppPlugin = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!AppPlugin) return;

    AppPlugin.addListener('appUrlOpen', async (data) => {
      try {
        const url = new URL(data.url);
        if (url.protocol !== 'smartsaver:') return;
        if (url.host !== 'auth') return;

        const session = url.searchParams.get('session');
        const error = url.searchParams.get('error');

        if (error) {
          showToast(state.lang === 'de' ? 'Anmeldung fehlgeschlagen' : state.lang === 'es' ? 'Error de inicio' : 'Sign in failed');
          return;
        }
        if (!session) return;

        localStorage.setItem('ss_session_cookie', session);
        showToast(state.lang === 'de' ? 'Angemeldet' : state.lang === 'es' ? 'Sesión iniciada' : 'Signed in');
        await checkAuth();
        if (typeof cloudPullThenMaybePush === 'function') {
          setTimeout(() => cloudPullThenMaybePush(), 300);
        }
      } catch (e) {
        console.warn('Deep link parse error:', e);
      }
    });

    AppPlugin.getLaunchUrl().then((launch) => {
      if (launch && launch.url && launch.url.indexOf('smartsaver://') === 0) {
        try {
          const u = new URL(launch.url);
          const s = u.searchParams.get('session');
          if (s) {
            localStorage.setItem('ss_session_cookie', s);
            setTimeout(() => checkAuth(), 500);
          }
        } catch (e) {}
      }
    }).catch(() => {});
  } catch (e) {
    console.warn('Deep link init error:', e);
  }
 }
// ============ SETTINGS ============
function refreshSettingsUI() {
  const tgl = document.getElementById('settings-theme-toggle');
  if (tgl) tgl.classList.toggle('on', state.theme === 'light');
  const langVal = document.getElementById('settings-lang-val');
  if (langVal) langVal.textContent = state.lang.toUpperCase();
  const soundTgl = document.getElementById('settings-sound-toggle');
  if (soundTgl) soundTgl.classList.toggle('on', state.notifSound);
  const currVal = document.getElementById('settings-currency-val');
  if (currVal) currVal.textContent = state.currency;
  const intVal = document.getElementById('settings-interest-val');
  if (intVal) intVal.textContent = state.interests.length + (state.lang === 'de' ? ' gewählt' : state.lang === 'es' ? ' elegidos' : ' selected');
  const uCard = document.getElementById('settings-username-card');
  const uVal = document.getElementById('settings-username-val');
  if (uCard && uVal) {
    if (state.user && state.user.username) {
      uCard.style.display = 'block';
      uVal.textContent = '@' + state.user.username;
    } else {
      uCard.style.display = 'none';
    }
  }
}
function toggleNotifSound() {
  state.notifSound = !state.notifSound;
  localStorage.setItem('ss_notifSound', state.notifSound ? 'true' : 'false');
  refreshSettingsUI();
  showToast(state.notifSound ? (state.lang === 'de' ? 'Ton an' : state.lang === 'es' ? 'Sonido on' : 'Sound on') : (state.lang === 'de' ? 'Ton aus' : state.lang === 'es' ? 'Sonido off' : 'Sound off'));
}

// ============ USERNAME ============
function renderUsernameScreen() {
  if (!state.user) {
    closeSubScreen('sub-username');
    showToast(state.lang === 'de' ? 'Anmeldung erforderlich' : state.lang === 'es' ? 'Inicia sesión primero' : 'Sign in required');
    return;
  }
  const input = document.getElementById('username-input');
  const status = document.getElementById('username-status');
  const cooldownEl = document.getElementById('username-cooldown');
  const saveBtn = document.getElementById('username-save-btn');

  if (input) input.value = state.user.username || '';
  if (status) {
    if (state.user.username) status.innerHTML = '<span style="color:var(--good);">✓ @' + state.user.username + '</span>';
    else status.textContent = '';
  }

  const lastChanged = state.user.usernameChangedAt || 0;
  const nextAllowed = lastChanged + USERNAME_COOLDOWN_MS;
  const now = Date.now();
  const onCooldown = state.user.username && now < nextAllowed;

  if (cooldownEl) {
    if (onCooldown) {
      const dateStr = new Date(nextAllowed).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      cooldownEl.style.display = 'block';
      cooldownEl.innerHTML = '<div class="cooldown-box">⏳ ' + t('username_cooldown') + ' <b>' + t('username_next_change') + ' ' + dateStr + '</b>.</div>';
    } else {
      cooldownEl.style.display = 'none';
    }
  }
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
  }
}

async function saveUsername() {
  if (!state.user) return;
  const input = document.getElementById('username-input');
  const status = document.getElementById('username-status');
  const raw = (input.value || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(raw)) {
    status.innerHTML = '<span style="color:var(--bad);">' + (state.lang === 'de' ? '3-20 Zeichen: Buchstaben, Zahlen, Unterstrich.' : state.lang === 'es' ? '3-20 caracteres: letras, números, guion bajo.' : '3-20 characters: letters, numbers, underscore.') + '</span>';
    return;
  }
  status.innerHTML = '<span style="color:var(--text-mute);">' + (state.lang === 'de' ? 'Speichern...' : state.lang === 'es' ? 'Guardando...' : 'Saving...') + '</span>';
  try {
    const res = await fetch(API + '/api/username', {
      method: 'POST',
      credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify({ username: raw })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      state.user.username = data.username;
      if (data.changedAt) state.user.usernameChangedAt = data.changedAt;
      status.innerHTML = '<span style="color:var(--good);">✓ @' + data.username + '</span>';
      showToast(t('username_saved'));
      renderAuthUI();
      renderUsernameScreen();
    } else if (res.status === 429) {
      status.innerHTML = '<span style="color:var(--warn);">' + (data.message || t('username_cooldown')) + '</span>';
      renderUsernameScreen();
    } else {
      let msg = data.error || 'Error';
      if (res.status === 409) msg = t('username_taken');
      status.innerHTML = '<span style="color:var(--bad);">' + msg + '</span>';
    }
  } catch (e) {
    status.innerHTML = '<span style="color:var(--bad);">' + (state.lang === 'de' ? 'Verbindungsfehler' : state.lang === 'es' ? 'Error de conexión' : 'Connection error') + '</span>';
  }
 }

// ============ FRIENDS ============
async function openFriendsScreen() {
  if (!state.user) {
    showToast(state.lang === 'de' ? 'Anmeldung erforderlich' : state.lang === 'es' ? 'Inicia sesión primero' : 'Sign in required');
    return;
  }
  const myU = document.getElementById('friends-my-username');
  if (myU) myU.textContent = state.user.username ? '@' + state.user.username : (state.lang === 'de' ? 'Nicht festgelegt' : state.lang === 'es' ? 'No establecido' : 'Not set');
  await refreshFriends();
}
function copyUsername() {
  if (!state.user || !state.user.username) return;
  const txt = '@' + state.user.username;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(() => showToast('Copied ' + txt)).catch(() => {});
  }
}
async function refreshFriends() {
  try {
    const res = await fetch(API + '/api/friends/list', { credentials: 'include', headers: getSessionHeader() });
    if (!res.ok) return;
    const data = await res.json();
    state.friends = data.friends || [];
    state.incoming = data.incoming || [];
    state.outgoing = data.outgoing || [];
    renderFriends();
    renderNotifBell();
  } catch (e) {}
}
function renderFriends() {
  const reqCard = document.getElementById('friend-requests-card');
  const reqList = document.getElementById('friend-requests-list');
  const friendsList = document.getElementById('friends-list');
  if (reqList) {
    if (state.incoming.length === 0 && state.outgoing.length === 0) {
      reqCard.style.display = 'none';
    } else {
      reqCard.style.display = 'block';
      let html = '';
      state.incoming.forEach(r => {
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-soft);">' +
          (r.picture ? '<img src="' + r.picture + '" style="width:38px;height:38px;border-radius:50%;" />' : '<div style="width:38px;height:38px;border-radius:50%;background:var(--surface-2);"></div>') +
          '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.name || r.username) + '</div><div style="font-size:12px;color:var(--text-mute);">@' + r.username + '</div></div>' +
          '<button onclick="acceptFriend(' + r.request_id + ')" style="padding:8px 12px;font-size:12px;font-weight:600;border-radius:8px;border:none;background:var(--accent);color:#0a0e1a;font-family:inherit;cursor:pointer;">' + (state.lang === 'de' ? 'Annehmen' : state.lang === 'es' ? 'Aceptar' : 'Accept') + '</button>' +
          '<button onclick="declineFriend(' + r.request_id + ')" style="padding:8px 12px;font-size:12px;font-weight:600;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text-mute);font-family:inherit;cursor:pointer;">✕</button>' +
        '</div>';
      });
      state.outgoing.forEach(r => {
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-soft);opacity:0.7;">' +
          (r.picture ? '<img src="' + r.picture + '" style="width:38px;height:38px;border-radius:50%;" />' : '<div style="width:38px;height:38px;border-radius:50%;background:var(--surface-2);"></div>') +
          '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;">' + (r.name || r.username) + '</div><div style="font-size:12px;color:var(--text-mute);">@' + r.username + ' · ' + (state.lang === 'de' ? 'Gesendet' : state.lang === 'es' ? 'Enviado' : 'Sent') + '</div></div>' +
        '</div>';
      });
      reqList.innerHTML = html;
    }
  }
  if (friendsList) {
    if (state.friends.length === 0) {
      friendsList.innerHTML = '<div class="empty" style="padding:18px 8px;font-size:13px;">' + (state.lang === 'de' ? 'Noch keine Freunde. Lade jemanden ein!' : state.lang === 'es' ? 'Aún no hay amigos. ¡Invita a alguien!' : 'No friends yet. Invite someone!') + '</div>';
    } else {
      friendsList.innerHTML = state.friends.map(f =>
        '<div onclick="openFriendProfile(' + f.id + ')" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-soft);cursor:pointer;">' +
          (f.picture ? '<img src="' + f.picture + '" style="width:42px;height:42px;border-radius:50%;" />' : '<div style="width:42px;height:42px;border-radius:50%;background:var(--surface-2);"></div>') +
          '<div style="flex:1;min-width:0;"><div style="font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (f.name || f.username) + '</div><div style="font-size:12px;color:var(--text-mute);">@' + f.username + '</div></div>' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</div>'
      ).join('');
    }
  }
}
async function sendFriendRequest() {
  const input = document.getElementById('add-friend-input');
  const raw = (input.value || '').trim().replace(/^@/, '').toLowerCase();
  if (!raw) { showToast(state.lang === 'de' ? 'Benutzername eingeben' : state.lang === 'es' ? 'Introduce usuario' : 'Enter username'); return; }
  try {
    const res = await fetch(API + '/api/friends/request', {
      method: 'POST', credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify({ username: raw })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      input.value = '';
      showToast(state.lang === 'de' ? 'Anfrage gesendet' : state.lang === 'es' ? 'Solicitud enviada' : 'Request sent');
      refreshFriends();
    } else {
      showToast(data.error || 'Error');
    }
  } catch (e) { showToast('Error'); }
}
async function acceptFriend(requestId) {
  try {
    const res = await fetch(API + '/api/friends/accept', {
      method: 'POST', credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify({ requestId })
    });
    if (res.ok) { showToast(state.lang === 'de' ? 'Bestätigt' : state.lang === 'es' ? 'Aceptado' : 'Accepted'); refreshFriends(); }
  } catch (e) {}
}
async function declineFriend(requestId) {
  try {
    const res = await fetch(API + '/api/friends/decline', {
      method: 'POST', credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify({ requestId })
    });
    if (res.ok) { showToast(state.lang === 'de' ? 'Abgelehnt' : state.lang === 'es' ? 'Rechazado' : 'Declined'); refreshFriends(); }
  } catch (e) {}
}
async function openFriendProfile(friendId) {
  const title = document.getElementById('friend-profile-title');
  const content = document.getElementById('friend-profile-content');
  if (title) title.textContent = '...';
  if (content) content.innerHTML = '<div class="empty">Loading...</div>';
  openSubScreen('sub-friend-profile');
  try {
    const res = await fetch(API + '/api/friends/data?friendId=' + friendId, { credentials: 'include', headers: getSessionHeader() });
    const data = await res.json();
    if (!res.ok) { content.innerHTML = '<div class="empty">' + (data.error || 'Error') + '</div>'; return; }
    if (title) title.textContent = data.friend.name || data.friend.username;
    const goals = data.goals || [];
    const header =
      '<div class="card" style="padding:16px;">' +
        '<div style="display:flex;align-items:center;gap:14px;">' +
          (data.friend.picture ? '<img src="' + data.friend.picture + '" style="width:52px;height:52px;border-radius:50%;" />' : '<div style="width:52px;height:52px;border-radius:50%;background:var(--surface-2);"></div>') +
          '<div style="flex:1;min-width:0;"><div style="font-size:16px;font-weight:700;">' + (data.friend.name || data.friend.username) + '</div><div style="font-size:12px;color:var(--text-mute);margin-top:3px;">@' + data.friend.username + '</div></div>' +
        '</div>' +
        '<button class="btn" style="margin-top:14px;" onclick="buzzFriend(' + friendId + ')">' + (state.lang === 'de' ? 'Anstupsen 👋' : state.lang === 'es' ? 'Dar un toque 👋' : 'Buzz 👋') + '</button>' +
      '</div>';
    let goalsHtml = '';
    if (goals.length === 0) {
      goalsHtml = '<div class="card"><div class="empty" style="padding:20px 8px;font-size:13px;">' + (state.lang === 'de' ? 'Noch keine Ziele.' : state.lang === 'es' ? 'Aún no hay metas.' : 'No goals yet.') + '</div></div>';
    } else {
      goalsHtml = '<div class="card"><div class="card-title">' + (state.lang === 'de' ? 'Ziele' : state.lang === 'es' ? 'Metas' : 'Goals') + '</div>' +
        goals.map(g =>
          '<div style="margin-bottom:14px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:14px;font-weight:600;">' + g.name + '</span><span style="font-size:13px;color:var(--text-dim);font-variant-numeric:tabular-nums;">' + g.progress + '%</span></div>' +
            '<div class="progress"><div class="progress-fill" style="width:' + g.progress + '%;"></div></div>' +
            (g.targetDate ? '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">' + g.targetDate + '</div>' : '') +
          '</div>'
        ).join('') + '</div>';
    }
    const removeBtn = '<button class="btn danger" style="color:var(--bad);" onclick="confirmRemoveFriend(' + friendId + ')">' + (state.lang === 'de' ? 'Freund entfernen' : state.lang === 'es' ? 'Eliminar amigo' : 'Remove friend') + '</button>';
    content.innerHTML = header + goalsHtml + removeBtn;
  } catch (e) { content.innerHTML = '<div class="empty">Error</div>'; }
}
async function buzzFriend(friendId) {
  try {
    const res = await fetch(API + '/api/buzz', {
      method: 'POST', credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify({ action: 'send', friendId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(state.lang === 'de' ? 'Ange stupst 👋' : state.lang === 'es' ? 'Toque enviado 👋' : 'Buzzed 👋');
    } else {
      showToast(data.error || 'Error');
    }
  } catch (e) { showToast('Error'); }
}
function confirmRemoveFriend(friendId) {
  if (!confirm(state.lang === 'de' ? 'Freund entfernen?' : state.lang === 'es' ? '¿Eliminar amigo?' : 'Remove this friend?')) return;
  fetch(API + '/api/friends/remove', {
    method: 'POST', credentials: 'include',
    headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
    body: JSON.stringify({ friendId })
  }).then(res => {
    if (res.ok) {
      showToast(state.lang === 'de' ? 'Entfernt' : state.lang === 'es' ? 'Eliminado' : 'Removed');
      closeSubScreen('sub-friend-profile');
      refreshFriends();
    }
  });
 }
// ============ BUZZES ============
async function fetchBuzzes() {
  if (!state.user) return;
  try {
    const res = await fetch(API + '/api/buzzes', { credentials: 'include', headers: getSessionHeader() });
    if (!res.ok) return;
    const data = await res.json();
    state.buzzes = data.buzzes || [];
    renderBuzzCard();
    renderNotifBell();
  } catch (e) {}
}
function renderBuzzCard() {
  const card = document.getElementById('buzz-card');
  if (!card) return;
  if (state.buzzes.length === 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const names = state.buzzes.slice(0, 3).map(b => '@' + b.fromUsername);
  let txt;
  if (state.buzzes.length === 1) txt = names[0] + ' ' + (state.lang === 'de' ? 'hat dich angestupst 👋' : state.lang === 'es' ? 'te dio un toque 👋' : 'buzzed you 👋');
  else txt = names.join(', ') + ' ' + (state.lang === 'de' ? 'haben dich angestupst 👋' : state.lang === 'es' ? 'te dieron un toque 👋' : 'buzzed you 👋');
  card.innerHTML =
    '<div class="card" style="padding:14px 18px;border-left:3px solid var(--accent);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div style="font-size:13.5px;font-weight:500;line-height:1.5;">' + txt + '</div>' +
        '<button style="background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:20px;line-height:1;padding:0 4px;" onclick="dismissBuzzes()">✕</button>' +
      '</div>' +
    '</div>';
}
async function dismissBuzzes() {
  try {
    await fetch(API + '/api/buzz', {
      method: 'POST', credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify({ action: 'seen' })
    });
  } catch (e) {}
  state.buzzes = [];
  renderBuzzCard();
  renderNotifBell();
}

// ============ NOTIFICATIONS ============
function renderNotifBell() {
  const btn = document.getElementById('notif-btn');
  const badge = document.getElementById('notif-badge');
  if (!btn || !badge) return;
  if (!state.user) { btn.style.display = 'none'; return; }
  btn.style.display = 'flex';
  const total = (state.incoming ? state.incoming.length : 0) + (state.buzzes ? state.buzzes.length : 0);
  if (total > 0) {
    badge.style.display = 'flex';
    badge.textContent = total > 9 ? '9+' : total;
  } else {
    badge.style.display = 'none';
  }
}
function renderNotifications() {
  const el = document.getElementById('notifications-list');
  if (!el) return;
  const items = [];
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  (state.incoming || []).forEach(r => {
    const ts = r.created_at || Date.now();
    if (ts < cutoff) return;
    items.push({
      ts,
      html: '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-soft);">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;">' + (r.name || r.username) + '</div><div style="font-size:12px;color:var(--text-mute);margin-top:2px;">' + (state.lang === 'de' ? 'hat dir eine Freundschaftsanfrage gesendet' : state.lang === 'es' ? 'te envió una solicitud de amistad' : 'sent you a friend request') + '</div></div>' +
        '<button onclick="acceptFriend(' + r.request_id + '); setTimeout(renderNotifications,400);" style="padding:8px 12px;font-size:12px;font-weight:600;border-radius:8px;border:none;background:var(--accent);color:#0a0e1a;font-family:inherit;cursor:pointer;">' + (state.lang === 'de' ? 'Annehmen' : state.lang === 'es' ? 'Aceptar' : 'Accept') + '</button>' +
      '</div>'
    });
  });
  (state.buzzes || []).forEach(b => {
    const ts = b.createdAt || Date.now();
    if (ts < cutoff) return;
    items.push({
      ts,
      html: '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-soft);">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;color:#f59e0b;flex-shrink:0;font-size:18px;">👋</div>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;">@' + b.fromUsername + '</div><div style="font-size:12px;color:var(--text-mute);margin-top:2px;">' + (state.lang === 'de' ? 'hat dich angestupst' : state.lang === 'es' ? 'te dio un toque' : 'buzzed you') + ' · ' + timeAgo(ts) + '</div></div>' +
      '</div>'
    });
  });
  if (items.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>' + (state.lang === 'de' ? 'Keine neuen Benachrichtigungen' : state.lang === 'es' ? 'No hay notificaciones nuevas' : 'No new notifications') + '</div>';
    return;
  }
  items.sort((a, b) => b.ts - a.ts);
  el.innerHTML = '<div class="card">' + items.map(i => i.html).join('') + '</div>';
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return state.lang === 'de' ? 'gerade eben' : state.lang === 'es' ? 'ahora' : 'just now';
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.floor(hrs / 24);
  return days + 'd';
}
function playNotifSound() {
  if (!state.notifSound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

// ============ STREAK HISTORY ============
function openStreakHistory() {
  openSubScreen('sub-streak');
  renderStreakHistory();
}
function renderStreakHistory() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const title = document.getElementById('streak-month-title');
  if (title) title.textContent = monthNames[month] + ' ' + year;
  const history = state.streak.history || [];
  const todayK = todayKey();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let html = '<div class="streak-weekday">S</div><div class="streak-weekday">M</div><div class="streak-weekday">T</div><div class="streak-weekday">W</div><div class="streak-weekday">T</div><div class="streak-weekday">F</div><div class="streak-weekday">S</div>';
  for (let i = 0; i < firstDay; i++) html += '<div class="streak-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const key = year + '-' + (month + 1) + '-' + d;
    const hit = history.includes(key);
    const isToday = key === todayK;
    html += '<div class="streak-day' + (hit ? ' hit' : '') + (isToday ? ' today' : '') + '">' + d + '</div>';
  }
  const cal = document.getElementById('streak-calendar');
  if (cal) cal.innerHTML = html;
  const big = document.getElementById('streak-count-big');
  if (big) big.textContent = currentStreak();
  const longest = document.getElementById('streak-longest');
  if (longest) longest.textContent = state.streak.longest || 0;
}

// ============ STREAK NUDGE ============
function renderStreakNudge() {
  const el = document.getElementById('streak-nudge');
  if (!el) return;
  const now = Date.now();
  const lastSeen = state.lastSeenAt || 0;
  const gapDays = lastSeen ? Math.floor((now - lastSeen) / (24 * 60 * 60 * 1000)) : 0;
  const cur = currentStreak();
  if (gapDays >= 2 && gapDays < 30) {
    el.style.display = 'block';
    if (cur === 0 && state.streak.longest > 0) {
      el.innerHTML =
        '<div class="streak-nudge">' +
          '<div class="sn-icon">💔</div>' +
          '<div style="flex:1;"><div class="sn-title">' + t('streak_lost_title') + '</div>' +
          '<div class="sn-sub">' + t('streak_lost_sub') + ' — ' + (state.lang === 'de' ? 'du warst ' : state.lang === 'es' ? 'estuviste ' : 'you were away ') + gapDays + ' ' + t('streak_days') + '.</div></div>' +
        '</div>';
    } else if (cur > 0) {
      el.innerHTML =
        '<div class="streak-nudge">' +
          '<div class="sn-icon">🔥</div>' +
          '<div style="flex:1;"><div class="sn-title">' + t('streak_at_risk') + '</div>' +
          '<div class="sn-sub">' + (state.lang === 'de' ? 'Du hast eine ' + cur + '-Tage-Serie. Nutze die App heute weiter.' : state.lang === 'es' ? 'Tienes una racha de ' + cur + ' días. Sigue hoy.' : 'You have a ' + cur + '-day streak. Keep it going today.') + '</div></div>' +
        '</div>';
    } else {
      el.style.display = 'none';
    }
  } else {
    el.style.display = 'none';
  }
}

// ============ CLOUD SYNC ============
let syncInProgress = false;
function setSyncStatus(text, color) {
  const st = document.getElementById('sync-status');
  if (st) { st.textContent = text; st.style.color = color || 'var(--text-mute)'; }
}
async function cloudPullThenMaybePush() {
  if (!state.user || syncInProgress) return;
  syncInProgress = true;
  setSyncStatus(t('sync_checking'), 'var(--text-mute)');
  try {
    const res = await fetch(API + '/api/data', { credentials: 'include', headers: getSessionHeader() });
    if (!res.ok) throw new Error('pull failed');
    const data = await res.json();
    const cloudEmpty = (data.goals || []).length === 0 && (data.decisions || []).length === 0 && (data.spends || []).length === 0 && (data.contributions || []).length === 0;
    if (cloudEmpty && (state.goals.length > 0 || state.decisions.length > 0 || state.spends.length > 0)) {
      await pushToCloud();
    } else if (!cloudEmpty) {
      state.goals = data.goals || [];
      state.decisions = data.decisions || [];
      state.spends = data.spends || [];
      state.contributions = data.contributions || [];
      saveGoals(); saveDecisions(); saveSpends(); saveContributions();
      refreshHome();
      renderGoals();
      renderHistory();
      setSyncStatus(t('sync_done') + ' · ' + new Date().toLocaleTimeString(), 'var(--good)');
      localStorage.setItem('ss_lastSync', Date.now().toString());
    } else {
      setSyncStatus(t('sync_nothing'), 'var(--text-mute)');
    }
  } catch (e) {
    setSyncStatus(t('sync_error'), 'var(--bad)');
  } finally {
    syncInProgress = false;
  }
}
async function pushToCloud() {
  if (!state.user || syncInProgress) return false;
  syncInProgress = true;
  setSyncStatus(t('sync_uploading'), 'var(--text-mute)');
  try {
    const payload = {
      goals: state.goals, decisions: state.decisions, contributions: state.contributions,
      spends: state.spends, snapshot: state.snapshot, currency: state.currency,
      interests: state.interests, streak: state.streak
    };
    const res = await fetch(API + '/api/sync', {
      method: 'POST', credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getSessionHeader()),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('push failed');
    localStorage.setItem('ss_lastSync', Date.now().toString());
    setSyncStatus(t('sync_done') + ' · ' + new Date().toLocaleTimeString(), 'var(--good)');
    return true;
  } catch (e) {
    setSyncStatus(t('sync_error'), 'var(--bad)');
    return false;
  } finally {
    syncInProgress = false;
  }
}
function manualSync() {
  if (!state.user) {
    showToast(state.lang === 'de' ? 'Anmeldung erforderlich' : state.lang === 'es' ? 'Inicia sesión primero' : 'Sign in required');
    return;
  }
  const btn = document.getElementById('sync-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  pushToCloud().then(() => setTimeout(() => { if (btn) { btn.disabled = false; btn.style.opacity = '1'; } }, 400));
}
let autoPushTimer = null;
function scheduleAutoPush() {
  if (!state.user) return;
  clearTimeout(autoPushTimer);
  autoPushTimer = setTimeout(() => { pushToCloud(); }, 3000);
}

// ============ ONBOARDING ============
let tourIndex = 0;
const TOUR_TOTAL = 5;
function buildCurrencyGrid() {
  const grid = document.getElementById('currency-grid');
  if (!grid) return;
  grid.innerHTML = '';
  CURRENCIES.forEach(c => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (c.code === state.currency ? ' selected' : '');
    chip.textContent = c.code;
    chip.onclick = () => {
      state.currency = c.code;
      document.querySelectorAll('#currency-grid .chip').forEach(x => x.classList.remove('selected'));
      chip.classList.add('selected');
      document.getElementById('currency-next').disabled = false;
    };
    grid.appendChild(chip);
  });
  document.getElementById('currency-next').disabled = false;
}
function buildInterestGrid() {
  const grid = document.getElementById('interest-grid');
  if (!grid) return;
  grid.innerHTML = '';
  INTERESTS.forEach(i => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (state.interests.includes(i) ? ' selected' : '');
    chip.textContent = ti(i);
    chip.onclick = () => chip.classList.toggle('selected');
    grid.appendChild(chip);
  });
}
function buildInterestModal() {
  const list = document.getElementById('interest-modal-list');
  if (!list) return;
  const temp = [...state.interests];
  const draw = () => {
    list.innerHTML = '';
    INTERESTS.forEach(i => {
      const row = document.createElement('div');
      row.className = 'modal-row' + (temp.includes(i) ? ' selected' : '');
      row.innerHTML = '<span>' + ti(i) + '</span><span class="tick">' + (temp.includes(i) ? '✓' : '') + '</span>';
      row.onclick = () => {
        const idx = temp.indexOf(i);
        if (idx >= 0) temp.splice(idx, 1);
        else temp.push(i);
        draw();
      };
      list.appendChild(row);
    });
  };
  draw();
  const header = document.querySelector('#interest-modal .modal-header');
  const existingBtn = header.querySelector('.save-btn');
  if (!existingBtn) {
    const btn = document.createElement('button');
    btn.className = 'save-btn modal-close';
    btn.style.cssText = 'background:var(--accent);color:#0a0e1a;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;width:auto;height:auto;';
    btn.textContent = t('save_changes');
    btn.onclick = () => {
      state.interests = temp;
      localStorage.setItem('ss_interests', JSON.stringify(temp));
      refreshSettingsUI();
      closeModal('interest-modal');
      btn.remove();
    };
    header.appendChild(btn);
  }
}
function goBackOnboarding() {
  document.getElementById('onboard-2').classList.remove('active');
  document.getElementById('onboard-1').classList.add('active');
}
function showTourStep(i) {
  document.querySelectorAll('.tour-step').forEach(s => s.classList.remove('active'));
  const step = document.querySelector('.tour-step[data-tour="' + i + '"]');
  if (step) step.classList.add('active');
  document.querySelectorAll('#tour-dots .t-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
  const nextBtn = document.getElementById('tour-next-btn');
  if (nextBtn) nextBtn.textContent = (i === TOUR_TOTAL - 1) ? t('get_started') : t('next');
}
function nextTourStep() { tourIndex++; if (tourIndex >= TOUR_TOTAL) { finishTour(); return; } showTourStep(tourIndex); }
function skipTour() { finishTour(); }
function finishTour() {
  document.getElementById('onboard-3').classList.remove('active');
  renderReadyPersonalized();
  document.getElementById('onboard-4').classList.add('active');
}
function renderReadyPersonalized() {
  const el = document.getElementById('ready-personalized');
  if (!el) return;
  if (state.interests.length === 0) { el.innerHTML = ''; return; }
  const map = {
    'Saving money': 'Start your first savings goal',
    'Managing my budget': 'Try the budget calculator',
    'Making better spending decisions': 'Check a purchase before you buy',
    'Paying off debt': 'See how long until you\'re debt-free',
    'Building an emergency fund': 'Plan your emergency fund',
    'Tracking my financial goals': 'Set a savings goal'
  };
  const first = state.interests[0];
  const txt = map[first];
  if (!txt) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="info-card" style="text-align:left;"><span class="tag foryou">' + t('for_you') + '</span><h4>' + txt + '</h4></div>';
}
function initOnboarding() {
  const cNext = document.getElementById('currency-next');
  const iNext = document.getElementById('interest-next');
  const rNext = document.getElementById('ready-next');
  if (cNext) cNext.onclick = () => {
    localStorage.setItem('ss_currency', state.currency);
    document.getElementById('onboard-1').classList.remove('active');
    document.getElementById('onboard-2').classList.add('active');
  };
  if (iNext) iNext.onclick = () => {
    const selected = Array.from(document.querySelectorAll('#interest-grid .chip.selected')).map(c => {
      const found = INTERESTS.find(i => ti(i) === c.textContent);
      return found || c.textContent;
    });
    localStorage.setItem('ss_interests', JSON.stringify(selected));
    state.interests = selected;
    document.getElementById('onboard-2').classList.remove('active');
    document.getElementById('onboard-3').classList.add('active');
    tourIndex = 0;
    showTourStep(0);
  };
  if (rNext) rNext.onclick = () => {
    localStorage.setItem('ss_onboarded', 'true');
    state.onboarded = true;
    document.getElementById('onboard-4').classList.remove('active');
    startApp();
  };
 }
// ============ NAV ============
let currentTab = 'home';
let openSub = null;
function goTo(tab) {
  currentTab = tab;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const screen = document.getElementById('screen-' + tab);
  if (screen) screen.classList.add('active');
  const navBtn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
  if (navBtn) navBtn.classList.add('active');
  if (tab === 'home') refreshHome();
  if (tab === 'save') renderGoals();
  if (tab === 'decide') renderTemplates();
  if (tab === 'tools') renderToolsHome();
  if (tab === 'more') renderAuthUI();
}

// ============ SUB-SCREENS ============
function openSubScreen(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  openSub = id;
  history.pushState({ page: 'sub', id: id }, '');
  if (id === 'sub-settings') refreshSettingsUI();
  if (id === 'sub-data') renderDataStats();
  if (id === 'sub-insights') renderInsights();
  if (id === 'sub-tips') renderTips();
  if (id === 'sub-history') renderHistory();
  if (id === 'sub-username') renderUsernameScreen();
  if (id === 'sub-friends') openFriendsScreen();
  if (id === 'sub-notifications') renderNotifications();
  if (id === 'sub-streak') renderStreakHistory();
}
function closeSubScreen(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
  if (openSub === id) openSub = null;
}
function renderDataStats() {
  const s = document.getElementById('data-spends'); if (s) s.textContent = state.spends.length;
  const g = document.getElementById('data-goals'); if (g) g.textContent = state.goals.length;
  const d = document.getElementById('data-decisions'); if (d) d.textContent = state.decisions.length;
}

// ============ HISTORY ============
function renderHistory() {
  const decEl = document.getElementById('history-decisions');
  const spEl = document.getElementById('history-spends');
  if (decEl) {
    if (state.decisions.length === 0) {
      decEl.innerHTML = '<div class="empty">' + (state.lang === 'de' ? 'Noch keine Entscheidungen.' : state.lang === 'es' ? 'Aún no hay decisiones.' : 'No decisions yet.') + '</div>';
    } else {
      decEl.innerHTML = state.decisions.map(d => {
        const color = d.result === 'yes' ? 'var(--good)' : d.result === 'no' ? 'var(--bad)' : 'var(--accent)';
        return '<div class="history-item"><div><div class="hi-name">' + d.name + '</div><div class="hi-meta">' + fmt(d.price) + ' · ' + d.date + '</div></div><div class="hi-verdict" style="color:' + color + ';">' + d.verdict + '</div></div>';
      }).join('');
    }
  }
  if (spEl) {
    if (state.spends.length === 0) {
      spEl.innerHTML = '<div class="empty">' + (state.lang === 'de' ? 'Noch keine Ausgaben.' : state.lang === 'es' ? 'Aún no hay gastos.' : 'No spends yet.') + '</div>';
    } else {
      spEl.innerHTML = state.spends.slice(0, 50).map(s => {
        const date = new Date(s.ts).toLocaleDateString();
        return '<div class="history-item"><div><div class="hi-name">' + (s.note || (state.lang === 'de' ? 'Ausgabe' : state.lang === 'es' ? 'Gasto' : 'Spend')) + '</div><div class="hi-meta">' + date + '</div></div><div class="hi-verdict" style="color:var(--text);">' + fmt(s.amount) + '</div></div>';
      }).join('');
    }
  }
}

// ============ MODALS ============
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('active'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('active'); }
function openCurrencyModal() {
  const list = document.getElementById('currency-modal-list');
  list.innerHTML = '';
  CURRENCIES.forEach(c => {
    const row = document.createElement('div');
    row.className = 'modal-row' + (c.code === state.currency ? ' selected' : '');
    row.innerHTML = '<span>' + c.code + '</span><span class="check">✓</span>';
    row.onclick = () => {
      state.currency = c.code;
      localStorage.setItem('ss_currency', c.code);
      refreshSettingsUI();
      refreshHome();
      renderGoals();
      closeModal('currency-modal');
    };
    list.appendChild(row);
  });
  openModal('currency-modal');
}
function openInterestModal() { buildInterestModal(); openModal('interest-modal'); }
function openToolModal() {
  const list = document.getElementById('tool-modal-list');
  list.innerHTML = '';
  const tools = ['savings','budget','debt','discount','percent','emergency','tip','convert'];
  tools.forEach(tool => {
    const row = document.createElement('div');
    row.className = 'modal-row' + (tool === state.currentTool ? ' selected' : '');
    row.innerHTML = '<span>' + t('tool_' + tool) + '</span><span class="check">✓</span>';
    row.onclick = () => {
      state.currentTool = tool;
      toolSwitch(tool);
      const disp = document.getElementById('tool-display');
      if (disp) disp.textContent = t('tool_' + tool);
      closeModal('tool-modal');
    };
    list.appendChild(row);
  });
  openModal('tool-modal');
}
let convertTarget = 'from';
function openConvertModal(which) {
  convertTarget = which;
  const list = document.getElementById('convert-modal-list');
  list.innerHTML = '';
  const current = which === 'from' ? state.convertFrom : state.convertTo;
  CURRENCIES.forEach(c => {
    const row = document.createElement('div');
    row.className = 'modal-row' + (c.code === current ? ' selected' : '');
    row.innerHTML = '<span>' + c.code + '</span><span class="check">✓</span>';
    row.onclick = () => {
      if (which === 'from') {
        state.convertFrom = c.code;
        localStorage.setItem('ss_convertFrom', c.code);
        const el = document.getElementById('tc-from-display');
        if (el) el.textContent = c.code;
      } else {
        state.convertTo = c.code;
        localStorage.setItem('ss_convertTo', c.code);
        const el = document.getElementById('tc-to-display');
        if (el) el.textContent = c.code;
      }
      closeModal('convert-modal');
    };
    list.appendChild(row);
  });
  openModal('convert-modal');
}

// ============ BACK BUTTON ============
window.addEventListener('popstate', () => {
  const goalForm = document.getElementById('goal-form');
  if (goalForm && goalForm.classList.contains('active')) { closeNewGoal(); history.pushState({}, ''); return; }
  const openModalEl = document.querySelector('.modal-overlay.active');
  if (openModalEl) { openModalEl.classList.remove('active'); history.pushState({}, ''); return; }
  if (openSub) { closeSubScreen(openSub); history.pushState({}, ''); return; }
  if (currentTab !== 'home') { goTo('home'); history.pushState({}, ''); return; }
  if (confirm('Exit SmartSaver?')) history.back();
  else history.pushState({}, '');
});
function armBackButton() { history.pushState({}, ''); }

// ============ HOME ============
function refreshHome() {
  const h = new Date().getHours();
  let greet = h < 12 ? t('greeting_morning') : h < 17 ? t('greeting_afternoon') : t('greeting_evening');
  if (state.user && state.user.username) greet += ', ' + state.user.username;
  else if (state.user && state.user.name) greet += ', ' + state.user.name.split(' ')[0];
  const greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = greet;

  const s = state.snapshot;
  if (s) {
    document.getElementById('snap-balance').textContent = fmt(s.balance);
    document.getElementById('snap-income').textContent = fmt(s.income);
    document.getElementById('snap-expenses').textContent = fmt(s.expenses);
    const avail = (s.income || 0) - (s.expenses || 0);
    const availEl = document.getElementById('snap-available');
    availEl.textContent = fmt(avail);
    availEl.className = 'value ' + (avail >= 0 ? 'good' : 'bad');
  }
  renderStreak();
  renderToday();
  renderThisWeek();
  renderBuzzCard();
  renderNotifBell();
  renderStreakNudge();
}
function renderStreak() {
  const el = document.getElementById('home-streak');
  const num = document.getElementById('home-streak-num');
  if (!el || !num) return;
  const streak = currentStreak();
  if (streak >= 1) { el.classList.add('visible'); num.textContent = streak; }
  else el.classList.remove('visible');
}
function renderToday() {
  const el = document.getElementById('today-total');
  if (!el) return;
  const today = todayKey();
  const todaySpends = state.spends.filter(s => s.dayKey === today);
  const total = todaySpends.reduce((sum, s) => sum + s.amount, 0);
  const label = t('spent_today');
  if (todaySpends.length === 0) el.innerHTML = label + ': <b style="color:var(--text);">—</b>';
  else el.innerHTML = label + ': <b style="color:var(--text);">' + fmt(total) + '</b> (' + todaySpends.length + ')';
}
function logSpend() {
  const amountEl = document.getElementById('spend-input');
  const noteEl = document.getElementById('spend-note');
  const amount = parseFloat(amountEl.value) || 0;
  const note = (noteEl.value || '').trim();
  if (amount <= 0) { showToast(tt('enter_amount')); return; }
  state.spends.unshift({ amount, note, ts: Date.now(), dayKey: todayKey() });
  if (state.spends.length > 200) state.spends = state.spends.slice(0, 200);
  saveSpends();
  amountEl.value = '';
  noteEl.value = '';
  renderToday();
  showToast('+' + fmt(amount));
  recordActivity();
  renderStreak();
  scheduleAutoPush();
}

// ============ THIS WEEK ============
function renderThisWeek() {
  const card = document.getElementById('home-week-card');
  const statsEl = document.getElementById('home-week-stats');
  const sugEl = document.getElementById('home-week-suggestions');
  if (!card || !statsEl || !sugEl) return;
  const since = Date.now() - WEEK_MS;
  const weekDecisions = state.decisions.filter(d => (d.ts || 0) >= since);
  const weekContribs = state.contributions.filter(c => (c.ts || 0) >= since);
  const weekSpends = state.spends.filter(s => (s.ts || 0) >= since);
  const weekAdded = weekContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const weekSpent = weekSpends.reduce((sum, s) => sum + (s.amount || 0), 0);
  const hasAnyData = state.decisions.length + state.contributions.length + state.goals.length + state.spends.length > 0;
  if (!hasAnyData) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const stats = [];
  if (weekDecisions.length > 0) stats.push('<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:var(--text-dim);">' + t('nav_decide') + '</span><span style="font-size:14px;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums;">' + weekDecisions.length + '</span></div>');
  if (weekContribs.length > 0) stats.push('<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:var(--text-dim);">' + t('nav_save') + '</span><span style="font-size:14px;font-weight:600;color:var(--accent);font-variant-numeric:tabular-nums;">' + fmt(weekAdded) + '</span></div>');
  if (weekSpends.length > 0) stats.push('<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:var(--text-dim);">Spent</span><span style="font-size:14px;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums;">' + fmt(weekSpent) + '</span></div>');
  statsEl.innerHTML = stats.length === 0 ? '<div style="font-size:13px;color:var(--text-mute);padding:8px 0;line-height:1.5;">' + t('nothing_logged_week') + '</div>' : stats.join('');
  const suggestions = generateSuggestions(weekDecisions, weekContribs, weekAdded, weekSpends, weekSpent);
  if (suggestions.length === 0) { sugEl.innerHTML = ''; sugEl.style.display = 'none'; }
  else {
    sugEl.style.display = 'block';
    sugEl.innerHTML = '<div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin:16px 0 10px;">' + t('suggestions') + '</div>' +
      suggestions.map(s => '<div style="display:flex;gap:10px;padding:10px 0;align-items:flex-start;"><div style="color:var(--accent);flex-shrink:0;margin-top:2px;">' + icon('spark', 14) + '</div><div style="font-size:13px;color:#b8c0d1;line-height:1.55;">' + s + '</div></div>').join('');
  }
}
function generateSuggestions(weekDecisions, weekContribs, weekAdded, weekSpends, weekSpent) {
  const s = [];
  const now = Date.now();
  if (state.goals.length > 0) {
    const g = state.goals.find(x => x.saved < x.target);
    if (g) {
      const remaining = g.target - g.saved;
      const goalContribs = state.contributions.filter(c => c.goalName === g.name);
      let pace = 0;
      if (goalContribs.length >= 2) {
        const sorted = goalContribs.slice().sort((a, b) => a.ts - b.ts);
        const spanDays = Math.max(1, (sorted[sorted.length-1].ts - sorted[0].ts) / (24 * 60 * 60 * 1000));
        const total = sorted.reduce((sum, c) => sum + c.amount, 0);
        pace = (total / spanDays) * 30;
      } else if (g.targetDate) {
        const daysLeft = Math.max(1, Math.ceil((new Date(g.targetDate).getTime() - now) / (24 * 60 * 60 * 1000)));
        const weeklyNeed = remaining / (daysLeft / 7);
        s.push(ts('pace_target', { name: g.name, amt: fmt(Math.ceil(weeklyNeed)) }));
      }
      if (pace > 0 && remaining > 0) {
        const monthsLeft = Math.ceil(remaining / pace);
        const finishDate = new Date(now + monthsLeft * 30 * 24 * 60 * 60 * 1000);
        const dateStr = finishDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
        s.push(ts('pace_current', { name: g.name, date: dateStr }));
      }
    }
  }
  if (state.snapshot) {
    const buffer = (state.snapshot.income || 0) - (state.snapshot.expenses || 0);
    if (buffer > 0) s.push(ts('buffer_good', { amt: fmt(buffer) }));
    else if (buffer < 0) s.push(ts('buffer_negative', { amt: fmt(Math.abs(buffer)) }));
  }
  if (weekSpent > 0) {
    const prevStart = now - 2 * WEEK_MS;
    const prevEnd = now - WEEK_MS;
    const prevSpends = state.spends.filter(sp => (sp.ts || 0) >= prevStart && (sp.ts || 0) < prevEnd);
    const prevSpent = prevSpends.reduce((sum, sp) => sum + sp.amount, 0);
    if (prevSpent > 0) {
      const diff = weekSpent - prevSpent;
      if (diff > 0) s.push(ts('spent_more', { amt: fmt(diff) }));
      else if (diff < 0) s.push(ts('spent_less', { amt: fmt(Math.abs(diff)) }));
    }
  }
  const lastSpend = state.spends.length > 0 ? state.spends[0] : null;
  const lastDecision = state.decisions[0];
  const lastActivity = Math.max(lastDecision ? (lastDecision.ts || 0) : 0, lastSpend ? (lastSpend.ts || 0) : 0);
  if (lastActivity > 0) {
    const daysSince = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
    if (daysSince >= 3 && daysSince < 30) s.push(ts('no_activity', { days: daysSince }));
  }
  return s.slice(0, 3);
}

// ============ TIPS ============
const TIPS_DATA = [
  { cat: 'Budgeting', match: 'Managing my budget', h: 'The 50/30/20 rule', p: 'Split monthly income: 50% needs, 30% wants, 20% savings and debt payoff.' },
  { cat: 'Budgeting', match: 'Managing my budget', h: 'Zero-based budget', p: 'Give every unit of income a job. When income minus outgoings equals zero, nothing gets wasted.' },
  { cat: 'Saving', match: 'Saving money', h: 'Pay yourself first', p: 'Move money to savings the day you get paid. What\'s left is your real spending money.' },
  { cat: 'Saving', match: 'Saving money', h: 'Save windfalls', p: 'Bonus, refund, gift? Send half to savings automatically.' },
  { cat: 'Saving', match: 'Saving money', h: 'The 1% challenge', p: 'Increase savings by 1% of income each month. After a year, you save 12% more.' },
  { cat: 'Decisions', match: 'Making better spending decisions', h: 'The 24-hour rule', p: 'For non-essential purchases over a day\'s income, wait 24 hours. Impulse fades.' },
  { cat: 'Decisions', match: 'Making better spending decisions', h: 'Cost per use', p: 'A $200 item used 200 times costs $1 per use. Expensive isn\'t always wasteful.' },
  { cat: 'Decisions', match: 'Making better spending decisions', h: 'Opportunity cost', p: 'Every purchase trades for something else. A $500 phone today could be 5 months of savings.' },
  { cat: 'Debt', match: 'Paying off debt', h: 'Avalanche method', p: 'Pay minimums on everything. Put every extra unit on the highest-interest debt.' },
  { cat: 'Debt', match: 'Paying off debt', h: 'Snowball method', p: 'Pay off smallest debts first. Quick wins build momentum.' },
  { cat: 'Debt', match: 'Paying off debt', h: 'Minimum payments trap', p: 'Paying only the minimum on a credit card can take decades. Always pay above.' },
  { cat: 'Emergency', match: 'Building an emergency fund', h: '3-6 months rule', p: 'Aim for 3-6 months of essential expenses in a separate, easy-to-reach account.' },
  { cat: 'Emergency', match: 'Building an emergency fund', h: 'Keep it boring', p: 'An emergency fund isn\'t for investing. Keep it in savings — accessible, stable, safe.' },
  { cat: 'Spending', match: 'Making better spending decisions', h: 'Subscription audit', p: 'Once a quarter, list every subscription. Cancel what you haven\'t used in 30 days.' },
  { cat: 'Spending', match: 'Making better spending decisions', h: 'The coffee trap', p: 'A daily $5 coffee is $1,825 a year. Not saying skip it — just know the real cost.' },
  { cat: 'Spending', match: 'Making better spending decisions', h: 'Sleep on it list', p: 'Keep a running wishlist. Wait a week. Buy only what survives.' },
  { cat: 'Habit', match: 'Tracking my financial goals', h: 'Track small spends', p: 'Snacks, transport, small purchases add up. Logging them reveals 10-20% you didn\'t notice.' },
  { cat: 'Long term', match: 'Saving money', h: 'Compound interest', p: 'Money grows on money. Investing early beats investing more later.' },
  { cat: 'Long term', match: 'Building an emergency fund', h: 'Insurance basics', p: 'Protect against big stuff you can\'t afford to lose. Skip insurance for small stuff.' }
];
function renderTips() {
  const el = document.getElementById('tips-list');
  if (!el) return;
  const forYou = state.interests.length > 0 ? state.interests : [];
  const sorted = [...TIPS_DATA].sort((a, b) => {
    const aMatch = forYou.includes(a.match) ? 1 : 0;
    const bMatch = forYou.includes(b.match) ? 1 : 0;
    return bMatch - aMatch;
  });
  el.innerHTML = sorted.map(tip => {
    const isForYou = forYou.includes(tip.match);
    return '<div class="info-card"><span class="tag' + (isForYou ? ' foryou' : '') + '">' + (isForYou ? t('for_you') + ' · ' : '') + tip.cat + '</span><h4>' + tip.h + '</h4><p>' + tip.p + '</p></div>';
  }).join('');
}

// ============ INSIGHTS ============
function renderInsights() {
  const el = document.getElementById('insights-content');
  if (!el) return;
  const now = Date.now();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = now - (i + 1) * WEEK_MS;
    const end = now - i * WEEK_MS;
    const wSpends = state.spends.filter(s => (s.ts || 0) >= start && (s.ts || 0) < end);
    const total = wSpends.reduce((sum, s) => sum + s.amount, 0);
    weeks.push({ total, label: 'W' + (8 - i) });
  }
  const maxWeek = Math.max(...weeks.map(w => w.total), 1);
  const since30 = now - 30 * 24 * 60 * 60 * 1000;
  const recentDecisions = state.decisions.filter(d => (d.ts || 0) >= since30);
  const yesCount = recentDecisions.filter(d => d.result === 'yes').length;
  const riskyCount = recentDecisions.filter(d => d.result === 'risky').length;
  const noCount = recentDecisions.filter(d => d.result === 'no').length;
  const totalDecisions = yesCount + riskyCount + noCount || 1;
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthSpends = state.spends.filter(s => (s.ts || 0) >= monthStart.getTime());
  const monthTotalSpent = monthSpends.reduce((sum, s) => sum + s.amount, 0);
  const monthContribs = state.contributions.filter(c => (c.ts || 0) >= monthStart.getTime());
  const monthTotalSaved = monthContribs.reduce((sum, c) => sum + c.amount, 0);
  const daysElapsed = Math.max(1, Math.ceil((now - monthStart.getTime()) / (24 * 60 * 60 * 1000)));
  const avgDaily = monthTotalSpent / daysElapsed;
  const hasData = state.spends.length > 0 || state.decisions.length > 0 || state.goals.length > 0;
  if (!hasData) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>' + t('no_data_yet') + '</div>';
    return;
  }
  let html = '';
  html += '<div class="card"><div class="card-title">' + t('insights_title') + '</div>';
  html += '<div class="stat-grid">';
  html += '<div class="stat-item"><div class="label">' + t('this_month_spent') + '</div><div class="value accent">' + fmt(monthTotalSpent.toFixed(2)) + '</div></div>';
  html += '<div class="stat-item"><div class="label">' + t('this_month_saved') + '</div><div class="value accent">' + fmt(monthTotalSaved.toFixed(2)) + '</div></div>';
  html += '<div class="stat-item"><div class="label">' + t('avg_daily_spend') + '</div><div class="value">' + fmt(avgDaily.toFixed(2)) + '</div></div>';
  html += '<div class="stat-item"><div class="label">' + t('decisions_made') + '</div><div class="value">' + state.decisions.length + '</div></div>';
  html += '</div></div>';
  html += '<div class="card"><div class="card-title">' + t('spending_trend') + ' · ' + t('last_8_weeks') + '</div>';
  html += '<div class="chart-wrap"><div class="chart-bars">';
  weeks.forEach(w => {
    const pct = maxWeek > 0 ? (w.total / maxWeek) * 100 : 0;
    html += '<div class="chart-bar-col"><div class="chart-bar' + (w.total === 0 ? ' empty' : '') + '" style="height:' + Math.max(pct, 4) + '%;"></div><div class="chart-label">' + w.label + '</div></div>';
  });
  html += '</div></div></div>';
  if (recentDecisions.length > 0) {
    html += '<div class="card"><div class="card-title">' + t('decisions_breakdown') + ' · ' + t('last_30_days') + '</div>';
    html += '<div class="split-bars">';
    html += '<div class="split-row"><div class="split-label">' + t('yes_count') + '</div><div class="split-bar-wrap"><div class="split-bar" style="width:' + ((yesCount / totalDecisions) * 100) + '%;background:var(--good);"></div></div><div class="split-count">' + yesCount + '</div></div>';
    html += '<div class="split-row"><div class="split-label">' + t('risky_count') + '</div><div class="split-bar-wrap"><div class="split-bar" style="width:' + ((riskyCount / totalDecisions) * 100) + '%;background:var(--warn);"></div></div><div class="split-count">' + riskyCount + '</div></div>';
    html += '<div class="split-row"><div class="split-label">' + t('no_count') + '</div><div class="split-bar-wrap"><div class="split-bar" style="width:' + ((noCount / totalDecisions) * 100) + '%;background:var(--bad);"></div></div><div class="split-count">' + noCount + '</div></div>';
    html += '</div></div>';
  }
  if (state.goals.length > 0) {
    html += '<div class="card"><div class="card-title">' + t('goals_overview') + '</div>';
    state.goals.forEach(g => {
      const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      html += '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:14px;font-weight:600;">' + g.name + '</span><span style="font-size:13px;color:var(--text-dim);font-variant-numeric:tabular-nums;">' + pct + '%</span></div><div class="progress"><div class="progress-fill" style="width:' + pct + '%;"></div></div></div>';
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

// ============ TOOLS ============
function renderToolsHome() {
  const disp = document.getElementById('tool-display');
  if (disp) disp.textContent = t('tool_' + state.currentTool);
  const fromEl = document.getElementById('tc-from-display');
  const toEl = document.getElementById('tc-to-display');
  if (fromEl) fromEl.textContent = state.convertFrom;
  if (toEl) toEl.textContent = state.convertTo;
}
function toolSwitch(tool) {
  state.currentTool = tool;
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('tool-' + tool);
  if (panel) panel.classList.add('active');
}
function clearTool(ids, resultId) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const r = document.getElementById(resultId);
  if (r) { r.className = 'result'; r.innerHTML = ''; }
}
function showToolResult(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
  el.classList.add('show');
}
function calcSavings() {
  const target = parseFloat(document.getElementById('ts-target').value) || 0;
  const current = parseFloat(document.getElementById('ts-current').value) || 0;
  const monthly = parseFloat(document.getElementById('ts-monthly').value) || 0;
  if (!target || !monthly) { showToolResult('ts-out', '<p>' + (state.lang === 'de' ? 'Ziel und monatlichen Betrag eingeben.' : state.lang === 'es' ? 'Introduce objetivo y cantidad mensual.' : 'Enter a target and monthly amount.') + '</p>'); return; }
  const remaining = Math.max(0, target - current);
  const months = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
  const L = state.lang === 'de' ? { you: 'Du brauchst noch', at: 'Bei', month: 'pro Monat erreichst du es in', months: 'Monaten' } : state.lang === 'es' ? { you: 'Necesitas', at: 'A', month: 'por mes, lo alcanzarás en', months: 'meses' } : { you: 'You need', at: 'At', month: 'per month, you will reach it in', months: 'months' };
  showToolResult('ts-out', '<p>' + L.you + ' <b>' + fmt(remaining) + '</b>.<br>' + L.at + ' <b>' + fmt(monthly) + '</b> ' + L.month + ' <b>' + months + ' ' + L.months + '</b>.</p>');
}
function calcBudget() {
  const income = parseFloat(document.getElementById('tb-income').value) || 0;
  const needs = parseFloat(document.getElementById('tb-needs').value) || 0;
  const wants = parseFloat(document.getElementById('tb-wants').value) || 0;
  const savings = parseFloat(document.getElementById('tb-savings').value) || 0;
  if (!income) { showToolResult('tb-out', '<p>' + (state.lang === 'de' ? 'Monatliches Einkommen eingeben.' : state.lang === 'es' ? 'Introduce el ingreso mensual.' : 'Enter your monthly income.') + '</p>'); return; }
  const total = needs + wants + savings;
  const left = income - total;
  const L = state.lang === 'de' ? { alloc: 'Zugewiesen', inc: 'Einkommen', left: 'Übrig', over: 'Über Budget um' } : state.lang === 'es' ? { alloc: 'Asignado', inc: 'Ingresos', left: 'Queda', over: 'Sobre presupuesto por' } : { alloc: 'Allocated', inc: 'Income', left: 'Left', over: 'Over budget by' };
  showToolResult('tb-out', '<p>' + L.alloc + ': <b>' + fmt(total) + '</b><br>' + L.inc + ': <b>' + fmt(income) + '</b><br><b style="color:' + (left >= 0 ? 'var(--good)' : 'var(--bad)') + ';">' + (left >= 0 ? L.left + ': ' : L.over + ': ') + fmt(Math.abs(left)) + '</b></p>');
}
function calcDebt() {
  const debt = parseFloat(document.getElementById('td-debt').value) || 0;
  const rate = parseFloat(document.getElementById('td-rate').value) || 0;
  const payment = parseFloat(document.getElementById('td-payment').value) || 0;
  if (!debt || !payment) { showToolResult('td-out', '<p>' + (state.lang === 'de' ? 'Schulden und Zahlung eingeben.' : state.lang === 'es' ? 'Introduce deuda y pago.' : 'Enter debt and monthly payment.') + '</p>'); return; }
  const monthlyRate = (rate / 100) / 12;
  if (payment <= debt * monthlyRate) { showToolResult('td-out', '<p style="color:var(--bad);">' + (state.lang === 'de' ? 'Zahlung zu niedrig.' : state.lang === 'es' ? 'Pago demasiado bajo.' : 'Payment too low to ever pay off.') + '</p>'); return; }
  let balance = debt, months = 0, totalInterest = 0;
  while (balance > 0 && months < 600) { const i = balance * monthlyRate; totalInterest += i; balance = balance + i - payment; months++; }
  const years = Math.floor(months / 12); const rem = months % 12;
  const timeStr = years > 0 ? (years + 'y ' + rem + 'm') : (months + ' months');
  const L = state.lang === 'de' ? { payoff: 'Tilgung', interest: 'Zinsen', total: 'Gesamt' } : state.lang === 'es' ? { payoff: 'Pago', interest: 'Intereses', total: 'Total' } : { payoff: 'Payoff', interest: 'Interest', total: 'Total' };
  showToolResult('td-out', '<p>' + L.payoff + ': <b>' + timeStr + '</b><br>' + L.interest + ': <b>' + fmt(totalInterest.toFixed(2)) + '</b><br>' + L.total + ': <b>' + fmt((debt + totalInterest).toFixed(2)) + '</b></p>');
}
function calcDiscount() {
  const price = parseFloat(document.getElementById('tDisc-price').value) || 0;
  const disc = parseFloat(document.getElementById('tDisc-disc').value) || 0;
  if (!price || !disc) { showToolResult('tDisc-out', '<p>' + (state.lang === 'de' ? 'Preis und Rabatt eingeben.' : state.lang === 'es' ? 'Introduce precio y descuento.' : 'Enter price and discount.') + '</p>'); return; }
  const save = price * (disc / 100); const final = price - save;
  const L = state.lang === 'de' ? { save: 'Du sparst', final: 'Endpreis' } : state.lang === 'es' ? { save: 'Ahorras', final: 'Precio final' } : { save: 'You save', final: 'Final' };
  showToolResult('tDisc-out', '<p>' + L.save + ' <b>' + fmt(save.toFixed(2)) + '</b><br>' + L.final + ': <b style="color:var(--good);">' + fmt(final.toFixed(2)) + '</b></p>');
}
function calcPercent() {
  const a = parseFloat(document.getElementById('tp-a').value) || 0;
  const b = parseFloat(document.getElementById('tp-b').value) || 0;
  if (!a || !b) { showToolResult('tp-out', '<p>' + (state.lang === 'de' ? 'Beide Zahlen eingeben.' : state.lang === 'es' ? 'Introduce ambos números.' : 'Enter both numbers.') + '</p>'); return; }
  const L = state.lang === 'de' ? 'ist' : state.lang === 'es' ? 'es' : 'is';
  showToolResult('tp-out', '<p><b>' + a + '</b> ' + L + ' <b>' + ((a / b) * 100).toFixed(1) + '%</b> ' + (state.lang === 'de' ? 'von' : state.lang === 'es' ? 'de' : 'of') + ' <b>' + b + '</b>.</p>');
}
function calcEmergency() {
  const essentials = parseFloat(document.getElementById('te-ess').value) || 0;
  if (!essentials) { showToolResult('te-out', '<p>' + (state.lang === 'de' ? 'Monatlichen Grundbedarf eingeben.' : state.lang === 'es' ? 'Introduce los esenciales mensuales.' : 'Enter your monthly essentials.') + '</p>'); return; }
  const monthLbl = state.lang === 'de' ? 'Monat' : state.lang === 'es' ? 'mes' : 'month';
  const monthsLbl = state.lang === 'de' ? 'Monate' : state.lang === 'es' ? 'meses' : 'months';
  showToolResult('te-out', '<p>1 ' + monthLbl + ': <b>' + fmt(essentials) + '</b><br>3 ' + monthsLbl + ': <b>' + fmt(essentials * 3) + '</b><br>6 ' + monthsLbl + ': <b>' + fmt(essentials * 6) + '</b><br>12 ' + monthsLbl + ': <b>' + fmt(essentials * 12) + '</b></p>');
}
function calcTip() {
  const bill = parseFloat(document.getElementById('tt-bill').value) || 0;
  const tip = parseFloat(document.getElementById('tt-tip').value) || 0;
  if (!bill) { showToolResult('tt-out', '<p>' + (state.lang === 'de' ? 'Rechnungsbetrag eingeben.' : state.lang === 'es' ? 'Introduce la cuenta.' : 'Enter the bill.') + '</p>'); return; }
  const tipAmt = bill * (tip / 100);
  const L = state.lang === 'de' ? { tip: 'Trinkgeld', total: 'Gesamt' } : state.lang === 'es' ? { tip: 'Propina', total: 'Total' } : { tip: 'Tip', total: 'Total' };
  showToolResult('tt-out', '<p>' + L.tip + ': <b>' + fmt(tipAmt.toFixed(2)) + '</b><br>' + L.total + ': <b>' + fmt((bill + tipAmt).toFixed(2)) + '</b></p>');
}
async function fetchRates(base) {
  const now = Date.now();
  if (ratesCache && ratesCache.base === base && (now - ratesCacheTime) < 60 * 60 * 1000) return ratesCache.rates;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/' + base);
    const data = await res.json();
    if (data && data.rates) { ratesCache = { base, rates: data.rates }; ratesCacheTime = now; return data.rates; }
  } catch (e) {}
  return null;
}
async function calcConvert() {
  const amt = parseFloat(document.getElementById('tc-amt').value) || 0;
  if (!amt) { showToolResult('tc-out', '<p>' + (state.lang === 'de' ? 'Betrag eingeben.' : state.lang === 'es' ? 'Introduce una cantidad.' : 'Enter an amount.') + '</p>'); return; }
  showToolResult('tc-out', '<p>' + tv('fetch_rate') + '</p>');
  const rates = await fetchRates(state.convertFrom);
  if (!rates) { showToolResult('tc-out', '<p style="color:var(--bad);">' + tv('rate_fail') + '</p>'); return; }
  const rate = rates[state.convertTo];
  if (!rate) { showToolResult('tc-out', '<p>Rate not available.</p>'); return; }
  const result = amt * rate;
  showToolResult('tc-out', '<p>' + state.convertFrom + ' ' + amt.toLocaleString() + ' = <b>' + state.convertTo + ' ' + result.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '</b><br><span style="font-size:12px;color:var(--text-mute);">1 ' + state.convertFrom + ' = ' + rate.toFixed(4) + ' ' + state.convertTo + '</span></p>');
}

// ============ EXPORT / IMPORT ============
function exportData() {
  const data = {
    goals: state.goals, decisions: state.decisions, contributions: state.contributions,
    spends: state.spends, templates: state.templates,
    snapshot: state.snapshot, currency: state.currency, interests: state.interests,
    theme: state.theme, lang: state.lang, streak: state.streak, exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smartsaver-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(tt('backup_downloaded'));
}
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.goals) { state.goals = data.goals; saveGoals(); }
      if (data.decisions) { state.decisions = data.decisions; saveDecisions(); }
      if (data.contributions) { state.contributions = data.contributions; saveContributions(); }
      if (data.spends) { state.spends = data.spends; saveSpends(); }
      if (data.templates) { state.templates = data.templates; saveTemplates(); }
      if (data.snapshot) { state.snapshot = data.snapshot; localStorage.setItem('ss_snapshot', JSON.stringify(data.snapshot)); }
      if (data.currency) { state.currency = data.currency; localStorage.setItem('ss_currency', data.currency); }
      if (data.interests) { state.interests = data.interests; localStorage.setItem('ss_interests', JSON.stringify(data.interests)); }
      if (data.theme) { state.theme = data.theme; localStorage.setItem('ss_theme', data.theme); applyTheme(); }
      if (data.lang) { state.lang = data.lang; localStorage.setItem('ss_lang', data.lang); applyTranslations(); }
      if (data.streak) { state.streak = data.streak; saveStreak(); }
      showToast(tt('data_imported'));
      renderDataStats();
    } catch (err) { showToast(tt('could_not_read')); }
  };
  reader.readAsText(file);
}
function resetApp() {
  if (!confirm('This will erase all your data. Continue?')) return;
  localStorage.clear();
  location.reload();
}

// ============ DECIDE ============
let lastDecision = null;
function clearDecide() {
  ['itemName','price','balance','income','expenses'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const r = document.getElementById('result');
  if (r) { r.className = 'result'; }
  const a = document.getElementById('decision-actions');
  if (a) a.classList.remove('show');
  lastDecision = null;
}
function checkAffordability() {
  const name = document.getElementById('itemName').value || 'this';
  const price = parseFloat(document.getElementById('price').value) || 0;
  const balance = parseFloat(document.getElementById('balance').value) || 0;
  const income = parseFloat(document.getElementById('income').value) || 0;
  const expenses = parseFloat(document.getElementById('expenses').value) || 0;
  const result = document.getElementById('result');
  const verdict = document.getElementById('verdict');
  const explanation = document.getElementById('explanation');
  const actions = document.getElementById('decision-actions');
  if (price <= 0 || balance <= 0) {
    result.className = 'result show';
    verdict.textContent = tv('enter_numbers');
    explanation.textContent = state.lang === 'de' ? 'Fülle Preis und Kontostand aus.' : state.lang === 'es' ? 'Completa el precio y el saldo.' : 'Fill in the price and balance so I can help.';
    if (actions) actions.classList.remove('show');
    return;
  }
  state.snapshot = { balance, income, expenses };
  localStorage.setItem('ss_snapshot', JSON.stringify(state.snapshot));
  const afterPurchase = balance - price;
  const monthlyBuffer = Math.max(0, income - expenses);
  result.className = 'result show';
  let verdictText, resultType;
  const L = state.lang === 'de' ? {
    notYet: 'Noch nicht', risky: 'Riskant', yes: 'Ja, du kannst',
    moreThan: ' ist mehr als dein Kontostand von ', short: 'Dir fehlen ',
    butAfter: 'Du kannst ', buy: ' kaufen, aber nach ', wouldHave: ' hättest du nur ',
    left: ' übrig. Dein Puffer ist ', giveMonth: '. Gib ihm einen Monat.',
    afterBuying: 'Nach dem Kauf von ', forWord: ' für ',
    stillHave: ' hättest du noch ', aboveBuffer: ' über deinem monatlichen Puffer von '
  } : state.lang === 'es' ? {
    notYet: 'Aún no', risky: 'Riesgoso', yes: 'Sí, puedes',
    moreThan: ' es más que tu saldo de ', short: 'Te falta ',
    butAfter: 'Puedes comprar ', buy: ', pero después de pagar ', wouldHave: ' solo te quedarían ',
    left: '. Tu colchón es ', giveMonth: '. Dale un mes más.',
    afterBuying: 'Después de comprar ', forWord: ' por ',
    stillHave: ' todavía tendrás ', aboveBuffer: ' por encima de tu colchón mensual de '
  } : {
    notYet: 'Not yet', risky: 'Risky', yes: 'Yes, you can',
    moreThan: ' is more than your balance of ', short: 'You are short by ',
    butAfter: 'You can buy ', buy: ', but after paying ', wouldHave: ' you would have only ',
    left: ' left. Your buffer is ', giveMonth: '. Give it one more month.',
    afterBuying: 'After buying ', forWord: ' for ',
    stillHave: ', you will still have ', aboveBuffer: ' above your monthly buffer of '
  };
  if (price > balance) {
    result.className = 'result show no';
    verdictText = L.notYet; resultType = 'no';
    explanation.innerHTML = '<b>' + name + '</b>' + L.moreThan + fmt(balance) + '.<br><br>' + L.short + '<b>' + fmt(price - balance) + '</b>.';
  } else if (afterPurchase < monthlyBuffer) {
    result.className = 'result show no';
    verdictText = L.risky; resultType = 'risky';
    explanation.innerHTML = L.butAfter + '<b>' + name + '</b>' + L.buy + fmt(price) + L.wouldHave + '<b>' + fmt(afterPurchase) + '</b>' + L.left + fmt(monthlyBuffer) + L.giveMonth;
  } else {
    result.className = 'result show yes';
    verdictText = L.yes; resultType = 'yes';
    explanation.innerHTML = L.afterBuying + '<b>' + name + '</b>' + L.forWord + fmt(price) + L.stillHave + '<b>' + fmt(afterPurchase) + '</b>' + L.aboveBuffer + fmt(monthlyBuffer) + '.';
  }
  verdict.textContent = verdictText;
  lastDecision = { name, price, balance, income, expenses, verdict: verdictText, result: resultType, date: new Date().toLocaleDateString(), ts: Date.now() };
  if (actions) {
    actions.classList.add('show');
    const saveBtn = document.getElementById('save-decision-btn');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
  }
  recordActivity();
  renderStreak();
}
function saveDecision() {
  if (!lastDecision) return;
  state.decisions.unshift(lastDecision);
  if (state.decisions.length > 50) state.decisions = state.decisions.slice(0, 50);
  saveDecisions();
  const btn = document.getElementById('save-decision-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
  showToast(tt('saved') + ' · ' + (state.lang === 'de' ? 'Mehr → Verlauf' : state.lang === 'es' ? 'Más → Historial' : 'More → History'));
  scheduleAutoPush();
}
function renderTemplates() {
  const card = document.getElementById('templates-card');
  const chips = document.getElementById('templates-chips');
  if (!card || !chips) return;
  if (state.templates.length === 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  chips.innerHTML = state.templates.map((t2, i) => '<div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:8px 12px 8px 14px;font-size:13px;color:var(--text);font-weight:500;"><span onclick="loadTemplate(' + i + ')" style="cursor:pointer;">' + t2.name + '</span><span onclick="deleteTemplate(' + i + ')" style="cursor:pointer;color:var(--text-mute);display:flex;align-items:center;">' + icon('close', 14) + '</span></div>').join('');
}
function saveAsTemplate() {
  if (!lastDecision) return;
  const name = prompt('Name this template:', lastDecision.name);
  if (!name || !name.trim()) return;
  state.templates.push({ name: name.trim(), itemName: lastDecision.name, price: lastDecision.price, balance: lastDecision.balance, income: lastDecision.income, expenses: lastDecision.expenses });
  if (state.templates.length > 12) state.templates = state.templates.slice(-12);
  saveTemplates();
  renderTemplates();
  showToast(tt('template_saved'));
}
function loadTemplate(i) {
  const t2 = state.templates[i];
  if (!t2) return;
  document.getElementById('itemName').value = t2.itemName || '';
  document.getElementById('price').value = t2.price || '';
  document.getElementById('balance').value = t2.balance || '';
  document.getElementById('income').value = t2.income || '';
  document.getElementById('expenses').value = t2.expenses || '';
  document.getElementById('result').className = 'result';
  document.getElementById('decision-actions').classList.remove('show');
  showToast('Loaded ' + t2.name);
}
function deleteTemplate(i) {
  if (!confirm('Delete this template?')) return;
  state.templates.splice(i, 1);
  saveTemplates();
  renderTemplates();
  showToast(tt('template_deleted2'));
}

// ============ SAVINGS GOALS ============
function renderGoals() {
  const el = document.getElementById('goals-list');
  if (!el) return;
  if (state.goals.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>' + t('no_goals') + '</div>';
    return;
  }
  el.innerHTML = state.goals.map((g, i) => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    const remaining = g.target - g.saved;
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;"><div><div style="font-size:16px;font-weight:700;letter-spacing:-0.02em;">' + g.name + '</div><div style="font-size:12px;color:var(--text-mute);margin-top:4px;">' + (g.targetDate || '—') + '</div></div><div style="font-size:20px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums;">' + pct + '%</div></div><div class="progress" style="margin-bottom:12px;"><div class="progress-fill" style="width:' + pct + '%;"></div></div><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-dim);margin-bottom:14px;font-variant-numeric:tabular-nums;"><span>' + fmt(g.saved) + ' ' + t('saved') + '</span><span>' + fmt(remaining) + ' ' + t('to_go') + '</span></div><div style="display:flex;gap:8px;"><button onclick="addMoney(' + i + ')" style="flex:1;padding:10px;font-size:13px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--accent);font-weight:600;font-family:inherit;cursor:pointer;">' + t('add_money') + '</button><button onclick="deleteGoal(' + i + ')" style="padding:10px 14px;font-size:13px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--bad);font-weight:600;font-family:inherit;cursor:pointer;">' + t('delete') + '</button></div></div>';
  }).join('');
}
function openNewGoal() { document.getElementById('goal-form').classList.add('active'); history.pushState({}, ''); }
function closeNewGoal() {
  document.getElementById('goal-form').classList.remove('active');
  ['goalName','goalTarget','goalSaved','goalDate'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}
function saveGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value) || 0;
  const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
  const date = document.getElementById('goalDate').value;
  if (!name || target <= 0) { showToast(tt('enter_name_target')); return; }
  state.goals.push({ name, target, saved, targetDate: date, createdAt: Date.now() });
  if (saved > 0) { state.contributions.push({ goalName: name, amount: saved, ts: Date.now() }); saveContributions(); }
  saveGoals();
  closeNewGoal();
  renderGoals();
  showToast(tt('goal_created'));
  recordActivity();
  renderStreak();
  scheduleAutoPush();
}
function addMoney(i) {
  const amount = prompt('How much did you save?');
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return;
  state.goals[i].saved += num;
  if (state.goals[i].saved > state.goals[i].target) state.goals[i].saved = state.goals[i].target;
  state.contributions.push({ goalName: state.goals[i].name, amount: num, ts: Date.now() });
  saveContributions();
  saveGoals();
  renderGoals();
  showToast('+' + fmt(num));
  recordActivity();
  renderStreak();
  scheduleAutoPush();
}
function deleteGoal(i) {
  if (!confirm('Delete this goal?')) return;
  state.goals.splice(i, 1);
  saveGoals();
  renderGoals();
  showToast(tt('goal_deleted'));
  scheduleAutoPush();
}

// ============ SHARE AS IMAGE ============
function shareDecisionImage() {
  if (!lastDecision) return;
  const d = lastDecision;
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#141a2b';
  for (let x = 60; x < W; x += 60) for (let y = 60; y < H; y += 60) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); }
  let accent = '#22d3ee', emoji = '→';
  if (d.result === 'yes') { accent = '#10b981'; emoji = '✓'; }
  else if (d.result === 'no') { accent = '#f43f5e'; emoji = '✕'; }
  else { accent = '#f59e0b'; emoji = '⚠'; }
  ctx.fillStyle = accent; ctx.fillRect(60, 200, 8, 900);
  ctx.fillStyle = '#22d3ee'; ctx.font = '700 42px -apple-system, "Inter", sans-serif'; ctx.fillText('SmartSaver', 100, 140);
  ctx.fillStyle = '#5c6580'; ctx.font = '500 24px -apple-system, "Inter", sans-serif'; ctx.fillText('Money decision check', 100, 180);
  ctx.font = '700 72px -apple-system, "Inter", sans-serif'; ctx.fillStyle = accent; ctx.fillText(emoji + '  ' + d.verdict, 120, 320);
  ctx.fillStyle = '#8b95ab'; ctx.font = '500 26px -apple-system, "Inter", sans-serif'; ctx.fillText('PURCHASE', 120, 420);
  ctx.fillStyle = '#f5f7fa'; ctx.font = '700 48px -apple-system, "Inter", sans-serif';
  let itemName = d.name.length > 22 ? d.name.slice(0, 20) + '…' : d.name;
  ctx.fillText(itemName, 120, 480);
  ctx.fillStyle = '#8b95ab'; ctx.font = '500 26px -apple-system, "Inter", sans-serif'; ctx.fillText('PRICE', 120, 570);
  ctx.fillStyle = '#f5f7fa'; ctx.font = '700 56px -apple-system, "Inter", sans-serif'; ctx.fillText(fmt(d.price), 120, 640);
  ctx.strokeStyle = '#232a3d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(120, 700); ctx.lineTo(W - 120, 700); ctx.stroke();
  ctx.fillStyle = '#8b95ab'; ctx.font = '500 26px -apple-system, "Inter", sans-serif'; ctx.fillText('AFTER PURCHASE', 120, 770);
  ctx.fillStyle = '#f5f7fa'; ctx.font = '700 46px -apple-system, "Inter", sans-serif'; ctx.fillText(fmt(d.balance - d.price), 120, 830);
  ctx.fillStyle = '#8b95ab'; ctx.font = '500 26px -apple-system, "Inter", sans-serif'; ctx.fillText('MONTHLY BUFFER', 120, 910);
  ctx.fillStyle = '#f5f7fa'; ctx.font = '700 46px -apple-system, "Inter", sans-serif'; ctx.fillText(fmt(d.income - d.expenses), 120, 970);
  ctx.fillStyle = accent; ctx.font = '700 32px -apple-system, "Inter", sans-serif'; ctx.fillText('smartsaver.pages.dev', 120, 1180);
  ctx.fillStyle = '#5c6580'; ctx.font = '500 22px -apple-system, "Inter", sans-serif'; ctx.fillText('Before you decide, ask SmartSaver.', 120, 1220);
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(W - 100, 130, 20, 0, Math.PI * 2); ctx.fill();
  canvas.toBlob(function(blob) {
    if (!blob) { showToast('Could not generate image'); return; }
    const file = new File([blob], 'smartsaver-decision.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'SmartSaver', text: d.verdict + ' — ' + d.name }).catch(() => {});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'smartsaver-decision.png'; a.click();
      URL.revokeObjectURL(url);
      showToast('Image downloaded');
    }
  }, 'image/png');
}

// ============ INIT ============
function startApp() {
  document.getElementById('nav').classList.add('active');
  armBackButton();
  initDeepLinkHandler();
  goTo('home');
  checkAuth();
  handleAuthQuery();
  setTimeout(() => {
    state.lastSeenAt = Date.now();
    localStorage.setItem('ss_lastSeenAt', state.lastSeenAt.toString());
  }, 2000);
}
function init() {
  applyTheme();
  applyTranslations();
  buildCurrencyGrid();
  buildInterestGrid();
  initOnboarding();
  if (state.onboarded) {
    document.querySelectorAll('.onboard').forEach(o => o.classList.remove('active'));
    startApp();
  }
}
init();

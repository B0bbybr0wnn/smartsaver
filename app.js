// ============ STATE ============
const state = {
  currency: localStorage.getItem('ss_currency') || 'USD',
  interests: JSON.parse(localStorage.getItem('ss_interests') || '[]'),
  onboarded: localStorage.getItem('ss_onboarded') === 'true',
  snapshot: JSON.parse(localStorage.getItem('ss_snapshot') || 'null'),
  goals: JSON.parse(localStorage.getItem('ss_goals') || '[]'),
  decisions: JSON.parse(localStorage.getItem('ss_decisions') || '[]'),
  contributions: JSON.parse(localStorage.getItem('ss_contributions') || '[]'),
  spends: JSON.parse(localStorage.getItem('ss_spends') || '[]'),
  templates: JSON.parse(localStorage.getItem('ss_templates') || '[]'),
  streak: JSON.parse(localStorage.getItem('ss_streak') || '{"current":0,"longest":0,"lastDay":null}')
};

const CURRENCIES = [
  { code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' }, { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' }, { code: 'CNY', symbol: '¥' }, { code: 'INR', symbol: '₹' },
  { code: 'NGN', symbol: '₦' }, { code: 'CAD', symbol: 'C$' }, { code: 'AUD', symbol: 'A$' },
  { code: 'AED', symbol: 'د.إ' }, { code: 'CHF', symbol: 'Fr' }, { code: 'SEK', symbol: 'kr' },
  { code: 'ZAR', symbol: 'R' }, { code: 'KES', symbol: 'KSh' }, { code: 'GHS', symbol: 'GH₵' },
  { code: 'BRL', symbol: 'R$' }, { code: 'MXN', symbol: 'MX$' }, { code: 'PHP', symbol: '₱' },
  { code: 'SGD', symbol: 'S$' }
];

const INTERESTS = [
  'Saving money', 'Managing my budget', 'Making better spending decisions',
  'Paying off debt', 'Building an emergency fund', 'Tracking my financial goals'
];

const INTEREST_ACTIONS = {
  'Saving money': { title: 'Start a savings goal', desc: 'Set a target and track your progress.', icon: 'target', go: 'save' },
  'Managing my budget': { title: 'Try the budget calculator', desc: 'Plan income, needs, wants and savings.', icon: 'chart', go: 'tools-budget' },
  'Making better spending decisions': { title: 'Check a purchase', desc: 'Before you buy, see if you can afford it.', icon: 'search', go: 'decide' },
  'Paying off debt': { title: 'Calculate debt payoff', desc: 'See how long until you are debt-free.', icon: 'trend', go: 'tools-debt' },
  'Building an emergency fund': { title: 'Plan your emergency fund', desc: 'See how much you need for 1-12 months.', icon: 'shield', go: 'tools-emergency' },
  'Tracking my financial goals': { title: 'Set a new goal', desc: 'Track every goal in one place.', icon: 'target', go: 'save' }
};

function getSymbol() {
  const c = CURRENCIES.find(x => x.code === state.currency);
  return c ? c.symbol : '';
}
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
function last7Days() { return Date.now() - WEEK_MS; }

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
  if (state.streak.lastDay === yesterdayKey()) {
    state.streak.current += 1;
  } else {
    state.streak.current = 1;
  }
  state.streak.lastDay = today;
  if (state.streak.current > state.streak.longest) {
    state.streak.longest = state.streak.current;
  }
  saveStreak();
}
function currentStreak() {
  const today = todayKey();
  const yest = yesterdayKey();
  if (state.streak.lastDay === today || state.streak.lastDay === yest) {
    return state.streak.current;
  }
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
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============ ICONS ============
function icon(name, size) {
  size = size || 20;
  const icons = {
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    spark: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
  };
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
}

// ============ ONBOARDING ============
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
    chip.textContent = i;
    chip.onclick = () => chip.classList.toggle('selected');
    grid.appendChild(chip);
  });
}

function initOnboarding() {
  const cNext = document.getElementById('currency-next');
  const iNext = document.getElementById('interest-next');
  if (cNext) cNext.onclick = () => {
    localStorage.setItem('ss_currency', state.currency);
    document.getElementById('onboard-1').classList.remove('active');
    document.getElementById('onboard-2').classList.add('active');
  };
  if (iNext) iNext.onclick = () => {
    const selected = Array.from(document.querySelectorAll('#interest-grid .chip.selected')).map(c => c.textContent);
    localStorage.setItem('ss_interests', JSON.stringify(selected));
    localStorage.setItem('ss_onboarded', 'true');
    state.onboarded = true;
    state.interests = selected;
    document.getElementById('onboard-2').classList.remove('active');
    startApp();
  };
}

// ============ NAV ============
let currentTab = 'home';

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
  if (tab === 'more') renderMore();
  if (tab === 'decide') renderTemplates();
}

function goToAction(action) {
  if (action.startsWith('tools-')) {
    const tool = action.split('-')[1];
    goTo('tools');
    const sel = document.getElementById('tool-select');
    if (sel) { sel.value = tool; toolSwitch(tool); }
  } else {
    goTo(action);
  }
}

// ============ ANDROID BACK BUTTON ============
window.addEventListener('popstate', () => {
  const goalForm = document.getElementById('goal-form');
  if (goalForm && goalForm.classList.contains('active')) {
    closeNewGoal();
    history.pushState({ page: 'app' }, '');
    return;
  }
  if (currentTab !== 'home') {
    goTo('home');
    history.pushState({ page: 'app' }, '');
    return;
  }
  if (confirm('Exit SmartSaver?')) {
    history.back();
  } else {
    history.pushState({ page: 'app' }, '');
  }
});

function armBackButton() {
  history.pushState({ page: 'app' }, '');
}

// ============ HOME ============
function refreshHome() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
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
  renderToday();
  renderThisWeek();
  renderHomeForYou();
  renderHomeGoals();
  renderHomeDecisions();
}

// ============ TODAY (DAILY JOURNAL) ============
function renderToday() {
  const el = document.getElementById('today-total');
  if (!el) return;
  const today = todayKey();
  const todaySpends = state.spends.filter(s => s.dayKey === today);
  const total = todaySpends.reduce((sum, s) => sum + s.amount, 0);
  if (todaySpends.length === 0) {
    el.innerHTML = 'Spent today: <b style="color:var(--text);">—</b>';
  } else {
    el.innerHTML = 'Spent today: <b style="color:var(--text);">' + fmt(total) + '</b> (' + todaySpends.length + ' item' + (todaySpends.length > 1 ? 's' : '') + ')';
  }
}

function logSpend() {
  const amountEl = document.getElementById('spend-input');
  const noteEl = document.getElementById('spend-note');
  const amount = parseFloat(amountEl.value) || 0;
  const note = (noteEl.value || '').trim();
  if (amount <= 0) { showToast('Enter an amount'); return; }
  state.spends.unshift({ amount, note, ts: Date.now(), dayKey: todayKey() });
  if (state.spends.length > 200) state.spends = state.spends.slice(0, 200);
  saveSpends();
  amountEl.value = '';
  noteEl.value = '';
  renderToday();
  showToast('Logged ' + fmt(amount));
  recordActivity();
}

// ============ THIS WEEK ============
function renderThisWeek() {
  const card = document.getElementById('home-week-card');
  const statsEl = document.getElementById('home-week-stats');
  const sugEl = document.getElementById('home-week-suggestions');
  const forYouCard = document.getElementById('home-foryou-card');
  const streakBadge = document.getElementById('week-streak');
  if (!card || !statsEl || !sugEl) return;

  const since = last7Days();
  const weekDecisions = state.decisions.filter(d => (d.ts || 0) >= since);
  const weekContribs = state.contributions.filter(c => (c.ts || 0) >= since);
  const weekSpends = state.spends.filter(s => (s.ts || 0) >= since);
  const weekAdded = weekContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const weekSpent = weekSpends.reduce((sum, s) => sum + (s.amount || 0), 0);

  const hasAnyData = state.decisions.length + state.contributions.length + state.goals.length + state.spends.length > 0;
  if (!hasAnyData) {
    card.style.display = 'none';
    if (forYouCard) forYouCard.style.display = 'block';
    return;
  }
  card.style.display = 'block';
  if (forYouCard) forYouCard.style.display = 'none';

  if (streakBadge) {
    const streak = currentStreak();
    if (streak >= 2) {
      streakBadge.style.display = 'flex';
      streakBadge.innerHTML = icon('flame', 14) + '<span style="font-variant-numeric:tabular-nums;">' + streak + '-day</span>';
    } else {
      streakBadge.style.display = 'none';
    }
  }

  const stats = [];
  if (weekDecisions.length > 0) stats.push('<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:var(--text-dim);">Decisions logged</span><span style="font-size:14px;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums;">' + weekDecisions.length + '</span></div>');
  if (weekContribs.length > 0) stats.push('<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:var(--text-dim);">Added to goals</span><span style="font-size:14px;font-weight:600;color:var(--accent);font-variant-numeric:tabular-nums;">' + fmt(weekAdded) + '</span></div>');
  if (weekSpends.length > 0) stats.push('<div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;color:var(--text-dim);">Spent this week</span><span style="font-size:14px;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums;">' + fmt(weekSpent) + '</span></div>');

  if (stats.length === 0) {
    statsEl.innerHTML = '<div style="font-size:13px;color:var(--text-mute);padding:8px 0;line-height:1.5;">Nothing logged this week yet. Check a purchase or add money to a goal to see your weekly summary.</div>';
  } else {
    statsEl.innerHTML = stats.join('');
  }

  const suggestions = generateSuggestions(weekDecisions, weekContribs, weekAdded, weekSpends, weekSpent);
  if (suggestions.length === 0) {
    sugEl.innerHTML = '';
    sugEl.style.display = 'none';
  } else {
    sugEl.style.display = 'block';
    sugEl.innerHTML = '<div style="font-size:11px;color:var(--text-mute);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin:16px 0 10px;">Suggestions</div>' +
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
        s.push('To hit <b>' + g.name + '</b> by your target date, save about <b>' + fmt(Math.ceil(weeklyNeed)) + ' per week.</b>');
      }
      if (pace > 0 && remaining > 0) {
        const monthsLeft = Math.ceil(remaining / pace);
        const finishDate = new Date(now + monthsLeft * 30 * 24 * 60 * 60 * 1000);
        const monthName = finishDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
        s.push('At your current pace, you\'ll reach <b>' + g.name + '</b> around <b>' + monthName + '</b>.');
      }
    }
  }

  if (state.snapshot) {
    const buffer = (state.snapshot.income || 0) - (state.snapshot.expenses || 0);
    if (buffer > 0) {
      s.push('Your monthly buffer is <b>' + fmt(buffer) + '</b>. Consider putting half into a savings goal.');
    } else if (buffer < 0) {
      s.push('Your monthly expenses exceed income by <b>' + fmt(Math.abs(buffer)) + '</b>. Try trimming one category.');
    }
  }

  // Spend comparison (this week vs prev week)
  if (weekSpent > 0) {
    const prevStart = now - 2 * WEEK_MS;
    const prevEnd = now - WEEK_MS;
    const prevSpends = state.spends.filter(sp => (sp.ts || 0) >= prevStart && (sp.ts || 0) < prevEnd);
    const prevSpent = prevSpends.reduce((sum, sp) => sum + sp.amount, 0);
    if (prevSpent > 0) {
      const diff = weekSpent - prevSpent;
      if (diff > 0) {
        s.push('You spent <b>' + fmt(diff) + ' more</b> this week than last week.');
      } else if (diff < 0) {
        s.push('Nice — you spent <b>' + fmt(Math.abs(diff)) + ' less</b> this week than last week.');
      }
    }
  }

  const lastDecision = state.decisions[0];
  const lastContrib = state.contributions.length > 0 ? state.contributions[state.contributions.length - 1] : null;
  const lastSpend = state.spends.length > 0 ? state.spends[0] : null;
  const lastActivity = Math.max(
    lastDecision ? (lastDecision.ts || 0) : 0,
    lastContrib ? (lastContrib.ts || 0) : 0,
    lastSpend ? (lastSpend.ts || 0) : 0
  );
  if (lastActivity > 0) {
    const daysSince = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
    if (daysSince >= 3 && daysSince < 30) {
      s.push('You haven\'t logged anything in <b>' + daysSince + ' days</b>. Log a spend or check a purchase.');
    }
  }

  if (weekAdded > 0 && weekContribs.length >= 2) {
    s.push('Nice work — you\'ve added money to your goals <b>' + weekContribs.length + ' times</b> this week.');
  }

  return s.slice(0, 3);
}

function renderHomeForYou() {
  const el = document.getElementById('home-foryou');
  const card = document.getElementById('home-foryou-card');
  if (!el || !card) return;

  if (state.interests.length === 0) {
    card.style.display = 'none';
    return;
  }

  const actions = state.interests.map(i => INTEREST_ACTIONS[i]).filter(Boolean).slice(0, 3);

  el.innerHTML = actions.map(a => {
    return '<button onclick="goToAction(\'' + a.go + '\')" style="width:100%;text-align:left;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;font-family:inherit;cursor:pointer;transition:all 0.15s ease;">' +
      '<div style="color:var(--accent);flex-shrink:0;">' + icon(a.icon, 22) + '</div>' +
      '<div style="flex:1;">' +
        '<div style="font-size:14px;font-weight:600;color:var(--text);letter-spacing:-0.01em;margin-bottom:3px;">' + a.title + '</div>' +
        '<div style="font-size:12px;color:var(--text-mute);line-height:1.4;">' + a.desc + '</div>' +
      '</div>' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
    '</button>';
  }).join('');
}

function renderHomeGoals() {
  const el = document.getElementById('home-goals');
  if (!el) return;
  if (state.goals.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>No goals yet. Start one to track your progress.</div>';
    return;
  }
  el.innerHTML = state.goals.slice(0, 3).map(g => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    return '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:14px;font-weight:600;">' + g.name + '</span><span style="font-size:13px;color:var(--text-dim);font-variant-numeric:tabular-nums;">' + pct + '%</span></div><div class="progress"><div class="progress-fill" style="width:' + pct + '%;"></div></div><div style="font-size:12px;color:var(--text-dim);margin-top:8px;font-variant-numeric:tabular-nums;">' + fmt(g.saved) + ' of ' + fmt(g.target) + '</div></div>';
  }).join('');
}

function renderHomeDecisions() {
  const el = document.getElementById('home-decisions');
  if (!el) return;
  if (state.decisions.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg></div>No decisions yet. Try the affordability check.</div>';
    return;
  }
  el.innerHTML = state.decisions.slice(0, 3).map(d => {
    const color = d.result === 'yes' ? 'var(--good)' : d.result === 'no' ? 'var(--bad)' : 'var(--accent)';
    return '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-soft);"><div><div style="font-size:14px;font-weight:600;">' + d.name + '</div><div style="font-size:12px;color:var(--text-mute);margin-top:3px;">' + d.date + '</div></div><div style="font-size:13px;color:' + color + ';font-weight:600;">' + d.verdict + '</div></div>';
  }).join('');
}

// ============ MORE ============
function renderMore() {
  const cEl = document.getElementById('more-currency');
  const iEl = document.getElementById('more-interests');
  const gcEl = document.getElementById('more-goals-count');
  const dcEl = document.getElementById('more-decisions-count');
  const skEl = document.getElementById('more-streak');
  if (cEl) cEl.textContent = state.currency;
  if (iEl) {
    if (state.interests.length === 0) iEl.textContent = '—';
    else iEl.textContent = state.interests.length + ' selected';
  }
  if (gcEl) gcEl.textContent = state.goals.length;
  if (dcEl) dcEl.textContent = state.decisions.length;
  if (skEl) skEl.textContent = currentStreak();
}

function exportData() {
  const data = {
    goals: state.goals, decisions: state.decisions, contributions: state.contributions,
    spends: state.spends, templates: state.templates,
    snapshot: state.snapshot, currency: state.currency, interests: state.interests,
    streak: state.streak, exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smartsaver-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup downloaded');
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
      if (data.streak) { state.streak = data.streak; saveStreak(); }
      showToast('Data imported');
      renderMore();
    } catch (err) {
      showToast('Could not read that file');
    }
  };
  reader.readAsText(file);
}

function resetApp() {
  if (!confirm('This will erase all your goals, decisions and settings. Continue?')) return;
  localStorage.clear();
  location.reload();
}

// ============ DECIDE ============
let lastDecision = null;

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
    verdict.textContent = 'Enter your numbers';
    explanation.textContent = 'Fill in the price and balance so I can help.';
    if (actions) actions.style.display = 'none';
    return;
  }

  state.snapshot = { balance, income, expenses };
  localStorage.setItem('ss_snapshot', JSON.stringify(state.snapshot));

  const leftover = income - expenses;
  const afterPurchase = balance - price;
  const monthlyBuffer = leftover > 0 ? leftover : 0;

  result.className = 'result show';
  let verdictText, resultType;

  if (price > balance) {
    result.className = 'result show no';
    verdictText = 'Not yet';
    resultType = 'no';
    explanation.innerHTML = 'Buying <b>' + name + '</b> for <span class="big">' + fmt(price) + '</span> is more than your balance of ' + fmt(balance) + '.<br><br>You are short by <b>' + fmt(price - balance) + '</b>. Save for that first.';
  } else if (afterPurchase < monthlyBuffer) {
    result.className = 'result show no';
    verdictText = 'Risky';
    resultType = 'risky';
    explanation.innerHTML = 'You can buy <b>' + name + '</b>, but after paying ' + fmt(price) + ' you would have only <b>' + fmt(afterPurchase) + '</b> left.<br><br>Your monthly buffer is ' + fmt(monthlyBuffer) + '. Give it one more month.';
  } else {
    result.className = 'result show yes';
    verdictText = 'Yes, you can';
    resultType = 'yes';
    explanation.innerHTML = 'After buying <b>' + name + '</b> for ' + fmt(price) + ', you will still have <b>' + fmt(afterPurchase) + '</b> above your monthly buffer of ' + fmt(monthlyBuffer) + '.<br><br>Go ahead, but log it.';
  }

  verdict.textContent = verdictText;
  lastDecision = { name, price, balance, income, expenses, verdict: verdictText, result: resultType, date: new Date().toLocaleDateString(), ts: Date.now() };

  if (actions) {
    actions.style.display = 'flex';
    const saveBtn = document.getElementById('save-decision-btn');
    if (saveBtn) { saveBtn.textContent = 'Save this decision'; saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
  }
  recordActivity();
}

function saveDecision() {
  if (!lastDecision) return;
  state.decisions.unshift(lastDecision);
  if (state.decisions.length > 50) state.decisions = state.decisions.slice(0, 50);
  saveDecisions();
  const btn = document.getElementById('save-decision-btn');
  if (btn) { btn.textContent = 'Saved'; btn.disabled = true; btn.style.opacity = '0.5'; }
  showToast('Decision saved');
}

// ============ TEMPLATES ============
function renderTemplates() {
  const card = document.getElementById('templates-card');
  const chips = document.getElementById('templates-chips');
  if (!card || !chips) return;
  if (state.templates.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';
  chips.innerHTML = state.templates.map((t, i) => {
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:8px 12px 8px 14px;font-size:13px;color:var(--text);font-weight:500;">' +
      '<span onclick="loadTemplate(' + i + ')" style="cursor:pointer;">' + t.name + '</span>' +
      '<span onclick="deleteTemplate(' + i + ')" style="cursor:pointer;color:var(--text-mute);display:flex;align-items:center;">' + icon('close', 14) + '</span>' +
    '</div>';
  }).join('');
}

function saveAsTemplate() {
  if (!lastDecision) return;
  const name = prompt('Name this template:', lastDecision.name);
  if (!name || !name.trim()) return;
  state.templates.push({
    name: name.trim(),
    itemName: lastDecision.name,
    price: lastDecision.price,
    balance: lastDecision.balance,
    income: lastDecision.income,
    expenses: lastDecision.expenses
  });
  if (state.templates.length > 12) state.templates = state.templates.slice(-12);
  saveTemplates();
  renderTemplates();
  showToast('Template saved');
}

function loadTemplate(i) {
  const t = state.templates[i];
  if (!t) return;
  document.getElementById('itemName').value = t.itemName || '';
  document.getElementById('price').value = t.price || '';
  document.getElementById('balance').value = t.balance || '';
  document.getElementById('income').value = t.income || '';
  document.getElementById('expenses').value = t.expenses || '';
  document.getElementById('result').className = 'result';
  document.getElementById('decision-actions').style.display = 'none';
  showToast('Loaded ' + t.name);
}

function deleteTemplate(i) {
  if (!confirm('Delete this template?')) return;
  state.templates.splice(i, 1);
  saveTemplates();
  renderTemplates();
  showToast('Template deleted');
}

// ============ SAVINGS GOALS ============
function renderGoals() {
  const el = document.getElementById('goals-list');
  if (!el) return;
  if (state.goals.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>No goals yet. Tap below to start one.</div>';
    return;
  }
  el.innerHTML = state.goals.map((g, i) => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    const remaining = g.target - g.saved;
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;"><div><div style="font-size:16px;font-weight:700;letter-spacing:-0.02em;">' + g.name + '</div><div style="font-size:12px;color:var(--text-mute);margin-top:4px;">' + (g.targetDate || 'No target date') + '</div></div><div style="font-size:20px;font-weight:700;color:var(--accent);letter-spacing:-0.03em;font-variant-numeric:tabular-nums;">' + pct + '%</div></div><div class="progress" style="margin-bottom:12px;"><div class="progress-fill" style="width:' + pct + '%;"></div></div><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-dim);margin-bottom:14px;font-variant-numeric:tabular-nums;"><span>' + fmt(g.saved) + ' saved</span><span>' + fmt(remaining) + ' to go</span></div><div style="display:flex;gap:8px;"><button onclick="addMoney(' + i + ')" style="flex:1;padding:10px;font-size:13px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--accent);font-weight:600;font-family:inherit;cursor:pointer;">Add money</button><button onclick="deleteGoal(' + i + ')" style="padding:10px 14px;font-size:13px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--bad);font-weight:600;font-family:inherit;cursor:pointer;">Delete</button></div></div>';
  }).join('');
}

function openNewGoal() {
  document.getElementById('goal-form').classList.add('active');
  history.pushState({ page: 'goal-form' }, '');
}
function closeNewGoal() {
  document.getElementById('goal-form').classList.remove('active');
  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalSaved').value = '';
  document.getElementById('goalDate').value = '';
}
function saveGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value) || 0;
  const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
  const date = document.getElementById('goalDate').value;
  if (!name || target <= 0) { showToast('Enter a name and target amount'); return; }
  state.goals.push({ name, target, saved, targetDate: date, createdAt: Date.now() });
  if (saved > 0) {
    state.contributions.push({ goalName: name, amount: saved, ts: Date.now(), note: 'Initial' });
    saveContributions();
  }
  saveGoals();
  closeNewGoal();
  renderGoals();
  showToast('Goal created');
  recordActivity();
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
  showToast('Added ' + fmt(num));
  recordActivity();
}
function deleteGoal(i) {
  if (!confirm('Delete this goal?')) return;
  state.goals.splice(i, 1);
  saveGoals();
  renderGoals();
  showToast('Goal deleted');
}

// ============ TOOLS ============
function toolSwitch(tool) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('tool-' + tool);
  if (panel) panel.classList.add('active');
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
  if (!target || !monthly) { showToolResult('ts-out', '<p>Enter a target and monthly saving amount.</p>'); return; }
  const remaining = Math.max(0, target - current);
  const months = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
  showToolResult('ts-out', '<p>You need <b>' + fmt(remaining) + '</b> more.<br>At <b>' + fmt(monthly) + '</b>/month, you will reach it in <b>' + months + ' months</b>.</p>');
}
function calcBudget() {
  const income = parseFloat(document.getElementById('tb-income').value) || 0;
  const needs = parseFloat(document.getElementById('tb-needs').value) || 0;
  const wants = parseFloat(document.getElementById('tb-wants').value) || 0;
  const savings = parseFloat(document.getElementById('tb-savings').value) || 0;
  if (!income) { showToolResult('tb-out', '<p>Enter your monthly income first.</p>'); return; }
  const total = needs + wants + savings;
  const left = income - total;
  showToolResult('tb-out', '<p>Total allocated: <b>' + fmt(total) + '</b><br>Income: <b>' + fmt(income) + '</b><br><b style="color:' + (left >= 0 ? 'var(--good)' : 'var(--bad)') + ';">' + (left >= 0 ? 'Left over: ' : 'Over budget by: ') + fmt(Math.abs(left)) + '</b></p>');
}
function calcDebt() {
  const debt = parseFloat(document.getElementById('td-debt').value) || 0;
  const rate = parseFloat(document.getElementById('td-rate').value) || 0;
  const payment = parseFloat(document.getElementById('td-payment').value) || 0;
  if (!debt || !payment) { showToolResult('td-out', '<p>Enter the debt amount and monthly payment.</p>'); return; }
  const monthlyRate = (rate / 100) / 12;
  if (payment <= debt * monthlyRate) { showToolResult('td-out', '<p style="color:var(--bad);">Your payment is too low to ever pay off the debt. Increase it.</p>'); return; }
  let balance = debt, months = 0, totalInterest = 0;
  while (balance > 0 && months < 600) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance = balance + interest - payment;
    months++;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const timeStr = years > 0 ? (years + 'y ' + rem + 'm') : (months + ' months');
  showToolResult('td-out', '<p>Payoff time: <b>' + timeStr + '</b><br>Total interest: <b>' + fmt(totalInterest.toFixed(2)) + '</b><br>Total paid: <b>' + fmt((debt + totalInterest).toFixed(2)) + '</b></p>');
}
function calcDiscount() {
  const price = parseFloat(document.getElementById('tDisc-price').value) || 0;
  const disc = parseFloat(document.getElementById('tDisc-disc').value) || 0;
  if (!price || !disc) { showToolResult('tDisc-out', '<p>Enter price and discount percent.</p>'); return; }
  const save = price * (disc / 100);
  const final = price - save;
  showToolResult('tDisc-out', '<p>You save <b>' + fmt(save.toFixed(2)) + '</b><br>Final price: <b style="color:var(--good);">' + fmt(final.toFixed(2)) + '</b></p>');
}
function calcPercent() {
  const a = parseFloat(document.getElementById('tp-a').value) || 0;
  const b = parseFloat(document.getElementById('tp-b').value) || 0;
  if (!a || !b) { showToolResult('tp-out', '<p>Enter both numbers.</p>'); return; }
  const pct = (a / b) * 100;
  showToolResult('tp-out', '<p><b>' + a + '</b> is <b>' + pct.toFixed(1) + '%</b> of <b>' + b + '</b>.</p>');
}
function calcEmergency() {
  const essentials = parseFloat(document.getElementById('te-ess').value) || 0;
  if (!essentials) { showToolResult('te-out', '<p>Enter your monthly essentials.</p>'); return; }
  showToolResult('te-out', '<p>Planning targets:</p><p>1 month: <b>' + fmt(essentials) + '</b><br>3 months: <b>' + fmt(essentials * 3) + '</b><br>6 months: <b>' + fmt(essentials * 6) + '</b><br>12 months: <b>' + fmt(essentials * 12) + '</b></p><p style="font-size:12px;color:var(--text-mute);margin-top:12px;">These are planning calculations, not personalized financial advice.</p>');
}
function calcTip() {
  const bill = parseFloat(document.getElementById('tt-bill').value) || 0;
  const tip = parseFloat(document.getElementById('tt-tip').value) || 0;
  if (!bill) { showToolResult('tt-out', '<p>Enter the bill amount.</p>'); return; }
  const tipAmt = bill * (tip / 100);
  const total = bill + tipAmt;
  showToolResult('tt-out', '<p>Tip: <b>' + fmt(tipAmt.toFixed(2)) + '</b><br>Total: <b>' + fmt(total.toFixed(2)) + '</b></p>');
}
function calcConvert() {
  const amt = parseFloat(document.getElementById('tc-amt').value) || 0;
  const rate = parseFloat(document.getElementById('tc-rate').value) || 0;
  if (!amt || !rate) { showToolResult('tc-out', '<p>Enter the amount and exchange rate.</p>'); return; }
  showToolResult('tc-out', '<p>Result: <b>' + (amt * rate).toLocaleString(undefined, { maximumFractionDigits: 2 }) + '</b></p><p style="font-size:12px;color:var(--text-mute);margin-top:12px;">Enter the current exchange rate manually for accuracy.</p>');
}

// ============ INIT ============
function startApp() {
  document.getElementById('nav').classList.add('active');
  armBackButton();
  goTo('home');
}
function init() {
  buildCurrencyGrid();
  buildInterestGrid();
  initOnboarding();
  if (state.onboarded) {
    document.querySelectorAll('.onboard').forEach(o => o.classList.remove('active'));
    startApp();
  }
}
init();

// ============ STATE ============
const state = {
  currency: localStorage.getItem('ss_currency') || 'USD',
  interests: JSON.parse(localStorage.getItem('ss_interests') || '[]'),
  onboarded: localStorage.getItem('ss_onboarded') === 'true',
  snapshot: JSON.parse(localStorage.getItem('ss_snapshot') || 'null'),
  goals: JSON.parse(localStorage.getItem('ss_goals') || '[]')
};

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CNY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
  { code: 'NGN', symbol: '₦' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'CHF', symbol: 'Fr' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'KES', symbol: 'KSh' },
  { code: 'GHS', symbol: 'GH₵' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'MXN', symbol: 'MX$' },
  { code: 'PHP', symbol: '₱' },
  { code: 'SGD', symbol: 'S$' }
];

const INTERESTS = [
  'Saving money',
  'Managing my budget',
  'Making better spending decisions',
  'Paying off debt',
  'Building an emergency fund',
  'Tracking my financial goals'
];

function getSymbol() {
  const c = CURRENCIES.find(x => x.code === state.currency);
  return c ? c.symbol : '';
}

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return getSymbol() + Number(n).toLocaleString();
}

function saveState() {
  localStorage.setItem('ss_goals', JSON.stringify(state.goals));
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
    chip.className = 'chip';
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
    document.getElementById('onboard-2').classList.remove('active');
    startApp();
  };
}

// ============ NAV ============
function goTo(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const screen = document.getElementById('screen-' + tab);
  if (screen) screen.classList.add('active');
  const navBtn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
  if (navBtn) navBtn.classList.add('active');
  if (tab === 'home') refreshHome();
  if (tab === 'save') renderGoals();
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

  renderHomeGoals();
}

function renderHomeGoals() {
  const el = document.getElementById('home-goals');
  if (!el) return;
  if (state.goals.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>No goals yet. Start one to track your progress.</div>';
    return;
  }
  el.innerHTML = state.goals.slice(0, 3).map(g => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:14px;font-weight:600;">' + g.name + '</span><span style="font-size:13px;color:#94a3b8;">' + pct + '%</span></div><div style="height:6px;background:#0f172a;border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:#38bdf8;border-radius:3px;"></div></div><div style="font-size:12px;color:#94a3b8;margin-top:6px;">' + fmt(g.saved) + ' of ' + fmt(g.target) + '</div></div>';
  }).join('');
}

// ============ DECIDE ============
function checkAffordability() {
  const name = document.getElementById('itemName').value || 'this';
  const price = parseFloat(document.getElementById('price').value) || 0;
  const balance = parseFloat(document.getElementById('balance').value) || 0;
  const income = parseFloat(document.getElementById('income').value) || 0;
  const expenses = parseFloat(document.getElementById('expenses').value) || 0;
  const result = document.getElementById('result');
  const verdict = document.getElementById('verdict');
  const explanation = document.getElementById('explanation');

  if (price <= 0 || balance <= 0) {
    result.className = 'result show';
    verdict.textContent = 'Enter your numbers';
    explanation.textContent = 'Fill in the price and balance so I can help.';
    return;
  }

  state.snapshot = { balance, income, expenses };
  localStorage.setItem('ss_snapshot', JSON.stringify(state.snapshot));

  const leftover = income - expenses;
  const afterPurchase = balance - price;
  const monthlyBuffer = leftover > 0 ? leftover : 0;

  result.className = 'result show';

  if (price > balance) {
    result.className = 'result show no';
    verdict.textContent = 'Not yet';
    explanation.innerHTML = 'Buying <b>' + name + '</b> for <span class="big">' + fmt(price) + '</span> is more than your balance of ' + fmt(balance) + '.<br><br>You are short by <b>' + fmt(price - balance) + '</b>. Save for that first.';
  } else if (afterPurchase < monthlyBuffer) {
    result.className = 'result show no';
    verdict.textContent = 'Risky';
    explanation.innerHTML = 'You can buy <b>' + name + '</b>, but after paying ' + fmt(price) + ' you would have only <b>' + fmt(afterPurchase) + '</b> left.<br><br>Your monthly buffer is ' + fmt(monthlyBuffer) + '. Give it one more month.';
  } else {
    result.className = 'result show yes';
    verdict.textContent = 'Yes, you can';
    explanation.innerHTML = 'After buying <b>' + name + '</b> for ' + fmt(price) + ', you will still have <b>' + fmt(afterPurchase) + '</b> above your monthly buffer of ' + fmt(monthlyBuffer) + '.<br><br>Go ahead, but log it.';
  }
}

// ============ SAVINGS GOALS ============
function renderGoals() {
  const el = document.getElementById('goals-list');
  if (!el) return;
  if (state.goals.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>No goals yet. Tap below to start one.</div>';
    return;
  }
  el.innerHTML = state.goals.map((g, i) => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    const remaining = g.target - g.saved;
    return '<div class="card" style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;"><div><div style="font-size:16px;font-weight:700;">' + g.name + '</div><div style="font-size:12px;color:#94a3b8;margin-top:2px;">' + (g.targetDate || 'No target date') + '</div></div><div style="font-size:18px;font-weight:700;color:#38bdf8;">' + pct + '%</div></div><div style="height:8px;background:#0f172a;border-radius:4px;overflow:hidden;margin-bottom:10px;"><div style="height:100%;width:' + pct + '%;background:#38bdf8;border-radius:4px;"></div></div><div style="display:flex;justify-content:space-between;font-size:13px;color:#cbd5e1;margin-bottom:10px;"><span>' + fmt(g.saved) + ' saved</span><span>' + fmt(remaining) + ' to go</span></div><div style="display:flex;gap:8px;"><button onclick="addMoney(' + i + ')" style="flex:1;padding:8px;font-size:12px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#38bdf8;font-weight:600;font-family:inherit;">Add money</button><button onclick="deleteGoal(' + i + ')" style="padding:8px 12px;font-size:12px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#ef4444;font-weight:600;font-family:inherit;">Delete</button></div></div>';
  }).join('');
}

function openNewGoal() {
  document.getElementById('goal-form').classList.add('active');
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

  if (!name || target <= 0) {
    alert('Please enter a goal name and target amount.');
    return;
  }

  state.goals.push({ name, target, saved, targetDate: date, createdAt: Date.now() });
  saveState();
  closeNewGoal();
  renderGoals();
}

function addMoney(i) {
  const amount = prompt('How much did you save?');
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return;
  state.goals[i].saved += num;
  if (state.goals[i].saved >= state.goals[i].target) {
    state.goals[i].saved = state.goals[i].target;
  }
  saveState();
  renderGoals();
}

function deleteGoal(i) {
  if (!confirm('Delete this goal?')) return;
  state.goals.splice(i, 1);
  saveState();
  renderGoals();
}

// ============ INIT ============
function startApp() {
  document.getElementById('nav').classList.add('active');
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

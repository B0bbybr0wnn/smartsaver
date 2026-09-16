// ============ STATE ============
const state = {
  currency: localStorage.getItem('ss_currency') || 'USD',
  interests: JSON.parse(localStorage.getItem('ss_interests') || '[]'),
  onboarded: localStorage.getItem('ss_onboarded') === 'true',
  snapshot: JSON.parse(localStorage.getItem('ss_snapshot') || 'null'),
  goals: JSON.parse(localStorage.getItem('ss_goals') || '[]'),
  decisions: JSON.parse(localStorage.getItem('ss_decisions') || '[]')
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
    state.interests = selected;
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
  if (tab === 'more') renderMore();
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
  renderHomeDecisions();
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

function renderHomeDecisions() {
  const el = document.getElementById('home-decisions');
  if (!el) return;
  if (state.decisions.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg></div>No decisions yet. Try the affordability check.</div>';
    return;
  }
  el.innerHTML = state.decisions.slice(0, 3).map(d => {
    const color = d.result === 'yes' ? '#22c55e' : d.result === 'no' ? '#ef4444' : '#38bdf8';
    return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #334155;"><div><div style="font-size:14px;font-weight:600;">' + d.name + '</div><div style="font-size:12px;color:#94a3b8;margin-top:2px;">' + d.date + '</div></div><div style="font-size:14px;color:' + color + ';font-weight:600;">' + d.verdict + '</div></div>';
  }).join('');
}

// ============ MORE ============
function renderMore() {
  const cEl = document.getElementById('more-currency');
  const iEl = document.getElementById('more-interests');
  if (cEl) cEl.textContent = state.currency;
  if (iEl) {
    if (state.interests.length === 0) iEl.textContent = '—';
    else iEl.textContent = state.interests.length + ' selected';
  }
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
  const saveBtn = document.getElementById('save-decision-btn');

  if (price <= 0 || balance <= 0) {
    result.className = 'result show';
    verdict.textContent = 'Enter your numbers';
    explanation.textContent = 'Fill in the price and balance so I can help.';
    if (saveBtn) saveBtn.style.display = 'none';
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
  lastDecision = { name, price, balance, income, expenses, verdict: verdictText, result: resultType, date: new Date().toLocaleDateString() };
  if (saveBtn) {
    saveBtn.style.display = 'block';
    saveBtn.textContent = 'Save this decision';
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
  }
}

function saveDecision() {
  if (!lastDecision) return;
  state.decisions.unshift(lastDecision);
  if (state.decisions.length > 50) state.decisions = state.decisions.slice(0, 50);
  saveDecisions();
  const btn = document.getElementById('save-decision-btn');
  if (btn) { btn.textContent = 'Saved'; btn.disabled = true; btn.style.opacity = '0.5'; }
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

function openNewGoal() { document.getElementById('goal-form').classList.add('active'); }
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
  if (!name || target <= 0) { alert('Please enter a goal name and target amount.'); return; }
  state.goals.push({ name, target, saved, targetDate: date, createdAt: Date.now() });
  saveGoals();
  closeNewGoal();
  renderGoals();
}
function addMoney(i) {
  const amount = prompt('How much did you save?');
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return;
  state.goals[i].saved += num;
  if (state.goals[i].saved > state.goals[i].target) state.goals[i].saved = state.goals[i].target;
  saveGoals();
  renderGoals();
}
function deleteGoal(i) {
  if (!confirm('Delete this goal?')) return;
  state.goals.splice(i, 1);
  saveGoals();
  renderGoals();
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
  showToolResult('tb-out', '<p>Total allocated: <b>' + fmt(total) + '</b><br>Income: <b>' + fmt(income) + '</b><br><b style="color:' + (left >= 0 ? '#22c55e' : '#ef4444') + ';">' + (left >= 0 ? 'Left over: ' : 'Over budget by: ') + fmt(Math.abs(left)) + '</b></p>');
}

function calcDebt() {
  const debt = parseFloat(document.getElementById('td-debt').value) || 0;
  const rate = parseFloat(document.getElementById('td-rate').value) || 0;
  const payment = parseFloat(document.getElementById('td-payment').value) || 0;
  if (!debt || !payment) { showToolResult('td-out', '<p>Enter the debt amount and monthly payment.</p>'); return; }
  const monthlyRate = (rate / 100) / 12;
  if (payment <= debt * monthlyRate) { showToolResult('td-out', '<p style="color:#ef4444;">Your payment is too low to ever pay off the debt. Increase it.</p>'); return; }
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
  showToolResult('tDisc-out', '<p>You save <b>' + fmt(save.toFixed(2)) + '</b><br>Final price: <b style="color:#22c55e;">' + fmt(final.toFixed(2)) + '</b></p>');
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
  showToolResult('te-out', '<p>Planning targets:</p><p>1 month: <b>' + fmt(essentials) + '</b><br>3 months: <b>' + fmt(essentials * 3) + '</b><br>6 months: <b>' + fmt(essentials * 6) + '</b><br>12 months: <b>' + fmt(essentials * 12) + '</b></p><p style="font-size:12px;color:#94a3b8;margin-top:10px;">These are planning calculations, not personalized financial advice.</p>');
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
  showToolResult('tc-out', '<p>Result: <b>' + (amt * rate).toLocaleString(undefined, { maximumFractionDigits: 2 }) + '</b></p><p style="font-size:12px;color:#94a3b8;margin-top:10px;">Enter the current exchange rate manually for accuracy.</p>');
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

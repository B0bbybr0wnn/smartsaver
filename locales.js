// ============ TRANSLATIONS ============
const LOCALES = {
  en: {
    brand_tagline: 'Before you make a money decision, ask SmartSaver.',
    choose_currency: 'Choose your currency',
    continue: 'Continue',
    welcome_title: 'Welcome',
    welcome_sub: 'What would you like SmartSaver to help you with?<br>Pick as many as you like.',
    finish_setup: 'Finish setup',
    tour_title: 'How to use SmartSaver',
    tour_sub: 'A quick tour of what each tab does.',
    skip_tour: 'Skip',
    next: 'Next',
    ready_title: "You're all set",
    ready_sub: 'SmartSaver is ready. Start by checking a purchase or setting a savings goal.',
    get_started: 'Get started',

    nav_home: 'Home', nav_save: 'Save', nav_decide: 'Decide', nav_tools: 'Tools', nav_more: 'More',
    greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
    home_overview: 'Overview',
    check_purchase: 'Check a purchase',
    check_purchase_sub: 'Before you buy, see if you can afford it',
    today: 'Today', spent_today: 'Spent today', this_week: 'This week', suggestions: 'Suggestions',
    amount: 'Amount', note_optional: 'Note (optional)', add: 'Add',
    balance: 'Balance', available: 'Available', income: 'Income', essentials: 'Essentials',
    nothing_logged_week: 'Nothing logged this week yet.',

    save_title: 'Save', new_goal: 'New savings goal', new_goal_title: 'New goal', new_goal_sub: 'What are you saving for?',
    goal_name: 'Goal name', target_amount: 'Target amount', already_saved: 'Already saved (optional)', target_date: 'Target date (optional)',
    save_goal_btn: 'Save goal', cancel: 'Cancel', add_money: 'Add money', delete: 'Delete',
    saved: 'saved', to_go: 'to go', no_goals: 'No goals yet. Tap below to start one.',

    decide_title: 'Decide', item_name: 'Item or purchase name', price: 'Price',
    current_balance: 'Your current balance', monthly_income: 'Monthly income', monthly_expenses: 'Essential monthly expenses',
    can_afford: 'Can I afford this?', save_btn: 'Save', template_btn: 'Template', share_btn: 'Share', quick_start: 'Quick start',

    tools_title: 'Tools',
    tool_savings: 'Savings calculator', tool_budget: 'Budget calculator', tool_debt: 'Debt payoff calculator',
    tool_discount: 'Discount calculator', tool_percent: 'Percentage calculator', tool_emergency: 'Emergency fund calculator',
    tool_tip: 'Tip calculator', tool_convert: 'Currency converter',
    calculate: 'Calculate', clear: 'Clear', convert: 'Convert',
    from_currency: 'From', to_currency: 'To', exchange_rate: 'Exchange rate',

    more_title: 'More', preferences: 'Preferences', your_data: 'Your data', money_tips: 'Money tips',
    help: 'Help', whats_new: "What's new", about: 'About', privacy: 'Privacy', insights: 'Insights',
    reset_data: 'Reset all data', appearance: 'Appearance', theme: 'Theme', language: 'Language',
    currency: 'Currency', interests: 'Interests', save_changes: 'Save changes',
    select_currency: 'Select currency', select_interests: 'Select interests', select_tool: 'Select a tool',
    for_you: 'For you',

    username: 'Username',
    username_hint: 'Pick a username so friends can find you. 3-20 characters: letters, numbers, underscore.',
    friends: 'Friends',
    your_username: 'Your username',
    add_friend: 'Add a friend',
    requests: 'Requests',
    your_friends: 'Your friends',
    copy: 'Copy',

    history: 'History',
    saved_decisions: 'Saved decisions',
    logged_spends: 'Logged spends',

    cloud_sync: 'Cloud sync',
    sync_now: 'Sync now',
    sync_idle: 'Not synced yet',
    sync_checking: 'Checking...',
    sync_uploading: 'Uploading...',
    sync_done: 'Synced',
    sync_error: 'Sync failed',
    sync_nothing: 'Nothing to sync yet',
    sync_last: 'Last sync',

    insights_title: 'Insights',
    spending_trend: 'Spending trend',
    last_8_weeks: 'Last 8 weeks',
    decisions_breakdown: 'Decisions',
    last_30_days: 'Last 30 days',
    yes_count: 'Yes', risky_count: 'Risky', no_count: 'Not yet',
    no_data_yet: 'No data yet. Start logging spends and decisions.',
    goals_overview: 'Goals',
    this_month_spent: 'Spent this month',
    this_month_saved: 'Saved this month',
    avg_daily_spend: 'Avg daily spend',
    decisions_made: 'Decisions made'
  },
  de: {
    brand_tagline: 'Bevor du eine Geldentscheidung triffst, frag SmartSaver.',
    choose_currency: 'Wähle deine Währung',
    continue: 'Weiter',
    welcome_title: 'Willkommen',
    welcome_sub: 'Wobei soll SmartSaver dir helfen?<br>Wähle so viele du möchtest.',
    finish_setup: 'Einrichtung abschließen',
    tour_title: 'SmartSaver verwenden',
    tour_sub: 'Eine kurze Tour durch die Tabs.',
    skip_tour: 'Überspringen',
    next: 'Weiter',
    ready_title: 'Alles bereit',
    ready_sub: 'SmartSaver ist bereit. Starte mit einer Kaufprüfung oder einem Sparziel.',
    get_started: 'Loslegen',

    nav_home: 'Start', nav_save: 'Sparen', nav_decide: 'Entscheiden', nav_tools: 'Werkzeuge', nav_more: 'Mehr',
    greeting_morning: 'Guten Morgen', greeting_afternoon: 'Guten Tag', greeting_evening: 'Guten Abend',
    home_overview: 'Übersicht',
    check_purchase: 'Kauf prüfen',
    check_purchase_sub: 'Sieh vor dem Kauf, ob du es dir leisten kannst',
    today: 'Heute', spent_today: 'Heute ausgegeben', this_week: 'Diese Woche', suggestions: 'Vorschläge',
    amount: 'Betrag', note_optional: 'Notiz (optional)', add: 'Hinzufügen',
    balance: 'Kontostand', available: 'Verfügbar', income: 'Einkommen', essentials: 'Grundbedarf',
    nothing_logged_week: 'Diese Woche noch nichts erfasst.',

    save_title: 'Sparen', new_goal: 'Neues Sparziel', new_goal_title: 'Neues Ziel', new_goal_sub: 'Wofür sparst du?',
    goal_name: 'Zielname', target_amount: 'Zielbetrag', already_saved: 'Bereits gespart (optional)', target_date: 'Zieldatum (optional)',
    save_goal_btn: 'Ziel speichern', cancel: 'Abbrechen', add_money: 'Geld hinzufügen', delete: 'Löschen',
    saved: 'gespart', to_go: 'übrig', no_goals: 'Noch keine Ziele. Tippe unten, um zu starten.',

    decide_title: 'Entscheiden', item_name: 'Artikel- oder Kaufname', price: 'Preis',
    current_balance: 'Aktueller Kontostand', monthly_income: 'Monatliches Einkommen', monthly_expenses: 'Wesentliche monatliche Ausgaben',
    can_afford: 'Kann ich mir das leisten?', save_btn: 'Speichern', template_btn: 'Vorlage', share_btn: 'Teilen', quick_start: 'Schnellstart',

    tools_title: 'Werkzeuge',
    tool_savings: 'Sparrechner', tool_budget: 'Budgetrechner', tool_debt: 'Schulden-Tilgungsrechner',
    tool_discount: 'Rabattrechner', tool_percent: 'Prozentrechner', tool_emergency: 'Notfallfonds-Rechner',
    tool_tip: 'Trinkgeldrechner', tool_convert: 'Währungsrechner',
    calculate: 'Berechnen', clear: 'Leeren', convert: 'Umrechnen',
    from_currency: 'Von', to_currency: 'Nach', exchange_rate: 'Wechselkurs',

    more_title: 'Mehr', preferences: 'Einstellungen', your_data: 'Deine Daten', money_tips: 'Geld-Tipps',
    help: 'Hilfe', whats_new: 'Neuigkeiten', about: 'Über', privacy: 'Datenschutz', insights: 'Einblicke',
    reset_data: 'Alle Daten zurücksetzen', appearance: 'Erscheinungsbild', theme: 'Design', language: 'Sprache',
    currency: 'Währung', interests: 'Interessen', save_changes: 'Änderungen speichern',
    select_currency: 'Währung wählen', select_interests: 'Interessen wählen', select_tool: 'Werkzeug wählen',
    for_you: 'Für dich',

    username: 'Benutzername',
    username_hint: 'Wähle einen Benutzernamen, damit Freunde dich finden. 3-20 Zeichen: Buchstaben, Zahlen, Unterstrich.',
    friends: 'Freunde',
    your_username: 'Dein Benutzername',
    add_friend: 'Freund hinzufügen',
    requests: 'Anfragen',
    your_friends: 'Deine Freunde',
    copy: 'Kopieren',

    history: 'Verlauf',
    saved_decisions: 'Gespeicherte Entscheidungen',
    logged_spends: 'Erfasste Ausgaben',

    cloud_sync: 'Cloud-Sync',
    sync_now: 'Jetzt syncen',
    sync_idle: 'Noch nicht synchronisiert',
    sync_checking: 'Prüfen...',
    sync_uploading: 'Hochladen...',
    sync_done: 'Synchronisiert',
    sync_error: 'Sync fehlgeschlagen',
    sync_nothing: 'Nichts zu syncen',
    sync_last: 'Letzte Sync',

    insights_title: 'Einblicke',
    spending_trend: 'Ausgaben-Trend',
    last_8_weeks: 'Letzte 8 Wochen',
    decisions_breakdown: 'Entscheidungen',
    last_30_days: 'Letzte 30 Tage',
    yes_count: 'Ja', risky_count: 'Riskant', no_count: 'Noch nicht',
    no_data_yet: 'Noch keine Daten. Erfasse Ausgaben und Entscheidungen.',
    goals_overview: 'Ziele',
    this_month_spent: 'Diesen Monat ausgegeben',
    this_month_saved: 'Diesen Monat gespart',
    avg_daily_spend: 'Ø täglich',
    decisions_made: 'Entscheidungen'
  },
  es: {
    brand_tagline: 'Antes de tomar una decisión financiera, pregúntale a SmartSaver.',
    choose_currency: 'Elige tu moneda',
    continue: 'Continuar',
    welcome_title: 'Bienvenido',
    welcome_sub: '¿En qué quieres que SmartSaver te ayude?<br>Elige las que quieras.',
    finish_setup: 'Finalizar configuración',
    tour_title: 'Cómo usar SmartSaver',
    tour_sub: 'Un recorrido rápido por las pestañas.',
    skip_tour: 'Omitir',
    next: 'Siguiente',
    ready_title: 'Todo listo',
    ready_sub: 'SmartSaver está listo. Comienza revisando una compra o creando una meta.',
    get_started: 'Comenzar',

    nav_home: 'Inicio', nav_save: 'Ahorrar', nav_decide: 'Decidir', nav_tools: 'Herramientas', nav_more: 'Más',
    greeting_morning: 'Buenos días', greeting_afternoon: 'Buenas tardes', greeting_evening: 'Buenas noches',
    home_overview: 'Resumen',
    check_purchase: 'Revisar una compra',
    check_purchase_sub: 'Antes de comprar, mira si puedes pagarlo',
    today: 'Hoy', spent_today: 'Gastado hoy', this_week: 'Esta semana', suggestions: 'Sugerencias',
    amount: 'Cantidad', note_optional: 'Nota (opcional)', add: 'Añadir',
    balance: 'Saldo', available: 'Disponible', income: 'Ingresos', essentials: 'Esenciales',
    nothing_logged_week: 'Aún no hay nada registrado esta semana.',

    save_title: 'Ahorrar', new_goal: 'Nueva meta de ahorro', new_goal_title: 'Nueva meta', new_goal_sub: '¿Para qué estás ahorrando?',
    goal_name: 'Nombre de la meta', target_amount: 'Cantidad objetivo', already_saved: 'Ya ahorrado (opcional)', target_date: 'Fecha objetivo (opcional)',
    save_goal_btn: 'Guardar meta', cancel: 'Cancelar', add_money: 'Añadir dinero', delete: 'Eliminar',
    saved: 'ahorrado', to_go: 'restante', no_goals: 'Aún no hay metas. Toca abajo para empezar.',

    decide_title: 'Decidir', item_name: 'Nombre del artículo o compra', price: 'Precio',
    current_balance: 'Saldo actual', monthly_income: 'Ingreso mensual', monthly_expenses: 'Gastos mensuales esenciales',
    can_afford: '¿Puedo permitírmelo?', save_btn: 'Guardar', template_btn: 'Plantilla', share_btn: 'Compartir', quick_start: 'Inicio rápido',

    tools_title: 'Herramientas',
    tool_savings: 'Calculadora de ahorro', tool_budget: 'Calculadora de presupuesto', tool_debt: 'Calculadora de deudas',
    tool_discount: 'Calculadora de descuentos', tool_percent: 'Calculadora de porcentajes', tool_emergency: 'Calculadora de fondo de emergencia',
    tool_tip: 'Calculadora de propinas', tool_convert: 'Conversor de divisas',
    calculate: 'Calcular', clear: 'Limpiar', convert: 'Convertir',
    from_currency: 'De', to_currency: 'A', exchange_rate: 'Tipo de cambio',

    more_title: 'Más', preferences: 'Preferencias', your_data: 'Tus datos', money_tips: 'Consejos de dinero',
    help: 'Ayuda', whats_new: 'Novedades', about: 'Acerca de', privacy: 'Privacidad', insights: 'Análisis',
    reset_data: 'Restablecer todos los datos', appearance: 'Apariencia', theme: 'Tema', language: 'Idioma',
    currency: 'Moneda', interests: 'Intereses', save_changes: 'Guardar cambios',
    select_currency: 'Seleccionar moneda', select_interests: 'Seleccionar intereses', select_tool: 'Seleccionar herramienta',
    for_you: 'Para ti',

    username: 'Nombre de usuario',
    username_hint: 'Elige un nombre de usuario para que tus amigos te encuentren. 3-20 caracteres: letras, números, guion bajo.',
    friends: 'Amigos',
    your_username: 'Tu nombre de usuario',
    add_friend: 'Añadir un amigo',
    requests: 'Solicitudes',
    your_friends: 'Tus amigos',
    copy: 'Copiar',

    history: 'Historial',
    saved_decisions: 'Decisiones guardadas',
    logged_spends: 'Gastos registrados',

    cloud_sync: 'Sincronización',
    sync_now: 'Sincronizar',
    sync_idle: 'Aún no sincronizado',
    sync_checking: 'Comprobando...',
    sync_uploading: 'Subiendo...',
    sync_done: 'Sincronizado',
    sync_error: 'Error de sincronización',
    sync_nothing: 'Nada que sincronizar',
    sync_last: 'Última sync',

    insights_title: 'Análisis',
    spending_trend: 'Tendencia de gastos',
    last_8_weeks: 'Últimas 8 semanas',
    decisions_breakdown: 'Decisiones',
    last_30_days: 'Últimos 30 días',
    yes_count: 'Sí', risky_count: 'Riesgoso', no_count: 'Aún no',
    no_data_yet: 'Aún no hay datos. Comienza registrando gastos y decisiones.',
    goals_overview: 'Metas',
    this_month_spent: 'Gastado este mes',
    this_month_saved: 'Ahorrado este mes',
    avg_daily_spend: 'Promedio diario',
    decisions_made: 'Decisiones'
  }
};

function t(key) {
  const lang = localStorage.getItem('ss_lang') || 'en';
  const dict = LOCALES[lang] || LOCALES.en;
  return dict[key] || LOCALES.en[key] || key;
}
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const html = el.getAttribute('data-i18n-html') === 'true';
    const val = t(key);
    if (html) el.innerHTML = val;
    else el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
}
window.t = t;
window.applyTranslations = applyTranslations;

// ============ INTEREST NAMES ============
const INTEREST_KEYS = {
  'Saving money': { de: 'Geld sparen', es: 'Ahorrar dinero' },
  'Managing my budget': { de: 'Mein Budget verwalten', es: 'Gestionar mi presupuesto' },
  'Making better spending decisions': { de: 'Bessere Ausgabeentscheidungen', es: 'Mejores decisiones de gasto' },
  'Paying off debt': { de: 'Schulden abbauen', es: 'Pagar deudas' },
  'Building an emergency fund': { de: 'Notfallfonds aufbauen', es: 'Crear un fondo de emergencia' },
  'Tracking my financial goals': { de: 'Finanzielle Ziele verfolgen', es: 'Seguir mis metas financieras' }
};
function ti(interest) {
  const lang = localStorage.getItem('ss_lang') || 'en';
  if (lang === 'en') return interest;
  const entry = INTEREST_KEYS[interest];
  return (entry && entry[lang]) || interest;
}
window.ti = ti;

// ============ VERDICTS ============
const VERDICTS = {
  not_yet: { en: 'Not yet', de: 'Noch nicht', es: 'Aún no' },
  risky: { en: 'Risky', de: 'Riskant', es: 'Riesgoso' },
  yes_can: { en: 'Yes, you can', de: 'Ja, du kannst', es: 'Sí, puedes' },
  enter_numbers: { en: 'Enter your numbers', de: 'Zahlen eingeben', es: 'Introduce los números' },
  fetch_rate: { en: 'Fetching rate...', de: 'Kurs wird geladen...', es: 'Obteniendo tipo...' },
  rate_fail: { en: 'Could not fetch rate. Check your internet connection.', de: 'Kurs konnte nicht geladen werden. Prüfe deine Verbindung.', es: 'No se pudo obtener el tipo. Verifica tu conexión.' }
};
function tv(key) {
  const lang = localStorage.getItem('ss_lang') || 'en';
  const e = VERDICTS[key];
  return e ? (e[lang] || e.en) : key;
}
window.tv = tv;

// ============ TOASTS ============
const TOASTS = {
  saved: { en: 'Saved', de: 'Gespeichert', es: 'Guardado' },
  goal_created: { en: 'Goal created', de: 'Ziel erstellt', es: 'Meta creada' },
  goal_deleted: { en: 'Goal deleted', de: 'Ziel gelöscht', es: 'Meta eliminada' },
  template_saved: { en: 'Template saved', de: 'Vorlage gespeichert', es: 'Plantilla guardada' },
  template_deleted: { en: 'Template deleted', de: 'Vorlage gelöscht', es: 'Plantilla eliminada' },
  template_deleted2: { en: 'Deleted', de: 'Gelöscht', es: 'Eliminado' },
  backup_downloaded: { en: 'Backup downloaded', de: 'Backup heruntergeladen', es: 'Copia descargada' },
  data_imported: { en: 'Data imported', de: 'Daten importiert', es: 'Datos importados' },
  could_not_read: { en: 'Could not read that file', de: 'Datei konnte nicht gelesen werden', es: 'No se pudo leer el archivo' },
  enter_amount: { en: 'Enter an amount', de: 'Betrag eingeben', es: 'Introduce una cantidad' },
  enter_name_target: { en: 'Enter a name and target', de: 'Name und Ziel eingeben', es: 'Introduce nombre y objetivo' },
  preferences_saved: { en: 'Preferences saved', de: 'Einstellungen gespeichert', es: 'Preferencias guardadas' }
};
function tt(key, fallback) {
  const lang = localStorage.getItem('ss_lang') || 'en';
  const e = TOASTS[key];
  if (!e) return fallback || key;
  return e[lang] || e.en;
}
window.tt = tt;

// ============ SUGGESTIONS ============
const SUGGESTIONS = {
  pace_target: {
    en: 'To hit <b>{name}</b> by your target date, save about <b>{amt} per week.</b>',
    de: 'Um <b>{name}</b> bis zum Zieldatum zu erreichen, spare etwa <b>{amt} pro Woche.</b>',
    es: 'Para alcanzar <b>{name}</b> antes de tu fecha objetivo, ahorra <b>{amt} por semana.</b>'
  },
  pace_current: {
    en: 'At your current pace, you\'ll reach <b>{name}</b> around <b>{date}</b>.',
    de: 'Bei deinem aktuellen Tempo erreichst du <b>{name}</b> etwa im <b>{date}</b>.',
    es: 'A tu ritmo actual, alcanzarás <b>{name}</b> alrededor de <b>{date}</b>.'
  },
  buffer_good: {
    en: 'Your monthly buffer is <b>{amt}</b>. Consider putting half into a savings goal.',
    de: 'Dein monatlicher Puffer ist <b>{amt}</b>. Erwäge, die Hälfte in ein Sparziel zu stecken.',
    es: 'Tu colchón mensual es <b>{amt}</b>. Considera poner la mitad en una meta de ahorro.'
  },
  buffer_negative: {
    en: 'Expenses exceed income by <b>{amt}</b>. Try trimming one category.',
    de: 'Ausgaben übersteigen das Einkommen um <b>{amt}</b>. Versuche, eine Kategorie zu kürzen.',
    es: 'Los gastos superan los ingresos en <b>{amt}</b>. Intenta recortar una categoría.'
  },
  spent_more: {
    en: 'You spent <b>{amt} more</b> this week than last week.',
    de: 'Du hast diese Woche <b>{amt} mehr</b> ausgegeben als letzte Woche.',
    es: 'Has gastado <b>{amt} más</b> esta semana que la anterior.'
  },
  spent_less: {
    en: 'Nice — you spent <b>{amt} less</b> this week than last week.',
    de: 'Super — du hast diese Woche <b>{amt} weniger</b> ausgegeben als letzte Woche.',
    es: 'Bien — has gastado <b>{amt} menos</b> esta semana que la anterior.'
  },
  no_activity: {
    en: 'You haven\'t logged anything in <b>{days} days</b>.',
    de: 'Du hast seit <b>{days} Tagen</b> nichts erfasst.',
    es: 'No has registrado nada en <b>{days} días</b>.'
  }
};
function ts(key, vars) {
  const lang = localStorage.getItem('ss_lang') || 'en';
  const e = SUGGESTIONS[key];
  if (!e) return '';
  let out = e[lang] || e.en;
  for (const k in vars) out = out.replace('{' + k + '}', vars[k]);
  return out;
}
window.ts = ts;

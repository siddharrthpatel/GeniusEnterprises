const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'platform.json');

const DEFAULTS = {
  keys: {
    supabase_url: process.env.SUPABASE_URL || 'https://drkxuilxrhjjcixeuftj.supabase.co',
    supabase_anon_key: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_udvTla9MSU9HSzF_lJb44A_EWfdZmWe',
    gemini_api_key: process.env.GEMINI_API_KEY || '',
    market_fallback_to_gemini: process.env.MARKET_FALLBACK_TO_GEMINI !== 'false',
  },
  marketConfig: {
    activeStocks: [
      { code: 'RELIANCE', label: 'Reliance Industries', isActive: true },
      { code: 'TCS', label: 'Tata Consultancy Services', isActive: true },
      { code: 'HDFCBANK', label: 'HDFC Bank', isActive: true },
      { code: 'INFY', label: 'Infosys', isActive: true },
      { code: 'ICICIBANK', label: 'ICICI Bank', isActive: true },
      { code: 'SBIN', label: 'State Bank of India', isActive: true },
      { code: 'ITC', label: 'ITC Limited', isActive: true },
      { code: 'BHARTIARTL', label: 'Bharti Airtel', isActive: true },
      { code: 'LT', label: 'Larsen & Toubro', isActive: true },
      { code: 'HINDUNILVR', label: 'Hindustan Unilever', isActive: true },
    ],
    activeIndices: [
      { code: 'SENSEX', label: 'BSE SENSEX', isActive: true },
      { code: 'NIFTY50', label: 'NIFTY 50', isActive: true },
      { code: 'BANKNIFTY', label: 'Bank Nifty', isActive: true },
      { code: 'NIFTYIT', label: 'Nifty IT', isActive: false },
      { code: 'NIFTYPHARMA', label: 'Nifty Pharma', isActive: false },
    ],
    refreshIntervalMs: 30000,
    lastFetchedAt: null,
  },
  apiAccess: {
    admin: { portfolio: { read: true, write: true }, reports: { read: true, write: true }, clients: { read: true, write: true }, market: { read: true, write: true }, profile: { read: true, write: true }, documents: { read: true, write: true }, transactions: { read: true, write: true }, analytics: { read: true, write: true } },
    branch_manager: { portfolio: { read: true, write: true }, reports: { read: true, write: false }, clients: { read: true, write: true }, market: { read: true, write: false }, profile: { read: true, write: false }, documents: { read: true, write: true }, transactions: { read: true, write: true }, analytics: { read: true, write: false } },
    rm: { portfolio: { read: true, write: true }, reports: { read: true, write: false }, clients: { read: true, write: true }, market: { read: true, write: false }, profile: { read: true, write: false }, documents: { read: true, write: true }, transactions: { read: true, write: true }, analytics: { read: true, write: false } },
    arm: { portfolio: { read: true, write: false }, reports: { read: true, write: false }, clients: { read: true, write: false }, market: { read: true, write: false }, profile: { read: true, write: false }, documents: { read: true, write: false }, transactions: { read: false, write: false }, analytics: { read: true, write: false } },
    advisor: { portfolio: { read: true, write: false }, reports: { read: true, write: false }, clients: { read: true, write: false }, market: { read: true, write: false }, profile: { read: true, write: false }, documents: { read: true, write: false }, transactions: { read: false, write: false }, analytics: { read: true, write: false } },
    sub_broker: { portfolio: { read: true, write: false }, reports: { read: true, write: false }, clients: { read: true, write: false }, market: { read: true, write: false }, profile: { read: true, write: false }, documents: { read: false, write: false }, transactions: { read: true, write: false }, analytics: { read: false, write: false } },
    employee: { portfolio: { read: true, write: false }, reports: { read: true, write: false }, clients: { read: true, write: false }, market: { read: true, write: false }, profile: { read: true, write: false }, documents: { read: false, write: false }, transactions: { read: false, write: false }, analytics: { read: false, write: false } },
    client: { portfolio: { read: true, write: false }, reports: { read: true, write: false }, clients: { read: false, write: false }, market: { read: true, write: false }, profile: { read: true, write: true }, documents: { read: true, write: true }, transactions: { read: true, write: false }, analytics: { read: false, write: false } },
  },
  dashboards: [
    { id: 'admin', label: 'Admin', role: 'admin', isActive: true },
    { id: 'branch_manager', label: 'Branch Manager', role: 'branch_manager', isActive: true },
    { id: 'rm', label: 'Relationship Manager', role: 'rm', isActive: true },
    { id: 'arm', label: 'Assistant RM', role: 'arm', isActive: true },
    { id: 'advisor', label: 'Advisor', role: 'advisor', isActive: true },
    { id: 'sub_broker', label: 'Sub Broker', role: 'sub_broker', isActive: true },
    { id: 'employee', label: 'Employee', role: 'employee', isActive: true },
    { id: 'client', label: 'Client', role: 'client', isActive: true },
  ],
  notices: [
    {
      id: 'n1',
      kind: 'notice',
      title: 'Welcome to Genius Enterprises Portal',
      body: 'Role-based dashboards are live. Contact your RM for onboarding support.',
      audience: 'all',
      isActive: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'a1',
      kind: 'ad',
      title: 'SIP Top-up Month',
      body: 'Increase your SIP by 10% this month and stay on track for long-term goals.',
      audience: 'client',
      isActive: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

function load() {
  try {
    if (fs.existsSync(FILE)) {
      const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      return {
        keys: { ...DEFAULTS.keys, ...(raw.keys || {}) },
        marketConfig: (raw.marketConfig && typeof raw.marketConfig === 'object')
          ? {
              ...DEFAULTS.marketConfig,
              ...raw.marketConfig,
              activeStocks: (Array.isArray(raw.marketConfig.activeStocks) && raw.marketConfig.activeStocks.length)
                ? raw.marketConfig.activeStocks
                : DEFAULTS.marketConfig.activeStocks,
              activeIndices: (Array.isArray(raw.marketConfig.activeIndices) && raw.marketConfig.activeIndices.length)
                ? raw.marketConfig.activeIndices
                : DEFAULTS.marketConfig.activeIndices,
              refreshIntervalMs: typeof raw.marketConfig.refreshIntervalMs === 'number' && raw.marketConfig.refreshIntervalMs >= 10000
                ? raw.marketConfig.refreshIntervalMs
                : DEFAULTS.marketConfig.refreshIntervalMs,
            }
          : JSON.parse(JSON.stringify(DEFAULTS.marketConfig)),
        dashboards: (raw.dashboards || []).length
          ? raw.dashboards || []
          : DEFAULTS.dashboards,
        apiAccess: (raw.apiAccess && typeof raw.apiAccess === 'object') ? { ...DEFAULTS.apiAccess, ...raw.apiAccess } : { ...DEFAULTS.apiAccess },
        notices: raw.notices?.length ? raw.notices : DEFAULTS.notices,
      };
    }
  } catch (err) {
    console.error('[platformStore]', err.message);
  }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function applyKeysToEnv(keys) {
  if (keys.supabase_url) process.env.SUPABASE_URL = keys.supabase_url;
  if (keys.supabase_anon_key) {
    process.env.SUPABASE_ANON_KEY = keys.supabase_anon_key;
    process.env.SUPABASE_PUBLISHABLE_KEY = keys.supabase_anon_key;
  }
  if (keys.gemini_api_key) {
    process.env.GEMINI_API_KEY = keys.gemini_api_key;
  }
  if (keys.market_fallback_to_gemini != null) {
    process.env.MARKET_FALLBACK_TO_GEMINI = String(!!keys.market_fallback_to_gemini);
  }
}

let state = load();
applyKeysToEnv(state.keys);

function mask(value) {
  if (!value) return '';
  if (value.length <= 8) return '••••';
  return value.slice(0, 6) + '••••' + value.slice(-4);
}

module.exports = {
  getPublicDashboards: () => state.dashboards.map((d) => ({ ...d })),
  getPublicNotices: (audience) =>
    state.notices.filter(
      (n) =>
        n.isActive &&
        (!audience || n.audience === 'all' || n.audience === audience),
    ),
  getMaskedKeys: () => ({
    supabase_url: state.keys.supabase_url || '',
    supabase_anon_key: mask(state.keys.supabase_anon_key),
    gemini_api_key: mask(state.keys.gemini_api_key),
    market_fallback_to_gemini: !!state.keys.market_fallback_to_gemini,
    has_supabase_anon_key: !!state.keys.supabase_anon_key,
    has_gemini_api_key: !!state.keys.gemini_api_key,
  }),
  updateKeys: (patch) => {
    const next = { ...state.keys };
    for (const k of ['supabase_url', 'supabase_anon_key', 'gemini_api_key']) {
      if (typeof patch[k] === 'string' && patch[k] && !patch[k].includes('••••')) {
        next[k] = patch[k].trim();
      }
    }
    if (patch.market_fallback_to_gemini != null) {
      next.market_fallback_to_gemini = !!patch.market_fallback_to_gemini;
    }
    state.keys = next;
    applyKeysToEnv(next);
    save(state);
    return module.exports.getMaskedKeys();
  },
  getMarketConfig: () => JSON.parse(JSON.stringify(state.marketConfig)),
  getActiveStockCodes: () => (state.marketConfig.activeStocks || [])
    .filter((s) => s.isActive !== false)
    .map((s) => s.code),
  getActiveIndexCodes: () => (state.marketConfig.activeIndices || [])
    .filter((i) => i.isActive !== false)
    .map((i) => i.code),
  getRefreshIntervalMs: () => state.marketConfig.refreshIntervalMs || DEFAULTS.marketConfig.refreshIntervalMs,
  getLastFetchedAt: () => state.marketConfig.lastFetchedAt || null,
  touchLastFetchedAt: () => {
    state.marketConfig.lastFetchedAt = new Date().toISOString();
    save(state);
  },
  updateMarketConfig: (patch) => {
    if (!patch || typeof patch !== 'object') return module.exports.getMarketConfig();
    if (Array.isArray(patch.activeStocks)) {
      state.marketConfig.activeStocks = patch.activeStocks.map((s) => ({
        code: String(s.code || '').toUpperCase().slice(0, 30),
        label: String(s.label || s.code || '').slice(0, 120),
        isActive: s.isActive !== false,
      })).filter((s) => s.code);
    }
    if (Array.isArray(patch.activeIndices)) {
      state.marketConfig.activeIndices = patch.activeIndices.map((i) => ({
        code: String(i.code || '').toUpperCase().slice(0, 30),
        label: String(i.label || i.code || '').slice(0, 120),
        isActive: i.isActive !== false,
      })).filter((i) => i.code);
    }
    if (typeof patch.refreshIntervalMs === 'number') {
      const clamped = Math.max(10000, Math.min(3600000, patch.refreshIntervalMs));
      state.marketConfig.refreshIntervalMs = clamped;
    }
    if (patch.lastFetchedAt != null) {
      state.marketConfig.lastFetchedAt = patch.lastFetchedAt;
    }
    save(state);
    return module.exports.getMarketConfig();
  },
  addStock: (code, label) => {
    const c = String(code || '').toUpperCase().trim();
    if (!c) return null;
    let existing = state.marketConfig.activeStocks.find((s) => s.code.toUpperCase() === c);
    if (existing) {
      existing.isActive = true;
      if (label) existing.label = label;
    } else {
      existing = { code: c, label: label || c, isActive: true };
      state.marketConfig.activeStocks.push(existing);
    }
    save(state);
    return { ...existing };
  },
  toggleStockActive: (code, isActive) => {
    const needle = String(code || '').toUpperCase();
    const row = state.marketConfig.activeStocks.find((s) => s.code.toUpperCase() === needle);
    if (!row) return null;
    row.isActive = !!isActive;
    save(state);
    return { ...row };
  },
  toggleIndexActive: (code, isActive) => {
    const needle = String(code || '').toUpperCase();
    const row = state.marketConfig.activeIndices.find((i) => i.code.toUpperCase() === needle);
    if (!row) return null;
    row.isActive = !!isActive;
    save(state);
    return { ...row };
  },
  setRefreshInterval: (ms) => {
    const clamped = Math.max(10000, Math.min(3600000, Number(ms) || 30000));
    state.marketConfig.refreshIntervalMs = clamped;
    save(state);
    return clamped;
  },
  setDashboardActive: (id, isActive) => {
    const row = state.dashboards.find((d) => d.id === id);
    if (!row) return null;
    row.isActive = !!isActive;
    save(state);
    return { ...row };
  },
  addNotice: (payload) => {
    const item = {
      id: 'n' + Date.now().toString(36),
      kind: payload.kind === 'ad' ? 'ad' : 'notice',
      title: String(payload.title || '').slice(0, 120),
      body: String(payload.body || '').slice(0, 2000),
      imageUrl: payload.imageUrl || '',
      linkUrl: payload.linkUrl || '',
      audience: payload.audience || 'all',
      isActive: payload.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    state.notices.unshift(item);
    save(state);
    return item;
  },
  updateNotice: (id, patch) => {
    const row = state.notices.find((n) => n.id === id);
    if (!row) return null;
    if (patch.title != null) row.title = String(patch.title).slice(0, 120);
    if (patch.body != null) row.body = String(patch.body).slice(0, 2000);
    if (patch.kind) row.kind = patch.kind === 'ad' ? 'ad' : 'notice';
    if (patch.audience) row.audience = patch.audience;
    if (typeof patch.isActive === 'boolean') row.isActive = patch.isActive;
    if (patch.imageUrl != null) row.imageUrl = patch.imageUrl;
    if (patch.linkUrl != null) row.linkUrl = patch.linkUrl;
    save(state);
    return { ...row };
  },
  deleteNotice: (id) => {
    state.notices = state.notices.filter((n) => n.id !== id);
    save(state);
  },
  isDashboardActive: (role) => {
    const row = state.dashboards.find((d) => d.id === role || d.role === role);
    return row ? row.isActive !== false : true;
  },
  getApiAccess: () => JSON.parse(JSON.stringify(state.apiAccess || DEFAULTS.apiAccess)),
  updateApiAccess: (patch) => {
    if (patch && typeof patch === 'object') {
      state.apiAccess = { ...(state.apiAccess || {}), ...patch };
      save(state);
    }
    return JSON.parse(JSON.stringify(state.apiAccess));
  },
  canAccess: (role, scope, permission = 'read') => {
    const access = state.apiAccess || DEFAULTS.apiAccess;
    return !!(access[role]?.[scope]?.[permission]);
  },
};

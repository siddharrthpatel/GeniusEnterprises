const express = require('express');
const { authenticate } = require('../middleware/auth');
const yahoo = require('../services/yahooFinance');
let geminiFallback;
try { geminiFallback = require('../services/geminiStockFallback'); } catch { geminiFallback = null; }

let platform;
try { platform = require('../data/platformStore'); } catch { platform = null; }

function getActiveStockCodes() {
  try {
    if (platform && typeof platform.getActiveStockCodes === 'function') {
      return platform.getActiveStockCodes();
    }
  } catch {}
  return null;
}

function getActiveIndexCodes() {
  try {
    if (platform && typeof platform.getActiveIndexCodes === 'function') {
      return platform.getActiveIndexCodes();
    }
  } catch {}
  return null;
}

function getRefreshIntervalMs() {
  try {
    if (platform && typeof platform.getRefreshIntervalMs === 'function') {
      return platform.getRefreshIntervalMs();
    }
  } catch {}
  return 30000;
}

function normCode(v) {
  return String(v || '').toUpperCase().replace(/[\s:_-]/g, '');
}

function resolveActiveCodes(codeGetter) {
  const activeCodes = typeof codeGetter === 'function' ? codeGetter() : codeGetter;
  return Array.isArray(activeCodes) ? activeCodes.map(normCode).filter(Boolean) : null;
}

function filterByActiveCodes(items, codeGetter) {
  if (!Array.isArray(items)) return [];
  const activeCodes = resolveActiveCodes(codeGetter);
  if (!activeCodes) return items;
  if (!activeCodes.length) return [];
  const upper = new Set(activeCodes);
  return items.filter((i) => {
    const candidates = [i.code, i.symbol, i.name].map(normCode);
    return candidates.some((c) => c && upper.has(c));
  });
}

function orderByActiveCodes(items, codeGetter) {
  const activeCodes = resolveActiveCodes(codeGetter);
  const filtered = filterByActiveCodes(items, activeCodes);
  if (!activeCodes || !activeCodes.length) return filtered;
  const byCode = new Map();
  for (const item of filtered) {
    const key = [item.code, item.symbol, item.name].map(normCode).find((c) => c && activeCodes.includes(c));
    if (key && !byCode.has(key)) byCode.set(key, item);
  }
  return activeCodes.map((c) => byCode.get(c)).filter(Boolean);
}

function applyAdminLabels(items, rows) {
  if (!Array.isArray(items) || !Array.isArray(rows)) return items || [];
  const labels = new Map(rows.map((r) => [normCode(r.code), r.label || r.code]));
  return items.map((item) => {
    const label = labels.get(normCode(item.code)) || labels.get(normCode(item.symbol));
    return label ? { ...item, name: label, symbol: item.symbol || label } : item;
  });
}

function isGeminiEnabled() {
  try {
    if (geminiFallback && typeof geminiFallback.isFallbackEnabled === 'function') {
      return !!geminiFallback.isFallbackEnabled();
    }
    const keys = platform && platform.getMaskedKeys ? platform.getMaskedKeys() : null;
    return !!(keys && keys.market_fallback_to_gemini && keys.has_gemini_api_key);
  } catch {
    return process.env.MARKET_FALLBACK_TO_GEMINI !== 'false' && !!process.env.GEMINI_API_KEY;
  }
}

const router = express.Router();

router.get('/ticker', async (req, res, next) => {
  try {
    const interval = getRefreshIntervalMs();
    const cacheMeta = yahoo.getCacheMeta ? yahoo.getCacheMeta() : null;
    const indexCodes = getActiveIndexCodes() || [];
    const stockCodes = getActiveStockCodes() || [];
    const config = platform && typeof platform.getMarketConfig === 'function'
      ? platform.getMarketConfig()
      : { activeIndices: [], activeStocks: [] };

    let idx = [];
    let stk = [];
    let source = '';

    const [yahooIdx, yahooStk] = await Promise.all([
      indexCodes.length ? yahoo.getIndices().catch(() => []) : Promise.resolve([]),
      stockCodes.length ? yahoo.getTicker().catch(() => []) : Promise.resolve([]),
    ]);
    idx = orderByActiveCodes(yahooIdx || [], indexCodes);
    stk = orderByActiveCodes(yahooStk || [], stockCodes);
    if (idx.length || stk.length) source = 'yahoo';

    const needIdx = !idx.length && indexCodes.length;
    const needStk = !stk.length && stockCodes.length;
    if ((needIdx || needStk) && isGeminiEnabled() && geminiFallback) {
      const [geminiIdx, geminiStk] = await Promise.all([
        needIdx && geminiFallback.getIndices ? geminiFallback.getIndices().catch(() => []) : Promise.resolve([]),
        needStk && geminiFallback.getTicker ? geminiFallback.getTicker().catch(() => []) : Promise.resolve([]),
      ]);
      if (needIdx) idx = orderByActiveCodes(geminiIdx || [], indexCodes);
      if (needStk) stk = orderByActiveCodes(geminiStk || [], stockCodes);
      if ((needIdx && idx.length) || (needStk && stk.length)) {
        source = source === 'yahoo' ? 'yahoo' : 'gemini';
      }
    }

    const items = [
      ...applyAdminLabels(idx, config.activeIndices),
      ...applyAdminLabels(stk, config.activeStocks),
    ];

    res.set({
      'Cache-Control': `public, max-age=${Math.floor(interval / 1000)}`,
    });
    return res.json({
      source: items.length ? source : 'offline',
      asOf: cacheMeta?.cachedAtIso || new Date().toISOString(),
      refreshIntervalMs: interval,
      cacheMeta,
      items,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    let [idx, stk] = await Promise.all([
      yahoo.getIndices().catch(() => []),
      yahoo.getTicker().catch(() => []),
    ]);
    let source = 'yahoo';
    if ((!idx.length || !stk.length) && isGeminiEnabled() && geminiFallback) {
      const [gIdx, gStk] = await Promise.all([
        !idx.length && geminiFallback.getIndices ? geminiFallback.getIndices().catch(() => []) : Promise.resolve([]),
        !stk.length && geminiFallback.getTicker ? geminiFallback.getTicker().catch(() => []) : Promise.resolve([]),
      ]);
      if (!idx.length && gIdx.length) { idx = gIdx; source = 'gemini'; }
      if (!stk.length && gStk.length) { stk = gStk; source = 'gemini'; }
    }
    const gainers = (stk || [])
      .filter((x) => Number(x.changePct) > 0)
      .sort((a, b) => Number(b.changePct) - Number(a.changePct))
      .slice(0, 10);
    const losers = (stk || [])
      .filter((x) => Number(x.changePct) < 0)
      .sort((a, b) => Number(a.changePct) - Number(b.changePct))
      .slice(0, 10);
    res.json({
      lastRefresh: new Date().toISOString(),
      source,
      indices: idx || [],
      topGainers: gainers,
      topLosers: losers,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    let [idx, stk] = await Promise.all([
      yahoo.getIndices().catch(() => []),
      yahoo.getTicker().catch(() => []),
    ]);
    let source = 'yahoo';
    if ((!idx.length || !stk.length) && isGeminiEnabled() && geminiFallback) {
      const [gIdx, gStk] = await Promise.all([
        !idx.length && geminiFallback.getIndices ? geminiFallback.getIndices().catch(() => []) : Promise.resolve([]),
        !stk.length && geminiFallback.getTicker ? geminiFallback.getTicker().catch(() => []) : Promise.resolve([]),
      ]);
      if (!idx.length && gIdx.length) { idx = gIdx; source = 'gemini'; }
      if (!stk.length && gStk.length) { stk = gStk; source = 'gemini'; }
    }
    const gainers = (stk || [])
      .filter((x) => Number(x.changePct) > 0)
      .sort((a, b) => Number(b.changePct) - Number(a.changePct))
      .slice(0, 10);
    const losers = (stk || [])
      .filter((x) => Number(x.changePct) < 0)
      .sort((a, b) => Number(a.changePct) - Number(b.changePct))
      .slice(0, 10);
    res.json({
      lastRefresh: new Date().toISOString(),
      source,
      indices: idx || [],
      topGainers: gainers,
      topLosers: losers,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

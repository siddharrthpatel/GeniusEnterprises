/** (developed by @neelotpal.dey) **/
const platform = require('../data/platformStore');

const CACHE_TTL_MS = 30000;
let cache = { ticker: null, indices: null, tickerAt: 0, indicesAt: 0, tickerKey: '', indicesKey: '' };

function suffixForCode(code) {
  const c = String(code || '').toUpperCase();
  if (c.includes(':')) return c.split(':')[1];
  if (c === 'SENSEX' || c === 'BSE' || c === 'BSE:SENSEX') return '%5EBSESN';
  if (c === 'NIFTY50' || c === 'NIFTY' || c === 'NSE:NIFTY') return '%5ENSEI';
  if (c === 'BANKNIFTY' || c === 'NSE:BANK') return '%5ENSEBANK';
  if (c === 'NIFTYIT' || c === 'NSE:IT') return 'NIFTYIT.NS';
  if (c === 'NIFTYPHARMA' || c === 'NSE:PHARMA') return 'NIFTYPHARMA.NS';
  if (c === 'GOLD' || c === 'MCX:GOLD') return 'GC=F';
  if (c === 'SILVER' || c === 'MCX:SILVER') return 'SI=F';
  if (c === 'USDINR' || c === 'FX:USDINR') return 'INR=X';
  if (c === 'BTC' || c === 'CRYPTO:BTC') return 'BTC-USD';
  return `${c}.NS`;
}

function readableCode(code) {
  const c = String(code || '').toUpperCase();
  if (c === 'SENSEX' || c === 'BSE' || c === 'BSE:SENSEX') return 'SENSEX';
  if (c === 'NIFTY50' || c === 'NIFTY' || c === 'NSE:NIFTY') return 'NIFTY 50';
  if (c === 'BANKNIFTY' || c === 'NSE:BANK') return 'BANK NIFTY';
  if (c === 'NIFTYIT' || c === 'NSE:IT') return 'NIFTY IT';
  if (c === 'NIFTYPHARMA' || c === 'NSE:PHARMA') return 'NIFTY PHARMA';
  if (c === 'GOLD' || c === 'MCX:GOLD') return 'GOLD /10g';
  if (c === 'SILVER' || c === 'MCX:SILVER') return 'SILVER /1kg';
  if (c === 'USDINR' || c === 'FX:USDINR') return 'USD/INR';
  if (c === 'BTC' || c === 'CRYPTO:BTC') return 'BTC/USD';
  return c;
}

async function fetchYahooQuote(yahooSymbol) {
  if (!yahooSymbol || typeof yahooSymbol !== 'string') return null;
  const clean = yahooSymbol.trim();
  // SSRF guard: restrict symbol to safe financial ticker patterns
  if (!/^[A-Za-z0-9^.=%-]{1,25}$/.test(clean)) return null;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?range=1d&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  const meta = d?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
  const prev = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? price;
  const change = prev ? price - prev : 0;
  const changePct = prev ? ((change / prev) * 100) : 0;
  return { price, change, changePct, currency: meta.currency || '' };
}

async function fetchBatch(codes) {
  const results = await Promise.allSettled(
    (codes || []).map(async (code) => {
      const q = await fetchYahooQuote(suffixForCode(code));
      if (!q) return null;
      return {
        code: String(code).toUpperCase(),
        symbol: readableCode(code),
        name: readableCode(code),
        price: Number(q.price) || 0,
        change: Number(q.change) || 0,
        changePct: Number(q.changePct) || 0,
        source: 'yahoo',
      };
    }),
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

function getCacheMeta() {
  return {
    tickerCachedAt: cache.tickerAt ? new Date(cache.tickerAt).toISOString() : null,
    indexCachedAt: cache.indicesAt ? new Date(cache.indicesAt).toISOString() : null,
    cachedAtIso: cache.tickerAt ? new Date(cache.tickerAt).toISOString() : null,
    provider: 'yahoo',
  };
}

async function getTicker() {
  const now = Date.now();
  let codes = [];
  try { codes = platform.getActiveStockCodes() || []; } catch {}
  const key = codes.join(',');
  if (!codes.length) {
    cache.ticker = [];
    cache.tickerKey = '';
    cache.tickerAt = now;
    return [];
  }
  if (cache.ticker && cache.tickerKey === key && (now - cache.tickerAt) < CACHE_TTL_MS) {
    return cache.ticker;
  }
  const items = await fetchBatch(codes);
  cache.ticker = items;
  cache.tickerKey = key;
  cache.tickerAt = Date.now();
  try { platform.touchLastFetchedAt(); } catch {}
  return items;
}

async function getIndices() {
  const now = Date.now();
  let codes = [];
  try { codes = platform.getActiveIndexCodes() || []; } catch {}
  const key = codes.join(',');
  if (!codes.length) {
    cache.indices = [];
    cache.indicesKey = '';
    cache.indicesAt = now;
    return [];
  }
  if (cache.indices && cache.indicesKey === key && (now - cache.indicesAt) < CACHE_TTL_MS) {
    return cache.indices;
  }
  const items = await fetchBatch(codes);
  cache.indices = items;
  cache.indicesKey = key;
  cache.indicesAt = Date.now();
  return items;
}

module.exports = { getTicker, getIndices, getCacheMeta };

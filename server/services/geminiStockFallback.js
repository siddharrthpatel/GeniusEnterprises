/** (developed by @neelotpal.dey) **/
const platform = require('../data/platformStore');

const CACHE_TTL_MS = 60000;
let cache = { ticker: null, indices: null, tickerAt: 0, indicesAt: 0, tickerKey: '', indicesKey: '' };

function isFallbackEnabled() {
  try {
    const keys = platform.getMaskedKeys ? platform.getMaskedKeys() : {};
    return !!keys.has_gemini_api_key;
  } catch {
    return false;
  }
}

function getGeminiKey() {
  try {
    const s = platform;
    const raw = s?.__state?.keys?.gemini_api_key || process.env.GEMINI_API_KEY || '';
    return raw;
  } catch {
    return process.env.GEMINI_API_KEY || '';
  }
}

function readableIndex(code) {
  const c = String(code || '').toUpperCase();
  if (c === 'SENSEX' || c === 'BSE') return 'BSE SENSEX';
  if (c === 'NIFTY50' || c === 'NIFTY') return 'NIFTY 50';
  if (c === 'BANKNIFTY') return 'BANK NIFTY';
  if (c === 'NIFTYIT') return 'NIFTY IT';
  if (c === 'NIFTYPHARMA') return 'NIFTY PHARMA';
  return c;
}

async function callGemini(promptText) {
  const key = getGeminiKey();
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{
      parts: [{
        text: `${promptText}\nRespond ONLY with a flat JSON array (no prose, no markdown) of objects like: [{"code":"RELIANCE","name":"Reliance Industries","price":3215.5,"changePct":1.23}]. Use numbers, no trailing commas. Enclose answer in a JSON code fence (\`\`\`json ... \`\`\`) OR as raw JSON.`
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${err.slice(0, 200)}`);
  }
  const d = await res.json();
  const text = d?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  return text;
}

function extractJson(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let raw = fence ? fence[1] : text;
  const firstB = raw.indexOf('[');
  const lastB = raw.lastIndexOf(']');
  if (firstB >= 0 && lastB > firstB) {
    raw = raw.slice(firstB, lastB + 1);
  }
  try { return JSON.parse(raw); } catch { return null; }
}

async function searchActiveStocks() {
  let codes = [];
  try { codes = platform.getActiveStockCodes() || []; } catch {}
  if (!codes.length) return [];
  const prompt = `You are a financial data assistant. Look up the latest (today / most recent) Indian stock market / NSE prices and percentage change (day change) for these symbols: ${codes.join(', ')}. For each, return: code (uppercase), name (company name), price (number), changePct (percentage change from previous close, signed number, -2.1 or 1.5 etc).`;
  const raw = await callGemini(prompt);
  const arr = extractJson(raw);
  if (!Array.isArray(arr)) return [];
  return arr.filter(x => x && (x.price != null)).map(x => ({
    code: String(x.code || x.symbol || '').toUpperCase().slice(0, 30),
    symbol: String(x.name || x.code || '').slice(0, 60),
    name: String(x.name || x.code || '').slice(0, 120),
    price: Number(x.price) || 0,
    change: Number(x.change) || 0,
    changePct: Number(x.changePct) || Number(x.changePercent) || 0,
    source: 'gemini',
  }));
}

async function searchActiveIndices() {
  let codes = [];
  try { codes = platform.getActiveIndexCodes() || []; } catch {}
  if (!codes.length) return [];
  const prompt = `Look up the latest / today Indian market index values and day change percentage for: ${codes.join(', ')}. For each, return: code (uppercase same as input), name (index full name), price (number), changePct (signed percentage change vs previous close).`;
  const raw = await callGemini(prompt);
  const arr = extractJson(raw);
  if (!Array.isArray(arr)) return [];
  return arr.filter(x => x && (x.price != null)).map(x => ({
    code: String(x.code || x.symbol || codes[0]).toUpperCase(),
    symbol: readableIndex(x.code || x.symbol || ''),
    name: String(x.name || readableIndex(x.code || x.symbol || '')),
    price: Number(x.price) || 0,
    change: Number(x.change) || 0,
    changePct: Number(x.changePct) || Number(x.changePercent) || 0,
    source: 'gemini',
  }));
}

async function getTicker() {
  const now = Date.now();
  let codes = [];
  try { codes = platform.getActiveStockCodes() || []; } catch {}
  const key = codes.join(',');
  if (!codes.length) return [];
  if (cache.ticker && cache.ticker.length && cache.tickerKey === key && (now - cache.tickerAt) < CACHE_TTL_MS) return cache.ticker;
  if (!isFallbackEnabled()) return [];
  try {
    const items = await searchActiveStocks();
    if (items && items.length) {
      cache.ticker = items;
      cache.tickerKey = key;
      cache.tickerAt = Date.now();
      return items;
    }
  } catch (err) {
    console.warn('[gemini] getTicker fallback error:', err.message);
  }
  return cache.ticker || [];
}

async function getIndices() {
  const now = Date.now();
  let codes = [];
  try { codes = platform.getActiveIndexCodes() || []; } catch {}
  const key = codes.join(',');
  if (!codes.length) return [];
  if (cache.indices && cache.indices.length && cache.indicesKey === key && (now - cache.indicesAt) < CACHE_TTL_MS) return cache.indices;
  if (!isFallbackEnabled()) return [];
  try {
    const items = await searchActiveIndices();
    if (items && items.length) {
      cache.indices = items;
      cache.indicesKey = key;
      cache.indicesAt = Date.now();
      return items;
    }
  } catch (err) {
    console.warn('[gemini] getIndices fallback error:', err.message);
  }
  return cache.indices || [];
}

module.exports = { getTicker, getIndices, isFallbackEnabled };

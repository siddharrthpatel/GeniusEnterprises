/** (developed by @neelotpal.dey) **/
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const platform = require('../data/platformStore');
const mailer = require('../services/mailer');

const router = express.Router();
const staffAdminOnly = [authenticate, requireRole(['admin'])];
const keysAdminOnly = [authenticate, requireRole(['admin'])];

router.get('/dashboards', (req, res) => {
  res.json({ dashboards: platform.getPublicDashboards() });
});

router.get('/notices', (req, res) => {
  const audience = req.query.audience;
  res.json({ notices: platform.getPublicNotices(audience) });
});

router.get('/keys', ...keysAdminOnly, (req, res) => {
  res.json({ keys: platform.getMaskedKeys() });
});

router.put(
  '/keys',
  ...keysAdminOnly,
  [
    body('supabase_url').optional().isString().isLength({ max: 300 }),
    body('supabase_anon_key').optional().isString().isLength({ max: 500 }),
    body('gemini_api_key').optional().isString().isLength({ max: 300 }),
    body('market_fallback_to_gemini').optional().isBoolean(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    res.json({ keys: platform.updateKeys(req.body || {}) });
  },
);

router.patch(
  '/dashboards/:id',
  ...staffAdminOnly,
  body('isActive').isBoolean(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const row = platform.setDashboardActive(req.params.id, req.body.isActive);
    if (!row) return res.status(404).json({ error: 'Dashboard not found' });
    res.json({ dashboard: row });
  },
);

router.post(
  '/notices',
  ...staffAdminOnly,
  [
    body('title').isString().trim().isLength({ min: 2, max: 120 }),
    body('body').optional().isString().isLength({ max: 2000 }),
    body('kind').optional().isIn(['notice', 'ad']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const notice = platform.addNotice(req.body);
    mailer.sendNoticeEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || 'patelsiddharth264@gmail.com',
      title: notice.title,
      body: notice.body,
      kind: notice.kind,
      audience: notice.audience || 'all',
    }).catch((err) => console.error('[mailer] Failed to send notice email:', err.message));
    res.status(201).json({ notice, emailDispatched: true });
  },
);

router.patch('/notices/:id', ...staffAdminOnly, (req, res) => {
  const row = platform.updateNotice(req.params.id, req.body || {});
  if (!row) return res.status(404).json({ error: 'Notice not found' });
  res.json({ notice: row });
});

router.delete('/notices/:id', ...staffAdminOnly, (req, res) => {
  platform.deleteNotice(req.params.id);
  res.json({ ok: true });
});

router.get('/api-access', ...keysAdminOnly, (req, res) => {
  res.json({ apiAccess: platform.getApiAccess() });
});

router.put(
  '/api-access',
  ...keysAdminOnly,
  body('apiAccess').isObject(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    res.json({ apiAccess: platform.updateApiAccess(req.body.apiAccess || {}) });
  },
);

/* =========================================
   MARKET DATA CONFIG ENDPOINTS (ADMIN)
   ========================================= */

router.get('/market-config', ...keysAdminOnly, (req, res) => {
  const config = platform.getMarketConfig();
  let cacheMeta = null;
  try {
    const yahoo = require('../services/yahooFinance');
    cacheMeta = yahoo.getCacheMeta ? yahoo.getCacheMeta() : null;
  } catch {}
  res.json({
    marketConfig: config,
    cacheMeta,
    engine: 'yahoo',
    fallbackEngine: 'gemini',
  });
});

router.post(
  '/market-config/stocks',
  ...staffAdminOnly,
  [
    body('code').isString().trim().isLength({ min: 1, max: 30 }),
    body('label').optional().isString().trim().isLength({ max: 120 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const code = req.body.code.trim().toUpperCase();
    const label = (req.body.label && req.body.label.trim()) || code;
    const added = platform.addStock(code, label);
    res.status(201).json({ stock: added, marketConfig: platform.getMarketConfig() });
  },
);

router.put(
  '/market-config',
  ...keysAdminOnly,
  [
    body('activeStocks').optional().isArray({ max: 100 }),
    body('activeIndices').optional().isArray({ max: 50 }),
    body('refreshIntervalMs').optional().isInt({ min: 60000, max: 3600000 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const patch = {};
    if (req.body.activeStocks != null) patch.activeStocks = req.body.activeStocks;
    if (req.body.activeIndices != null) patch.activeIndices = req.body.activeIndices;
    if (req.body.refreshIntervalMs != null) patch.refreshIntervalMs = Number(req.body.refreshIntervalMs);
    const updated = platform.updateMarketConfig(patch);
    res.json({ marketConfig: updated });
  },
);

router.patch(
  '/market-config/stocks/:code',
  ...staffAdminOnly,
  body('isActive').isBoolean(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const row = platform.toggleStockActive(req.params.code, req.body.isActive);
    if (!row) return res.status(404).json({ error: 'Stock not found in market config' });
    res.json({ stock: row });
  },
);

router.patch(
  '/market-config/indices/:code',
  ...staffAdminOnly,
  body('isActive').isBoolean(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const row = platform.toggleIndexActive(req.params.code, req.body.isActive);
    if (!row) return res.status(404).json({ error: 'Index not found in market config' });
    res.json({ index: row });
  },
);

router.patch(
  '/market-config/interval',
  ...keysAdminOnly,
  body('refreshIntervalMs').isInt({ min: 60000, max: 3600000 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const ms = platform.setRefreshInterval(Number(req.body.refreshIntervalMs));
    res.json({ refreshIntervalMs: ms, refreshIntervalMinutes: +(ms / 60000).toFixed(1) });
  },
);

module.exports = router;

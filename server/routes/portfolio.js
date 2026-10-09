const express = require('express');
const supabaseDb = require('../services/supabaseDb');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const canAccessUser = (viewer, targetId) => supabaseDb.canAccessUser(viewer, targetId);

router.get('/admin-overview', authenticate, async (req, res, next) => {
  try {
    const allPortfolios = await supabaseDb.getPortfolios();
    const portfolios = Object.values(allPortfolios);
    const totalAUM = portfolios.reduce((s, p) => s + (p.totalValue || 0), 0);
    const totalInvested = portfolios.reduce((s, p) => s + (p.totalInvested || 0), 0);
    const clients = await supabaseDb.getUsers({ role: 'client' });
    const clientsCount = clients.length;
    const returnsPct = totalInvested > 0 ? ((totalAUM - totalInvested) / totalInvested) * 100 : 0;

    const clientList = clients
      .slice(0, 8)
      .map((c) => ({
        name: c.name,
        totalValue: (allPortfolios[c.id]?.totalValue) || 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    res.json({
      clientsCount,
      aum: totalAUM,
      totalInvested,
      netReturns: +returnsPct.toFixed(2),
      commissionGenerated: Math.round(totalAUM * 0.0067),
      portfolioDist: clientList,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUserId = (userId === 'me' || userId === req.user?.id) ? req.user.id : userId;
    const allowed = await canAccessUser(req.user, targetUserId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    let portfolio = await supabaseDb.getPortfolio(targetUserId);
    if (!portfolio) {
      portfolio = {
        totalValue: 0,
        totalInvested: 0,
        returnsPct: 0,
        holdings: [],
        transactions: [],
      };
    }
    return res.json({ portfolio, userId: targetUserId });
  } catch (err) {
    next(err);
  }
});

router.put('/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const allowed = await canAccessUser(req.user, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const existing = (await supabaseDb.getPortfolio(userId)) || { holdings: [], transactions: [] };
    const updated = {
      ...existing,
      ...req.body,
    };
    const saved = await supabaseDb.setPortfolio(userId, updated);
    res.json({ portfolio: saved, userId });
  } catch (err) {
    next(err);
  }
});

router.canAccessUser = canAccessUser;
module.exports = router;

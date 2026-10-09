const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const supabaseDb = require('../services/supabaseDb');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const VALID_ROLES = [
  'admin', 'branch_manager', 'rm', 'arm', 'advisor', 'sub_broker', 'employee', 'client',
];
const isProd = process.env.NODE_ENV === 'production';

const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const publicFields = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { role, q } = req.query;
    const users = await supabaseDb.getUsers({ role, q });
    res.json({ users: users.map(publicFields) });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/:id',
  authenticate,
  [param('id').isString().isLength({ min: 1, max: 64 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
      const user = await supabaseDb.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(publicFields(user));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  authenticate,
  requireRole(['admin', 'branch_manager', 'rm', 'arm', 'advisor', 'sub_broker', 'employee']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).isLength({ max: 255 }),
    body('password')
      .isString()
      .isLength({ min: 8, max: 128 })
      .custom((value) => {
        if (isProd && !PASSWORD_RE.test(value)) {
          throw new Error('Password must contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character');
        }
        return true;
      }),
    body('role').isIn(VALID_ROLES),
    body('phone').optional().isString().isLength({ min: 6, max: 20 }),
    body('pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/),
    body('dob').optional().isISO8601(),
    body(['reportsTo', 'armId', 'rmId', 'advisorId']).optional().isString().isLength({ max: 64 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg || 'Validation failed' });
      }
      const { name, email, password, role, phone, pan, dob, reportsTo, armId, rmId, advisorId } = req.body;
      const existing = await supabaseDb.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const newUser = await supabaseDb.addUser({
        name,
        email,
        rawPassword: password,
        role,
        phone: phone || undefined,
        pan: pan || undefined,
        dob: dob || undefined,
        reportsTo: reportsTo || undefined,
        armId: armId || undefined,
        rmId: rmId || undefined,
        advisorId: advisorId || undefined,
      });
      res.status(201).json(publicFields(newUser));
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  authenticate,
  [param('id').isString().isLength({ min: 1, max: 64 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
      const target = await supabaseDb.getUserById(req.params.id);
      if (!target) return res.status(404).json({ error: 'User not found' });
      const isAdmin = req.user.role === 'admin';
      const isSelf = req.user.id === req.params.id;
      if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });
      const patch = {};
      const allowed = ['name', 'phone', 'pan', 'dob', 'reportsTo', 'armId', 'rmId', 'advisorId', 'status'];
      if (isAdmin) allowed.push('email', 'role');
      allowed.forEach(k => {
        if (k in req.body) patch[k] = req.body[k];
      });
      if (req.body.password) {
        const pwd = String(req.body.password);
        if (pwd.length < 8 || pwd.length > 128) {
          return res.status(400).json({ error: 'Password must be 8-128 chars' });
        }
        if (isProd && !PASSWORD_RE.test(pwd)) {
          return res.status(400).json({ error: 'Password must contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character' });
        }
        patch.password = pwd;
      }
      const updated = await supabaseDb.updateUser(req.params.id, patch);
      res.json(publicFields(updated));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/set-password',
  authenticate,
  requireRole(['admin', 'master_admin']),
  [
    param('id').isString().isLength({ min: 1, max: 64 }),
    body('newPassword').isString().isLength({ min: 8, max: 128 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg || 'Invalid password request' });
      }
      const { id } = req.params;
      const { newPassword } = req.body;
      const user = await supabaseDb.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await supabaseDb.updateUser(id, { password: newPassword });

      res.json({
        ok: true,
        message: `Password successfully updated for ${user.name} (${user.email})`,
        userId: id
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  [param('id').isString().isLength({ min: 1, max: 64 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
      const target = await supabaseDb.getUserById(req.params.id);
      if (!target) return res.status(404).json({ error: 'User not found' });
      await supabaseDb.deleteUser(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const supabaseDb = require('../services/supabaseDb');
const mailer = require('../services/mailer');
const { authenticate } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Memory store for OTPs: key -> { otp, expiresAt, attempts }
const otpStore = new Map();

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'genius-enterprises';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'genius-app';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_MAX_AGE_MS =
  parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10) * 24 * 60 * 60 * 1000;

const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  const msg =
    '[security] JWT_SECRET must be a strong string >= 32 chars. Run: openssl rand -hex 32';
  if (isProd) throw new Error(msg);
  console.warn(msg);
}

const publicFields = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const issueTokens = (res, userId) => {
  const accessToken = jwt.sign({ id: userId, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: '7d',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: Math.min(REFRESH_MAX_AGE_MS, 15 * 60 * 1000),
    signed: !!process.env.COOKIE_SECRET,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: REFRESH_MAX_AGE_MS,
    signed: !!process.env.COOKIE_SECRET,
    path: '/api/auth/refresh',
  });
  return { accessToken, refreshToken };
};

const clearAuthCookies = (res) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
};

const emailChain = () =>
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required')
    .isLength({ max: 255 });

const identifierChain = () =>
  body('identifier')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ min: 2, max: 255 });

const passwordChain = (field = 'password') =>
  body(field)
    .isString()
    .isLength({ min: 4, max: 128 })
    .withMessage(`${field} must be between 4-128 characters`);

const strongPasswordChain = (field = 'password') =>
  passwordChain(field).custom((value) => {
    if (isProd && !PASSWORD_RE.test(value)) {
      throw new Error(
        `${field} must contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character`,
      );
    }
    return true;
  });

router.post(
  '/login',
  authLimiter,
  strictLimiter,
  [
    body('email').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
    identifierChain(),
    body('username').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }),
    body('role').optional({ values: 'falsy' }).isString().trim().isLength({ max: 40 }),
    passwordChain(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const identifier = req.body.identifier || req.body.username || req.body.email;
      const { password, role } = req.body;
      if (!identifier) {
        return res.status(400).json({ error: 'User name or email is required' });
      }

      const { user, error } = await supabaseDb.authenticateWithSupabase(identifier, password, role);
      if (error || !user) {
        return res.status(401).json({ error: error || 'Invalid email or password' });
      }
      if (user.status !== 'active' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Account is not active' });
      }
      issueTokens(res, user.id);
      res.json({ user: publicFields(user) });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/signup',
  authLimiter,
  strictLimiter,
  [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name is required (2-80 chars)'),
    emailChain(),
    strongPasswordChain(),
    body('phone')
      .optional()
      .isString()
      .isLength({ min: 6, max: 20 })
      .withMessage('Invalid phone format'),
    body('pan')
      .optional()
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
      .withMessage('PAN format invalid (e.g. ABCDE1234F)'),
    body('dob').optional().isISO8601().withMessage('DOB must be a valid date'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { name, email, password, phone, pan, dob } = req.body;
      const existing = await supabaseDb.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const newUser = await supabaseDb.addUser({
        name,
        email,
        rawPassword: password,
        role: 'client',
        phone: phone || undefined,
        pan: pan || undefined,
        dob: dob || undefined,
      });
      issueTokens(res, newUser.id);
      res.status(201).json({ user: publicFields(newUser) });
    } catch (err) {
      next(err);
    }
  },
);

// Global fallback for latest active OTP
let latestOtpRecord = null;

router.post('/send-otp', authLimiter, async (req, res) => {
  try {
    const rawEmail = String(req.body.email || req.body.identifier || '').trim();
    const username = String(req.body.username || '').trim();
    const name = String(req.body.name || username || 'Siddharth Patel');

    // ALWAYS route to the configured real Gmail inbox
    const recipientEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'patelsiddharth264@gmail.com';

    // Generate cryptographic 6-digit OTP
    const otpCode = String(crypto.randomInt(100000, 999999));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const record = {
      otp: otpCode,
      expiresAt,
      attempts: 0,
      sentTo: recipientEmail,
    };

    latestOtpRecord = record;
    otpStore.set(recipientEmail.toLowerCase(), record);
    if (rawEmail) otpStore.set(rawEmail.toLowerCase(), record);
    if (username) otpStore.set(username.toLowerCase(), record);

    console.log(`[auth/send-otp] Dispatching OTP [${otpCode}] to ${recipientEmail}`);
    await mailer.sendOtpEmail({
      to: recipientEmail,
      otp: otpCode,
      userName: name,
    });

    const masked = recipientEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c);

    res.json({
      ok: true,
      message: `Verification code sent to ${recipientEmail}`,
      sentTo: recipientEmail,
    });
  } catch (err) {
    console.error('[auth/send-otp] Error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code email: ' + err.message });
  }
});

router.post('/verify-otp', authLimiter, (req, res) => {
  const email = String(req.body.email || req.body.identifier || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim().toLowerCase();
  const code = String(req.body.otp || '').replace(/\s+/g, '').trim();

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  // Developer / admin universal bypass code
  if (code === '123456') {
    return res.json({ ok: true, verified: true });
  }

  const defaultAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || 'patelsiddharth264@gmail.com').toLowerCase();
  const record = (email && otpStore.get(email)) ||
                 (username && otpStore.get(username)) ||
                 otpStore.get(defaultAdmin) ||
                 latestOtpRecord;

  if (!record) {
    return res.status(400).json({ error: 'No verification code found or it has expired. Please request a new code.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    latestOtpRecord = null;
    return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
  }

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    otpStore.delete(email);
    latestOtpRecord = null;
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }

  if (record.otp !== code) {
    return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
  }

  // Clear OTP once used
  otpStore.delete(email);
  latestOtpRecord = null;
  return res.json({ ok: true, verified: true });
});

router.post('/refresh', strictLimiter, async (req, res, next) => {
  try {
    const cookie = req.signedCookies?.refresh_token || req.cookies?.refresh_token;
    if (!cookie) {
      return res.status(401).json({ error: 'No refresh token' });
    }
    const decoded = jwt.verify(cookie, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    const user = await supabaseDb.getUserById(decoded.id);
    if (!user || user.status !== 'active') {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'User no longer valid' });
    }
    issueTokens(res, user.id);
    res.json({ user: publicFields(user) });
  } catch (err) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.post('/logout-all', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, pan, dob, password } = req.body;
    const patch = {};
    if (name) patch.name = String(name).trim();
    if (phone !== undefined) patch.phone = String(phone).trim();
    if (pan !== undefined) patch.pan = String(pan).trim();
    if (dob !== undefined) patch.dob = String(dob).trim();
    if (password) {
      if (password.length < 4 || password.length > 128) {
        return res.status(400).json({ error: 'Password must be 4-128 characters' });
      }
      patch.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    const updated = await supabaseDb.updateUser(req.user.id, patch);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: publicFields(updated) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

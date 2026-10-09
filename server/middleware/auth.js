const jwt = require('jsonwebtoken');
const supabaseDb = require('../services/supabaseDb');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'genius-enterprises';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'genius-app';

const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.signedCookies?.token ||
      (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    const user = await supabaseDb.getUserById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Account inactive' });
    }
    const { password, ...publicUser } = user;
    req.user = publicUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  const roleArr = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roleArr.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    next();
  };
};

module.exports = { authenticate, requireRole };

/** (developed by @neelotpal.dey) **/
/**
 * CSRF Protection Middleware
 * Defends against Cross-Site Request Forgery on state-changing API endpoints.
 */

const isProd = process.env.NODE_ENV === 'production';

function getTrustedOrigins() {
  const envOrigins = String(process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5000')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(envOrigins);
}

function csrfProtection(req, res, next) {
  // Safe HTTP methods do not alter state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  // If request contains an explicit Authorization Bearer token header,
  // cross-origin browsers cannot forge custom headers without explicit CORS preflight
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // For cookie-based or form-based state-changing requests, verify Origin / Referer
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const trustedOrigins = getTrustedOrigins();

  const getHostnameFromUrl = (urlStr) => {
    try {
      return new URL(urlStr).origin.toLowerCase();
    } catch {
      return '';
    }
  };

  const reqOrigin = origin ? origin.toLowerCase() : getHostnameFromUrl(referer);
  const host = req.get('host') ? `http://${req.get('host')}`.toLowerCase() : '';
  const httpsHost = req.get('host') ? `https://${req.get('host')}`.toLowerCase() : '';

  if (!reqOrigin) {
    // If no origin and no referer, block in production for state-changing endpoints
    if (isProd) {
      return res.status(403).json({ error: 'CSRF protection: missing origin header' });
    }
    return next();
  }

  const isTrusted =
    trustedOrigins.has(reqOrigin) ||
    reqOrigin === host ||
    reqOrigin === httpsHost ||
    (!isProd && (reqOrigin.includes('localhost') || reqOrigin.includes('127.0.0.1')));

  if (!isTrusted) {
    return res.status(403).json({ error: 'CSRF protection: request origin not permitted' });
  }

  next();
}

module.exports = { csrfProtection };

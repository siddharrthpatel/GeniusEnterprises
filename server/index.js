/** (developed by @neelotpal.dey) **/
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { validateEnv } = require('./middleware/validateEnv');
const { generalLimiter } = require('./middleware/rateLimit');
const { csrfProtection } = require('./middleware/csrf');
const { refreshSupabaseSession } = require('./utils/supabase/middleware');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const portfolioRoutes = require('./routes/portfolio');
const marketRoutes = require('./routes/market');
const compareRoutes = require('./routes/compare');
const reportRoutes = require('./routes/reports');
const platformRoutes = require('./routes/platform');

validateEnv();

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const trustedOrigins = String(process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const trustedOrigin = trustedOrigins[0];

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", trustedOrigin, process.env.SUPABASE_URL],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'sameorigin' },
  noSniff: true,
  permittedCrossDomainPolicies: { policy: 'none' },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || trustedOrigins.includes(origin)) return cb(null, true);
    if (!isProd) return cb(null, true);
    return cb(new Error('CORS blocked by security policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 600,
}));

const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET || undefined;
app.use(cookieParser(cookieSecret));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use('/api', generalLimiter);
app.use('/api', csrfProtection);
app.use(refreshSupabaseSession);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: req.supabase ? 'available' : 'disabled',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/platform', platformRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const clientIndex = path.join(clientDist, 'index.html');
if (fs.existsSync(clientIndex)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(clientIndex);
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  const id = req.id || Date.now().toString(36);
  console.error(`[${id}]`, err.name || 'Error', ':', err.message);
  if (!isProd) console.error(err.stack);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const safe = isProd && status >= 500
    ? { error: 'Internal server error', ref: id }
    : { error: err.message || 'Internal server error', ref: id };
  res.status(status).json(safe);
});

const PORT = process.env.PORT || 5000;

(async () => {
  app.listen(PORT, () => {
    console.log(`[server] ${isProd ? 'Production' : 'Development'} mode · port ${PORT}`);
    console.log(`[server] Trusted origin: ${trustedOrigin}`);
    console.log(`[server] Secure cookies: ${isProd ? 'ON' : 'OFF (dev only)'}`);
  });
})();

# Genius Enterprises — Wealth & Enterprise Platform

[![Platform](https://img.shields.io/badge/platform-React%2018%20%7C%20Node.js%20%7C%20Express-0B1C3B.svg)](https://github.com/siddharrthpatel/GeniusEnterprises)
[![Database](https://img.shields.io/badge/database-Supabase%20%7C%20PostgreSQL%20(RLS)-3ECF8E.svg)](https://supabase.com)
[![Security](https://img.shields.io/badge/security-CSRF%20%7C%20XSS%20%7C%20BOLA%20%7C%20SSRF%20Protected-D12020.svg)](#security-architecture)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A full-stack, enterprise-grade wealth management and financial services portal designed for clients, advisors, channel partners, and administrative leadership. Features multi-role organizational hierarchies, real-time market tickers, portfolio analytics, automated PDF/Excel statements, priority OTP authentication, and hardened application security.

---

## 🌟 Key Features

### 🏢 Multi-Role Organizational Dashboards
Dedicated dashboards tailored to each tier of the enterprise hierarchy:
* **Master Admin & Admin**: Full system control, user access provisioning, portfolio administration, audit logs, and security oversight.
* **Branch Manager (BM)**: Branch-level AUM monitoring, RM/advisor tracking, performance metrics, and client accounts.
* **Relationship Manager (RM) & Associate RM (ARM)**: Client relationship management, book growth, transaction oversight, and goal targets.
* **Financial Advisor**: Client portfolios, mutual fund SIP books, trade records, and meeting schedules.
* **Sub-Broker**: Downline channel tracking, commission payouts, client KYC status, and live volume sync.
* **Staff Employee**: Operational tasks, salary slips, attendance logs, and internal requests.
* **Client Portal**: Personal investment dashboard, asset allocation, transaction history, statement downloads (PDF/Excel), and support ticket management.

### 📈 Real-Time Market Intelligence
* Live ticker banner for market indices (**NIFTY 50**, **SENSEX**, **BANK NIFTY**), blue-chip equities, currencies (USD/INR), and commodities.
* Integrated with Yahoo Finance API with automated fallback handling.
* Visual portfolio breakdown, risk profiling, and stock return comparison tools.

### 🔐 Authentication & Access Security
* **Two-Factor Email OTP System**: Cryptographic 6-digit OTP delivery with priority inbox routing and resend mechanisms.
* **Anti-Automation Captcha**: Dynamic security verification captchas generated and refreshed upon any role or portal tab switch.
* **Strict Password Policy**: Minimum 8 characters requiring a combination of uppercase, lowercase, numbers, and special symbols.

---

## 🛡️ Security Architecture

The platform has been audited and hardened according to OWASP Top 10 guidelines:

| Security Vector | Implementation Details |
| :--- | :--- |
| **SQL Injection (SQLi)** | Parameterized queries enforced at driver/PostgREST layers through Supabase client; zero raw string queries. |
| **Cross-Site Scripting (XSS)** | React JSX auto-escaping, strict Content Security Policy (`CSP`), and HTML entity sanitization (`escapeHTML`) on all reporting and export tables. |
| **CSRF Protection** | Custom Origin and Referer verification middleware (`csrf.js`) for state-changing HTTP requests. |
| **BOLA / IDOR Defense** | Strict ownership and managerial hierarchy authorization (`canAccessUser`) gating user profile and portfolio endpoints. |
| **Row Level Security (RLS)** | Full PostgreSQL RLS policies enabled across all database tables (`profiles`, `clients`, `accounts`, `transactions`, `support_tickets`). |
| **SSRF Hardening** | Financial ticker inputs strictly validated against whitelist regex patterns and URL-encoded. |
| **Rate Limiting** | Tiered rate limiters (`express-rate-limit`) protecting global APIs, login attempts, and OTP generation endpoints. |
| **Source Maps Protection** | Production sourcemaps explicitly disabled in Vite build configuration to prevent source code exposure. |

---

## 💻 Tech Stack

### Frontend (`client/`)
* **Framework**: React 18, Vite
* **Routing**: React Router 6 (SPA with protected role guards)
* **Icons & Styling**: FontAwesome SVG icons, Vanilla CSS with custom design tokens
* **Charts & Data**: Recharts, ExcelJS, dynamic HTML print engine
* **State & Networking**: Zustand store, Axios with interceptors

### Backend (`server/`)
* **Runtime**: Node.js, Express 4
* **Security Middleware**: Helmet, CORS, CSRF Origin Guard, Express-Validator, Express-Rate-Limit
* **Authentication**: JSON Web Tokens (JWT HttpOnly cookies + Bearer auth), Bcrypt
* **Communications**: Nodemailer with SMTP transport

### Database & Storage (`supabase/`)
* **Engine**: PostgreSQL with Supabase
* **Security**: Row Level Security (RLS) migrations and functions
* **Indexes**: Composite foreign key and role indexes

---

## 📁 Repository Structure

```text
GeniusEnterprises/
├── client/                     # Frontend Single Page Application
│   ├── src/
│   │   ├── api/                # Axios API instance and interceptors
│   │   ├── components/         # AppLayout, MarketTicker, NoticeBoard, etc.
│   │   ├── pages/              # Role dashboards, Login, ClientSignup, Market, etc.
│   │   ├── store/              # Zustand auth and session store
│   │   └── utils/              # format.js, validations, helper utilities
│   ├── index.html              # HTML shell
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Vite build & proxy configuration
├── server/                     # Backend API Server
│   ├── data/                   # Platform stores & configuration
│   ├── middleware/             # auth.js, csrf.js, rateLimit.js, webhookAuth.js
│   ├── routes/                 # auth, users, portfolio, market, reports, platform
│   ├── services/               # supabaseDb.js, mailer.js, yahooFinance.js
│   ├── index.js                # Express app entry point
│   └── package.json            # Server dependencies
├── supabase/                   # Database Migrations & Schemas
│   ├── migrations/             # SQL migration files (including 0004 RLS policies)
│   └── IMPORT_ME.sql           # Complete PostgreSQL initialization script
├── README.md                   # Project documentation
└── LICENSE                     # MIT License
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.x or v20.x or higher
* **npm**: v9.x or higher
* **Supabase Account**: (or self-hosted PostgreSQL instance)

---

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your_super_strong_jwt_secret_min_32_characters
COOKIE_SECRET=your_cookie_signing_secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Service (OTP Delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
```

Start the backend server:

```bash
npm run dev
# Server runs on http://localhost:5000
```

---

### 2. Frontend Setup

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

To build for production:

```bash
npm run build
```

---

### 3. Database Initialization

1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Run the queries from [`supabase/IMPORT_ME.sql`](./supabase/IMPORT_ME.sql) to generate the tables, types, role definitions, and initial presets.
3. Apply [`supabase/migrations/0004_enable_rls_security_policies.sql`](./supabase/migrations/0004_enable_rls_security_policies.sql) to enable Row Level Security (RLS) policies.

---

## 👥 Default Demo Credentials

*(For development and testing environments)*

| Role | Username / Identifier | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Full Administrative Suite |
| **Branch Manager** | `branch` | `Bm@123` | Branch Operations & Team View |
| **Relationship Mgr** | `rm` | `Rm@123` | Client Portfolios & Targets |
| **Associate RM** | `arm` | `Arm@123` | Support & Portfolio Ops |
| **Financial Advisor** | `advisor` | `Adv@123` | Client Advisory & SIP Book |
| **Sub-Broker** | `broker` | `Broker@123` | Channel Tracking & Payouts |
| **Staff Employee** | `employee` | `Emp@123` | Internal Requests & Records |
| **Client** | `client` | `Client@123` | Investor Dashboard & Statements |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<sub>Developed by @neelotpal.dey • Genius Enterprises Architecture</sub>
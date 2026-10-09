import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faLock,
  faArrowLeft,
  faBriefcase,
  faShieldHalved,
  faArrowsRotate,
  faKey,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import api from '../api'
import { useAuthStore, findLocalUser } from '../store/auth'

const CLIENT_ROLE = { id: 'client', label: 'Client', username: 'client', password: 'Client@123', email: 'client1@genius.com' }

const EMPLOYEE_ROLES = [
  { id: 'admin', label: 'Admin', username: 'admin', password: 'Admin@123', email: 'admin@genius.com' },
  { id: 'branch_manager', label: 'Branch Manager (BM)', username: 'branch', password: 'Bm@123', email: 'bm@genius.com' },
  { id: 'rm', label: 'Relationship Manager (RM)', username: 'rm', password: 'Rm@123', email: 'rm1@genius.com' },
  { id: 'arm', label: 'Associate RM (ARM)', username: 'arm', password: 'Arm@123', email: 'arm@genius.com' },
  { id: 'advisor', label: 'Financial Advisor', username: 'advisor', password: 'Adv@123', email: 'advisor@genius.com' },
  { id: 'sub_broker', label: 'Sub-Broker', username: 'broker', password: 'Broker@123', email: 'broker@genius.com' },
  { id: 'employee', label: 'Staff Employee', username: 'employee', password: 'Emp@123', email: 'employee@genius.com' }
]

const generateCaptchaCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let str = ''
  for (let i = 0; i < 5; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return str
}

export default function Login() {
  const [loginType, setLoginType] = useState('client')
  const [role, setRole] = useState('client')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotHint, setForgotHint] = useState(false)
  const [params] = useSearchParams()
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/app/dashboard'

  // Security Enhancements: Captcha & 2FA / RFA
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [authStep, setAuthStep] = useState('credentials') // 'credentials' | 'rfa'
  const [rfaToken, setRfaToken] = useState('')
  const [rfaInput, setRfaInput] = useState('')
  const [pendingUser, setPendingUser] = useState(null)
  const [rfaTimer, setRfaTimer] = useState(60)

  useEffect(() => {
    setCaptchaCode(generateCaptchaCode())
  }, [])

  useEffect(() => {
    let interval = null
    if (authStep === 'rfa' && rfaTimer > 0) {
      interval = setInterval(() => setRfaTimer((t) => t - 1), 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [authStep, rfaTimer])

  useEffect(() => {
    const tab = params.get('tab')
    if (tab === 'employee') {
      setLoginType('employee')
      setRole('employee')
    } else if (tab === 'client') {
      setLoginType('client')
      setRole('client')
    }
  }, [params])

  useEffect(() => {
    if (loginType === 'client') {
      setRole('client')
    } else if (role === 'client') {
      setRole('employee')
    }
  }, [loginType])

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode())
    setCaptchaInput('')
  }

  const pickRole = (r) => {
    if (loginType !== 'employee') return
    setRole(r.id)
    setUsername(r.username)
    setPassword(r.password)
    setError('')
  }

  const finish = (u) => {
    setUser(u)
    navigate(from, { replace: true })
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 1. Validate Security Captcha
    if (!captchaInput || captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Invalid security captcha code. Please try again.')
      refreshCaptcha()
      return
    }

    setLoading(true)
    const ident = username.trim()

    let resolvedUser = null

    // Try Backend API Login
    try {
      const { data } = await api.post('/auth/login', {
        identifier: ident,
        username: ident,
        email: ident.includes('@') ? ident : undefined,
        password,
        role
      })
      if (data?.user) {
        resolvedUser = { ...data.user, authSource: 'backend' }
      }
    } catch (err) {
      const msg = err?.response?.data?.error
      if (msg && !/invalid/i.test(msg) && msg !== 'Invalid email or password') {
        setError(msg)
        setLoading(false)
        return
      }
    }

    // Role-based predefined credentials
    if (!resolvedUser) {
      let demo = null
      if (loginType === 'client') {
        if ((ident === CLIENT_ROLE.username || ident.toLowerCase() === CLIENT_ROLE.email) &&
            password === CLIENT_ROLE.password) {
          demo = CLIENT_ROLE
        }
      }
      if (!demo && loginType === 'employee') {
        demo = EMPLOYEE_ROLES.find((r) =>
          (ident === r.username || ident.toLowerCase() === r.email) &&
          password === r.password &&
          r.id === role
        )
      }
      if (demo) {
        resolvedUser = {
          id: 'local-demo-' + demo.id,
          name: demo.label + ' User',
          email: demo.email,
          username: demo.username,
          role: demo.id,
          status: 'active',
          authSource: 'local'
        }
      }
    }

    // Local Storage / Admin-created Users
    if (!resolvedUser) {
      const localMatch = findLocalUser(ident.includes('@') ? ident : ident + '@local', password) ||
                         findLocalUser(ident, password)
      if (localMatch && (!role || localMatch.role === role || localMatch.role === 'client')) {
        resolvedUser = { ...localMatch, authSource: localMatch.authSource || 'local' }
      }
    }

    if (!resolvedUser) {
      setError('Invalid credentials for the selected role.')
      refreshCaptcha()
      setLoading(false)
      return
    }

    // Pass to Two-Factor / RFA Security Step
    const generatedRfa = String(Math.floor(100000 + Math.random() * 900000))
    setRfaToken(generatedRfa)
    setPendingUser(resolvedUser)
    setRfaInput('')
    setRfaTimer(60)
    setAuthStep('rfa')
    setLoading(false)
  }

  const handleRfaSubmit = (e) => {
    e.preventDefault()
    setError('')

    const code = rfaInput.trim()
    // Accept the dynamic generated token or universal test verification bypass 123456
    if (code !== rfaToken && code !== '123456') {
      setError('Invalid verification code. Please check and re-enter.')
      return
    }

    if (pendingUser) {
      finish(pendingUser)
    }
  }

  return (
    <div className="ge-landing-login">
      <Link to="/" className="ge-landing-back">
        <FontAwesomeIcon icon={faArrowLeft} /> Main Website
      </Link>

      <div className="ge-landing-titlebar">
        <h1 className="ge-landing-title">
          {authStep === 'rfa' ? 'Two-Factor Verification' : 'Welcome Back'}
        </h1>
        <div className="ge-landing-redbar" />
        <p className="ge-landing-subtitle">
          {authStep === 'rfa'
            ? 'Enhanced Security Authentication (RFA / 2FA)'
            : 'Sign in to your Genius Enterprises portal'}
        </p>
      </div>

      {authStep === 'credentials' ? (
        <form className="ge-landing-card" onSubmit={handleCredentialsSubmit}>
          <div className="ge-landing-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={loginType === 'client'}
              className={'ge-landing-tab' + (loginType === 'client' ? ' on' : '')}
              onClick={() => setLoginType('client')}
            >
              <FontAwesomeIcon icon={faUser} /> CLIENT PORTAL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginType === 'employee'}
              className={'ge-landing-tab' + (loginType === 'employee' ? ' on' : '')}
              onClick={() => setLoginType('employee')}
            >
              <FontAwesomeIcon icon={faBriefcase} /> EMPLOYEE PORTAL
            </button>
          </div>

          {loginType === 'employee' && (
            <div className="ge-landing-roles">
              {EMPLOYEE_ROLES.filter((r) => !r._hidden).map((r) => (
                <label
                  key={r.id}
                  className={'ge-landing-role' + (role === r.id ? ' selected' : '')}
                  title={r.label}
                >
                  <input
                    type="radio"
                    name="login-role"
                    checked={role === r.id}
                    onChange={() => pickRole(r)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="ge-landing-field">
            <div className="ge-landing-ico"><FontAwesomeIcon icon={faUser} /></div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or Email Address"
              autoComplete="username"
              required
            />
          </div>

          <div className="ge-landing-field">
            <div className="ge-landing-ico"><FontAwesomeIcon icon={faLock} /></div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Interactive Security Captcha Box */}
          <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#d12020' }} /> Security Verification Captcha
              </span>
              <button
                type="button"
                onClick={refreshCaptcha}
                style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                title="Generate new captcha code"
              >
                <FontAwesomeIcon icon={faArrowsRotate} /> Refresh
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0b1c3b 0%, #1e293b 100%)',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '1.25rem',
                  letterSpacing: '5px',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  userSelect: 'none',
                  textDecoration: 'line-through',
                  textDecorationColor: '#d12020',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
                }}
              >
                {captchaCode}
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter characters"
                maxLength={6}
                required
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          <div className="ge-landing-forgot-row">
            <button type="button" className="ge-landing-forgot" onClick={() => setForgotHint((v) => !v)}>
              Forgot Password?
            </button>
          </div>
          {forgotHint && (
            <p className="ge-landing-hint">
              Contact the System Administrator or your Branch Manager to reset your access.
              {loginType === 'client' && ' Default login: client / Client@123'}
              {loginType === 'employee' && ' Default login: select role to autofill, or use credentials assigned by Admin.'}
            </p>
          )}

          {error && <div className="ge-landing-error">{error}</div>}

          <button type="submit" className="ge-landing-submit" disabled={loading}>
            {loading ? 'Authenticating…' : 'Proceed to Verify'}
          </button>

          <div className="ge-landing-foot">
            <div>
              New client? <Link to="/portal/signup">Open an Account</Link>
            </div>
            <div>© Genius Enterprises • Secure Gateway</div>
          </div>
        </form>
      ) : (
        /* Step 2: Two-Factor / RFA Security Verification Form */
        <form className="ge-landing-card" onSubmit={handleRfaSubmit} style={{ maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#d12020',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.5rem'
              }}
            >
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#0f172a' }}>
              Two-Factor Authentication (2FA)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              Security verification required for <strong>{pendingUser?.name}</strong> ({pendingUser?.email}).
            </p>
          </div>

          {/* Quick Demo OTP Helper Notice */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.85rem',
              color: '#166534',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', display: 'block', color: '#15803d', fontWeight: 600 }}>
                Verification Code:
              </span>
              <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 2 }}>
                {rfaToken}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setRfaInput(rfaToken)}
              style={{
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Auto-fill Code
            </button>
          </div>

          <div className="ge-landing-field">
            <div className="ge-landing-ico"><FontAwesomeIcon icon={faKey} /></div>
            <input
              type="text"
              value={rfaInput}
              onChange={(e) => setRfaInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit Code"
              maxLength={6}
              autoFocus
              required
              style={{ letterSpacing: '6px', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Expires in: <strong style={{ color: rfaTimer < 10 ? '#dc2626' : '#0f172a' }}>{rfaTimer}s</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                const refreshed = String(Math.floor(100000 + Math.random() * 900000))
                setRfaToken(refreshed)
                setRfaTimer(60)
                setError('')
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Resend Code
            </button>
          </div>

          {error && <div className="ge-landing-error">{error}</div>}

          <button type="submit" className="ge-landing-submit" style={{ marginTop: '0.5rem' }}>
            Verify & Sign In
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setAuthStep('credentials')
                setError('')
                refreshCaptcha()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Login Credentials
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

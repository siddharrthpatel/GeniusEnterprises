/** (developed by @neelotpal.dey) **/
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faEnvelope, faLock, faPhone, faIdCard, faCalendar,
  faArrowLeft, faShieldHalved, faArrowTrendUp, faHandshake,
  faChartLine, faUserTie, faBuilding
} from '@fortawesome/free-solid-svg-icons'
import api from '../api'
import { useAuthStore, saveLocalUser } from '../store/auth'
import { validateIndianPhone, validateIndianPAN, normalizeIndianPhone, normalizePAN, validateStrongPassword } from '../utils/format'

const features = [
  { icon: faShieldHalved,  text: 'SEBI Registered & Regulated' },
  { icon: faArrowTrendUp,  text: '12–18% Average Annual Returns' },
  { icon: faHandshake,     text: 'Trusted by 10,000+ Investors' },
  { icon: faChartLine,     text: 'Real-time Portfolio Tracking' },
  { icon: faUserTie,       text: 'Dedicated Relationship Manager' },
  { icon: faBuilding,      text: 'Diversified Investment Products' }
]

const MAX_DOB = (() => {
  const d = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})()

const sanitizePhoneDigits = (val) => String(val || '').replace(/\D/g, '').slice(0, 10)

export default function ClientSignup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', pan: '', dob: '' })
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '', phone: '', pan: '', dob: '' })
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false, phone: false, pan: false, dob: false })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const setUser   = useAuthStore((s) => s.setUser)
  const navigate  = useNavigate()
  const change    = (k) => (e) => {
    let val = e.target.value
    if (k === 'pan') val = val.toUpperCase()
    if (k === 'phone') val = sanitizePhoneDigits(val)
    setForm({ ...form, [k]: val })
    if (touched[k]) {
      setErrors({ ...errors, [k]: validateField(k, val, form) })
    }
  }
  const onBlur = (k) => (e) => {
    let val = e.target.value
    if (k === 'pan') val = val.toUpperCase()
    setTouched({ ...touched, [k]: true })
    const err = validateField(k, val, form)
    setErrors({ ...errors, [k]: err })
    if (!err) {
      if (k === 'phone' && validateIndianPhone(val).valid) {
        setForm({ ...form, [k]: validateIndianPhone(val).normalized })
      } else if (k === 'pan' && validateIndianPAN(val).valid) {
        setForm({ ...form, [k]: validateIndianPAN(val).normalized })
      }
    }
  }

  function validateField(k, val, frm) {
    switch (k) {
      case 'name':
        if (!val || !val.trim()) return 'Name is required'
        if (val.trim().length < 2) return 'Name must be at least 2 characters'
        return ''
      case 'email':
        if (!val || !val.trim()) return 'Email is required'
        const em = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!em.test(val.trim())) return 'Enter a valid email address'
        return ''
      case 'password':
        return validateStrongPassword(val).error
      case 'confirm':
        if (!val) return 'Please confirm your password'
        if (val !== frm.password) return 'Passwords do not match'
        return ''
      case 'phone':
        return validateIndianPhone(val).error
      case 'pan':
        return validateIndianPAN(val).error
      case 'dob':
        if (!val) return 'Date of birth is required'
        const d = new Date(val)
        const today = new Date()
        if (isNaN(d.getTime())) return 'Invalid date'
        if (d > today) return 'Date of birth cannot be in the future'
        let age = today.getFullYear() - d.getFullYear()
        const mDiff = today.getMonth() - d.getMonth()
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < d.getDate())) age--
        if (age < 18) return 'Must be at least 18 years old'
        return ''
      default:
        return ''
    }
  }

  function validateAll() {
    const newErrors = {}
    let valid = true
    Object.keys(form).forEach((k) => {
      const e = validateField(k, form[k], form)
      newErrors[k] = e
      if (e) valid = false
    })
    setErrors(newErrors)
    setTouched({
      name: true, email: true, password: true, confirm: true,
      phone: true, pan: true, dob: true
    })
    return valid
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateAll()) { setLoading(false); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true)

    // #region debug-point D2-signup-submit
    try {
      const finalPhone = normalizeIndianPhone(form.phone) || undefined
      const finalPAN = normalizePAN(form.pan) || undefined
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: finalPhone,
        pan: finalPAN,
        dob: form.dob || undefined
      }
      let user = null
      let authSource = 'backend'

      try {
        const { data } = await api.post('/auth/signup', payload)
        user = data?.user
      } catch (err) {
        const msg = err?.response?.data?.error
        const isNetwork = !err.response
        if (msg && !isNetwork) {
          setError(msg)
          setLoading(false)
          return
        }
      }

      if (!user) {
        authSource = 'local'
        user = {
          id: 'local-client-' + Date.now().toString(36),
          name: form.name || 'New Client',
          email: form.email,
          role: 'client',
          status: 'active',
          phone: finalPhone,
          pan: finalPAN,
          dob: form.dob
        }
      } else {
        user = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status || 'active' }
      }

      user.authSource = authSource
      saveLocalUser({ ...user, password: form.password })
      setUser(user)
      navigate('/app/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
    // #endregion
  }

  return (
    <div className="ge-auth-wrap">

      {/* ── LEFT HERO PANEL ── */}
      <div className="ge-auth-hero">
        <div className="ge-auth-topbar">
          <img src="/assest/logo.jpeg" alt="Genius Enterprises" className="ge-auth-logo-img" />
          <span className="ge-auth-logo-text">GENIUS ENTERPRISES</span>
        </div>
        <div className="ge-auth-divider"></div>

        <div className="ge-auth-hero-body">
          <p className="ge-auth-tagline">START YOUR WEALTH JOURNEY</p>
          <h1 className="ge-auth-hero-title">
            INVEST IN YOUR<br />
            <strong>FINANCIAL FUTURE</strong>
          </h1>
          <p className="ge-auth-hero-sub">
            Create your account in minutes and get access to curated investment
            portfolios, expert financial advice, and a dedicated relationship manager.
          </p>

          <div className="ge-auth-features">
            {features.map((f, i) => (
              <div key={i} className="ge-auth-feature-item">
                <div className="ge-auth-feature-icon">
                  <FontAwesomeIcon icon={f.icon} />
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <Link to="/" className="ge-auth-back-site">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Main Website
          </Link>
        </div>

        <div className="ge-auth-red-strip"></div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="ge-auth-form-panel">
        <div className="ge-auth-card">

          <div className="ge-auth-card-header">
            <h2>Create Account</h2>
            <p>Already registered? <Link to="/portal/login" style={{ color: '#C0392B', fontWeight: 700 }}>Sign in here</Link></p>
          </div>

          <form onSubmit={submit} className="ge-auth-form">
            <div className="ge-form-group">
              <label>Full Name</label>
              <div className="ge-input-wrap">
                <i className="fas fa-user ge-input-icon"></i>
                <input type="text" value={form.name} onChange={change('name')} onBlur={onBlur('name')} placeholder="Rahul Sharma" required />
              </div>
              {touched.name && errors.name && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.name}</div>}
            </div>

            <div className="ge-form-row">
              <div className="ge-form-group">
                <label>Email</label>
                <div className="ge-input-wrap">
                  <i className="fas fa-envelope ge-input-icon"></i>
                  <input type="email" value={form.email} onChange={change('email')} onBlur={onBlur('email')} placeholder="rahul@email.com" required />
                </div>
                {touched.email && errors.email && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.email}</div>}
              </div>
              <div className="ge-form-group">
                <label>Phone</label>
                <div className="ge-input-wrap">
                  <i className="fas fa-phone ge-input-icon"></i>
                  <input type="tel" value={form.phone} maxLength={10} onChange={change('phone')} onBlur={onBlur('phone')} placeholder="10 digit mobile" required />
                </div>
                {touched.phone && errors.phone && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.phone}</div>}
              </div>
            </div>

            <div className="ge-form-row">
              <div className="ge-form-group">
                <label>Password</label>
                <div className="ge-input-wrap">
                  <i className="fas fa-lock ge-input-icon"></i>
                  <input type="password" value={form.password} onChange={change('password')} onBlur={onBlur('password')} placeholder="Min 8 chars (e.g. Pass@123)" required minLength={8} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>8+ chars with capital, small, number & symbol</div>
                {touched.password && errors.password && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.password}</div>}
              </div>
              <div className="ge-form-group">
                <label>Confirm Password</label>
                <div className="ge-input-wrap">
                  <i className="fas fa-lock ge-input-icon"></i>
                  <input type="password" value={form.confirm} onChange={change('confirm')} onBlur={onBlur('confirm')} placeholder="Repeat password" required />
                </div>
                {touched.confirm && errors.confirm && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.confirm}</div>}
              </div>
            </div>

            <div className="ge-form-row">
              <div className="ge-form-group">
                <label>PAN Number</label>
                <div className="ge-input-wrap">
                  <i className="fas fa-id-card ge-input-icon"></i>
                  <input type="text" value={form.pan} onChange={change('pan')} onBlur={onBlur('pan')} placeholder="ABCDE1234F" required />
                </div>
                {touched.pan && errors.pan && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.pan}</div>}
              </div>
              <div className="ge-form-group">
                <label>Date of Birth</label>
                <div className="ge-input-wrap">
                  <i className="fas fa-calendar ge-input-icon"></i>
                  <input type="date" value={form.dob} max={MAX_DOB} min="1900-01-01" onChange={change('dob')} onBlur={onBlur('dob')} required />
                </div>
                {touched.dob && errors.dob && <div className="ge-field-error" style={{ color: '#C0392B', fontSize: '0.75rem', marginTop: '4px' }}>{errors.dob}</div>}
              </div>
            </div>

            {error && <div className="ge-auth-error">{error}</div>}

            <button type="submit" className="ge-btn-primary" disabled={loading}>
              {loading ? 'Creating Account…' : 'CREATE ACCOUNT'}
            </button>

            <Link to="/" className="ge-btn-outline-back">
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '0.8rem' }} />
              Back to Main Website
            </Link>
          </form>

        </div>
      </div>
    </div>
  )
}

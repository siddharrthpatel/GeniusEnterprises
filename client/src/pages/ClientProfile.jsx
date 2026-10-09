import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faEnvelope,
  faLock,
  faPhone,
  faIdCard,
  faCalendar,
  faUserShield,
  faRightFromBracket,
  faFloppyDisk,
  faCircleCheck,
  faTriangleExclamation,
  faShieldHalved,
  faClock
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore } from '../store/auth'
import { initials, roleBadgeClass, validateIndianPhone, validateIndianPAN, normalizeIndianPhone, normalizePAN } from '../utils/format'
import api from '../api'

const MAX_DOB = (() => {
  const d = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})()

const sanitizePhoneDigits = (val) => String(val || '').replace(/\D/g, '').slice(0, 10)

export default function ClientProfile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirm: '',
    pan: user?.pan || '',
    dob: user?.dob || ''
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [structure, setStructure] = useState({
    reportsTo: null, arm: null, rm: null, advisor: null, clientSince: user?.createdAt || '2025-01-05'
  })

  const isClient = user?.role === 'client'

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        confirm: '',
        pan: user.pan || '',
        dob: user.dob || ''
      })
      const fetchAll = async () => {
        try {
          const res = await api.get('/users')
          const list = res.data?.users || res.data || []
          const find = (id) => list.find(u => (u.id || u._id) === id)
          setStructure({
            reportsTo: find(user.reportsTo)?.name || 'Amit Kumar',
            arm: find(user.armId)?.name || 'Priya Sharma',
            rm: find(user.rmId)?.name || 'Rahul Verma',
            advisor: find(user.advisorId)?.name || (isClient ? 'Neha Gupta' : '—'),
            clientSince: user.createdAt || '2025-01-05'
          })
        } catch (e) {
          setStructure({
            reportsTo: user.role === 'admin' ? '—' : user.role === 'arm' ? 'Amit Kumar' : 'Priya Sharma',
            arm: ['admin', 'arm'].includes(user.role) ? '—' : 'Priya Sharma',
            rm: ['admin', 'arm', 'rm'].includes(user.role) ? '—' : 'Rahul Verma',
            advisor: isClient ? 'Neha Gupta' : (user.role === 'advisor' ? '—' : 'Neha Gupta'),
            clientSince: user.createdAt || '2025-01-05'
          })
        }
      }
      fetchAll()
    }
  }, [user, isClient])

  const change = (k) => (e) => {
    let val = e.target.value
    if (k === 'pan') val = val.toUpperCase()
    if (k === 'phone') val = sanitizePhoneDigits(val)
    setForm({ ...form, [k]: val })
  }

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (form.password && form.password !== form.confirm) {
      setMsgType('error')
      setMsg('New passwords do not match')
      return
    }

    let finalPhone = form.phone
    if (form.phone) {
      const phoneRes = validateIndianPhone(form.phone)
      if (!phoneRes.valid) {
        setMsgType('error')
        setMsg(phoneRes.error)
        return
      }
      finalPhone = normalizeIndianPhone(form.phone)
    }

    let finalPAN = form.pan
    if (isClient && form.pan) {
      finalPAN = normalizePAN(form.pan)
      const panRes = validateIndianPAN(finalPAN)
      if (!panRes.valid) {
        setMsgType('error')
        setMsg(panRes.error)
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        phone: finalPhone
      }
      if (isClient) {
        payload.pan = finalPAN
        payload.dob = form.dob
      }
      if (form.password) payload.password = form.password

      await api.put(`/auth/profile`, payload)
      setUser({ ...(user || {}), name: form.name, phone: finalPhone, pan: finalPAN, dob: form.dob })
      setForm(f => ({ ...f, phone: finalPhone, pan: finalPAN, password: '', confirm: '' }))
      setMsgType('success')
      setMsg('Profile updated successfully!')
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      setMsgType('error')
      setMsg(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const logoutAll = async () => {
    try { await api.post('/auth/logout-all') } catch (e) {}
    logout()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>My Profile</h1>
          <p className="text-muted mb-0" style={{ marginTop: 4 }}>Manage your account settings and reporting structure</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ background: 'linear-gradient(135deg, #0B1C3B 0%, #14305C 100%)', color: '#fff', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(209,32,32,0.25), transparent 70%)', top: -80, right: -80 }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
            <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, #D12020, #e74c3c)', width: 100, height: 100, fontSize: '2.2rem', boxShadow: '0 6px 20px rgba(209,32,32,0.4)' }}>
              {initials(user?.name)}
            </div>
            <h2 style={{ color: '#fff', marginTop: '1rem', marginBottom: 4 }}>{form.name || user?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`badge ${roleBadgeClass(user?.role)}`} style={{ textTransform: 'uppercase' }}>{user?.role}</span>
              <span className="badge badge-active"><FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 4 }} /> Verified</span>
            </div>
            <div style={{ opacity: 0.85, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 6 }} />{form.email}
            </div>
            <div style={{ opacity: 0.85, fontSize: '0.88rem' }}>
              <FontAwesomeIcon icon={faPhone} style={{ marginRight: 6 }} />{form.phone || '—'}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '1.25rem' }}>
            <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FontAwesomeIcon icon={faUserShield} /> Reporting Structure
            </h4>
            <div className="table-wrap" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Relationship</th>
                    <th style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Name</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'rgba(255,255,255,0.95)' }}>
                  <tr><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>Reports To</td><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{structure.reportsTo}</td></tr>
                  <tr><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>ARM</td><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{structure.arm}</td></tr>
                  <tr><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>RM</td><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{structure.rm}</td></tr>
                  <tr><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>Advisor</td><td style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{structure.advisor}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Client Since</td><td>{new Date(structure.clientSince).toLocaleDateString()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}><FontAwesomeIcon icon={faFloppyDisk} style={{ marginRight: 8, color: '#D12020' }} /> Edit Profile Details</h3>
            <form onSubmit={submit}>
              <div className="form-row">
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faUser} style={{ marginRight: 6 }} />Full Name</label>
                  <input value={form.name} onChange={change('name')} required />
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 6 }} />Email</label>
                  <input value={form.email} disabled style={{ background: '#f7f9fc', color: '#888' }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faPhone} style={{ marginRight: 6 }} />Phone</label>
                  <input
                    value={form.phone}
                    maxLength={10}
                    onChange={change('phone')}
                    onBlur={() => {
                      const n = normalizeIndianPhone(form.phone)
                      if (n) setForm({ ...form, phone: n })
                    }}
                    placeholder="10 digit mobile no." />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input value={user?.role || ''} disabled style={{ background: '#f7f9fc', color: '#888', textTransform: 'capitalize' }} />
                </div>
              </div>

              {isClient && (
                <div className="form-row">
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faIdCard} style={{ marginRight: 6 }} />PAN Number</label>
                    <input value={form.pan} onChange={change('pan')} placeholder="ABCDE1234F" />
                  </div>
                  <div className="form-group">
                    <label><FontAwesomeIcon icon={faCalendar} style={{ marginRight: 6 }} />Date of Birth</label>
                    <input type="date" value={form.dob} max={MAX_DOB} min="1900-01-01" onChange={change('dob')} />
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px dashed #dde1e7', margin: '1.25rem 0', paddingTop: '1.25rem' }}>
                <h5 style={{ marginBottom: '0.85rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FontAwesomeIcon icon={faLock} /> Change Password <span style={{ color: '#888', fontWeight: 400, fontSize: '0.75rem' }}>— keep blank to keep current password</span>
                </h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" value={form.password} onChange={change('password')} placeholder="Min 6 chars" />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" value={form.confirm} onChange={change('confirm')} placeholder="Repeat new password" />
                  </div>
                </div>
              </div>

              {msg && (
                <div style={{
                  background: msgType === 'success' ? '#dcfce7' : '#fef2f2',
                  color: msgType === 'success' ? '#16a34a' : '#dc2626',
                  padding: '0.65rem 0.9rem', borderRadius: 8, fontSize: '0.88rem', marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <FontAwesomeIcon icon={msgType === 'success' ? faCircleCheck : faTriangleExclamation} />
                  {msg}
                </div>
              )}

              <button type="submit" className="btn-accent w-full" disabled={saving}>
                <FontAwesomeIcon icon={faFloppyDisk} style={{ marginRight: 6 }} />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #F39C12' }}>
            <h4 style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#F39C12' }} /> Security & Session Notes
            </h4>
            <ul style={{ paddingLeft: '1.1rem', margin: 0, color: '#555', fontSize: '0.88rem', lineHeight: 1.9 }}>
              <li>We recommend changing your password every 90 days.</li>
              <li>Enable 2FA (coming soon) for extra account protection.</li>
              <li>Always logout from shared devices.</li>
              <li>Report any suspicious login activity to support@genius.com immediately.</li>
              <li>Your sessions are authenticated via secure, HttpOnly cookies.</li>
            </ul>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#777', marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faClock} /> Last login: Today, 09:24 AM • IP: 103.XX.XX.XX
            </div>
            <button className="btn-outline w-full" style={{ borderColor: '#E74C3C', color: '#E74C3C' }} onClick={logoutAll}>
              <FontAwesomeIcon icon={faRightFromBracket} style={{ marginRight: 6 }} /> Logout From All Devices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

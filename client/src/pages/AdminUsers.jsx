import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faSearch,
  faFilter,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faTriangleExclamation,
  faKey,
  faCopy,
  faEye,
  faEyeSlash,
  faCheck,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore, saveLocalUser } from '../store/auth'
import { initials, roleBadgeClass, roleLabel, validateIndianPhone, validateIndianPAN, normalizeIndianPhone, normalizePAN } from '../utils/format'
import api from '../api'

const emptyForm = {
  name: '', email: '', password: '', phone: '', role: 'client',
  status: 'active', pan: '', dob: '',
  reportsTo: '', armId: '', rmId: '', advisorId: ''
}

const MAX_DOB = (() => {
  const d = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})()

const sanitizePhoneDigits = (val) => String(val || '').replace(/\D/g, '').slice(0, 10)

const seedUsers = [
  { id: 'u1', name: 'Amit Kumar', email: 'admin@genius.com', role: 'admin', phone: '+91 9810000001', pan: 'ADMIK1234A', status: 'active', createdAt: '2024-06-01', reportsTo: null, armId: null, rmId: null, advisorId: null },
  { id: 'u2', name: 'Priya Sharma', email: 'arm@genius.com', role: 'arm', phone: '+91 9810000002', pan: 'ARMPS1234B', status: 'active', createdAt: '2024-07-15', reportsTo: 'u1', armId: null, rmId: null, advisorId: null },
  { id: 'u3', name: 'Rahul Verma', email: 'rm@genius.com', role: 'rm', phone: '+91 9810000003', pan: 'RMRV1234C', status: 'active', createdAt: '2024-08-10', reportsTo: 'u2', armId: 'u2', rmId: null, advisorId: null },
  { id: 'u4', name: 'Ankit Gupta', email: 'ankit.rm@genius.com', role: 'rm', phone: '+91 9810000004', pan: 'RMAG1234D', status: 'active', createdAt: '2024-09-02', reportsTo: 'u2', armId: 'u2', rmId: null, advisorId: null },
  { id: 'u5', name: 'Neha Gupta', email: 'advisor@genius.com', role: 'advisor', phone: '+91 9810000005', pan: 'ADNG1234E', status: 'active', createdAt: '2024-09-20', reportsTo: 'u3', armId: 'u2', rmId: 'u3', advisorId: null },
  { id: 'u6', name: 'Piyush Shah', email: 'piyush.advisor@genius.com', role: 'advisor', phone: '+91 9810000006', pan: 'ADPS1234F', status: 'active', createdAt: '2024-10-05', reportsTo: 'u3', armId: 'u2', rmId: 'u3', advisorId: null },
  { id: 'u7', name: 'Ritu Jain', email: 'employee@genius.com', role: 'employee', phone: '+91 9810000007', pan: 'EMRJ1234G', status: 'active', createdAt: '2024-10-18', reportsTo: 'u3', armId: 'u2', rmId: 'u3', advisorId: null },
  { id: 'u8', name: 'Meera Reddy', email: 'client@genius.com', role: 'client', phone: '+91 9810000008', pan: 'CLMR1234H', dob: '1990-05-15', status: 'active', createdAt: '2025-01-05', reportsTo: 'u5', armId: 'u2', rmId: 'u3', advisorId: 'u5' },
  { id: 'u9', name: 'Rajesh Khanna', email: 'rajesh@example.com', role: 'client', phone: '+91 9810000009', pan: 'CLRK1234I', dob: '1985-11-22', status: 'active', createdAt: '2025-01-20', reportsTo: 'u5', armId: 'u2', rmId: 'u3', advisorId: 'u5' },
  { id: 'u10', name: 'Sunita Kapoor', email: 'sunita@example.com', role: 'client', phone: '+91 9810000010', pan: 'CLSK1234J', dob: '1988-03-08', status: 'active', createdAt: '2025-02-10', reportsTo: 'u6', armId: 'u2', rmId: 'u3', advisorId: 'u6' },
  { id: 'u11', name: 'Deepa Nair', email: 'deepa.arm@genius.com', role: 'arm', phone: '+91 9810000011', pan: 'ARDN1234K', status: 'suspended', createdAt: '2024-08-01', reportsTo: 'u1', armId: null, rmId: null, advisorId: null }
]

function findUser(users, id) { return users.find(u => u.id === id) }
function relSummary(u, users) {
  const parts = []
  if (u.reportsTo) { const r = findUser(users, u.reportsTo); if (r) parts.push(`Reports to: ${r.name}`) }
  if (u.armId) { const r = findUser(users, u.armId); if (r) parts.push(`ARM: ${r.name}`) }
  if (u.rmId) { const r = findUser(users, u.rmId); if (r) parts.push(`RM: ${r.name}`) }
  if (u.advisorId) { const r = findUser(users, u.advisorId); if (r) parts.push(`Advisor: ${r.name}`) }
  return parts.join(' • ') || '—'
}

function eligibleReportsTo(role, users) {
  if (role === 'admin') return users.filter(u => u.role === 'admin')
  if (role === 'arm') return users.filter(u => u.role === 'admin')
  if (role === 'branch_manager') return users.filter(u => u.role === 'admin')
  if (role === 'rm') return users.filter(u => u.role === 'arm')
  if (role === 'advisor') return users.filter(u => u.role === 'rm')
  if (role === 'sub_broker') return users.filter(u => u.role === 'advisor')
  if (role === 'employee') return users.filter(u => ['rm', 'advisor', 'arm'].includes(u.role))
  if (role === 'client') return users.filter(u => ['advisor', 'rm'].includes(u.role))
  return []
}
function eligibleArms(users) { return users.filter(u => u.role === 'arm') }
function eligibleRms(users) { return users.filter(u => u.role === 'rm') }
function eligibleAdvisors(users) { return users.filter(u => u.role === 'advisor') }

export default function AdminUsers() {
  const me = useAuthStore((s) => s.user)
  const [users, setUsers] = useState(seedUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [delConfirm, setDelConfirm] = useState(null)
  const [error, setError] = useState('')

  // Password Management for Admin
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [pwdTargetUser, setPwdTargetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [copied, setCopied] = useState(false)

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%'
    let res = 'GE#'
    for (let i = 0; i < 7; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    res += '!9'
    setNewPassword(res)
    setCopied(false)
    setPwdSuccessMsg('')
    setPwdError('')
  }

  const openPasswordModal = (u = null) => {
    const target = u || users[0] || null
    setPwdTargetUser(target)
    setNewPassword('')
    setShowPassword(true)
    setPwdSuccessMsg('')
    setPwdError('')
    setCopied(false)
    setPwdModalOpen(true)
  }

  const closePasswordModal = () => {
    setPwdModalOpen(false)
    setPwdTargetUser(null)
    setNewPassword('')
    setPwdSuccessMsg('')
    setPwdError('')
    setCopied(false)
  }

  const handleCopyPassword = () => {
    if (!newPassword) return
    navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccessMsg('')
    if (!pwdTargetUser) {
      setPwdError('Please select a user')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters long')
      return
    }

    try {
      await api.post(`/users/${pwdTargetUser.id}/set-password`, { newPassword })
      saveLocalUser({
        email: pwdTargetUser.email,
        password: newPassword,
        name: pwdTargetUser.name,
        role: pwdTargetUser.role,
        id: pwdTargetUser.id
      })
      setPwdSuccessMsg(`Password successfully updated for ${pwdTargetUser.name} (${pwdTargetUser.email})!`)
    } catch (err) {
      saveLocalUser({
        email: pwdTargetUser.email,
        password: newPassword,
        name: pwdTargetUser.name,
        role: pwdTargetUser.role,
        id: pwdTargetUser.id
      })
      setPwdSuccessMsg(`Password updated for ${pwdTargetUser.name} (${pwdTargetUser.email})`)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/users')
        if (res.data && res.data.users) {
          setUsers(res.data.users.map(u => ({
            id: u.id || u._id,
            ...u
          })))
        }
      } catch (e) {}
    }
    load()
  }, [])

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s) && !(u.phone || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }
  const openEdit = (u) => {
    setEditing(u.id)
    setForm({ ...emptyForm, ...u, password: '' })
    setError('')
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form }
      if (!editing && !payload.password) { setError('Password is required for new users'); return }
      if (editing && !payload.password) delete payload.password

      if (payload.phone) {
        const phoneRes = validateIndianPhone(payload.phone)
        if (!phoneRes.valid) { setError(phoneRes.error); return }
        payload.phone = normalizeIndianPhone(payload.phone)
      }
      if (payload.pan) {
        payload.pan = normalizePAN(payload.pan)
        const panRes = validateIndianPAN(payload.pan)
        if (!panRes.valid) { setError(panRes.error); return }
      }

      if (editing) {
        try {
          await api.put(`/users/${editing}`, payload)
        } catch (e) {}
        setUsers(prev => prev.map(u => u.id === editing ? { ...u, ...payload, password: undefined } : u))
      } else {
        let newId = 'u' + (Date.now())
        try {
          const res = await api.post('/users', payload)
          if (res.data && res.data.user) newId = res.data.user.id || res.data.user._id
        } catch (e) {}
        setUsers(prev => [...prev, { id: newId, ...payload, password: undefined, createdAt: new Date().toISOString() }])
      }
      closeModal()
    } catch (e) {
      setError(e.response?.data?.message || 'Operation failed')
    }
  }

  const confirmDelete = async () => {
    if (!delConfirm) return
    try { await api.delete(`/users/${delConfirm.id}`) } catch (e) {}
    setUsers(prev => prev.filter(u => u.id !== delConfirm.id))
    setDelConfirm(null)
  }

  const isSelf = (u) => me && (me.id === u.id || me.email === u.email)
  const isSeedU1 = (u) => u.id === 'u1'

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Manage Users</h1>
          <p className="text-muted mb-0" style={{ marginTop: 4 }}>{users.length} total users • {filtered.length} shown</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-outline"
            style={{ borderColor: '#d97706', color: '#b45309', background: '#fffbeb', fontWeight: 600 }}
            onClick={() => openPasswordModal(null)}
          >
            <FontAwesomeIcon icon={faKey} style={{ marginRight: 6 }} /> Set Password
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: 6 }} /> Add User
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search" style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <div className="filter-select" style={{ position: 'relative', minWidth: 180 }}>
            <FontAwesomeIcon icon={faFilter} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ paddingLeft: 38 }}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="branch_manager">Branch Manager (BM)</option>
              <option value="arm">ARM</option>
              <option value="rm">RM</option>
              <option value="advisor">Advisor</option>
              <option value="sub_broker">Sub Broker</option>
              <option value="employee">Employee</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone / PAN</th>
                <th>Relationships</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar avatar-sm">{initials(u.name)}</div>
                      <div className="user-cell-info">
                        <div className="name">{u.name}</div>
                        <div className="email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleBadgeClass(u.role)}`} style={{ textTransform: 'none' }}>{roleLabel(u.role)}</span></td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{u.phone || '—'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}>{u.pan || '—'}</div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#555', maxWidth: 320 }}>{relSummary(u, users)}</td>
                  <td><span className={`badge badge-${u.status || 'active'}`}>{(u.status || 'active').charAt(0).toUpperCase() + (u.status || 'active').slice(1)}</span></td>
                  <td style={{ fontSize: '0.82rem', color: '#666' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="flex-gap">
                      <button
                        className="btn-outline btn-sm"
                        style={{ color: '#d97706', borderColor: '#fcd34d' }}
                        onClick={() => openPasswordModal(u)}
                        title="Set / Reset User Password"
                      >
                        <FontAwesomeIcon icon={faKey} />
                      </button>
                      <button className="btn-outline btn-sm" onClick={() => openEdit(u)} title="Edit User">
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => setDelConfirm(u)}
                        disabled={isSeedU1(u) || isSelf(u)}
                        title={isSeedU1(u) ? 'Seed user cannot be deleted' : isSelf(u) ? 'Cannot delete yourself' : 'Delete'}
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><FontAwesomeIcon icon={faSearch} /><h4>No users found</h4></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>{editing ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={closeModal}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password {editing && <span style={{ color: '#888', fontWeight: 400, fontSize: '0.75rem' }}> (leave blank to keep)</span>}</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(editing ? {} : { required: true })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={form.phone}
                      maxLength={10}
                      onChange={(e) => setForm({ ...form, phone: sanitizePhoneDigits(e.target.value) })}
                      onBlur={() => {
                        const n = normalizeIndianPhone(form.phone)
                        if (n) setForm({ ...form, phone: n })
                      }}
                      placeholder="10 digit mobile" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, reportsTo: '', armId: '', rmId: '', advisorId: '' })}>
                      <option value="admin">Admin</option>
                      <option value="branch_manager">Branch Manager (BM)</option>
                      <option value="arm">ARM</option>
                      <option value="rm">RM</option>
                      <option value="advisor">Advisor</option>
                      <option value="sub_broker">Sub Broker</option>
                      <option value="employee">Employee</option>
                      <option value="client">Client</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>PAN Number</label>
                    <input value={form.pan || ''} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} maxLength={10} />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={form.dob || ''} max={MAX_DOB} min="1900-01-01" onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Reports To</label>
                    <select value={form.reportsTo || ''} onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}>
                      <option value="">— Select —</option>
                      {eligibleReportsTo(form.role, users).map(u => <option key={u.id} value={u.id}>{u.name} ({roleLabel(u.role)})</option>)}
                    </select>
                  </div>
                  {form.role !== 'admin' && form.role !== 'branch_manager' && (
                    <div className="form-group">
                      <label>ARM</label>
                      <select value={form.armId || ''} onChange={(e) => setForm({ ...form, armId: e.target.value })}>
                        <option value="">— Select —</option>
                        {eligibleArms(users).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {['rm', 'advisor', 'employee', 'client'].includes(form.role) && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>RM</label>
                      <select value={form.rmId || ''} onChange={(e) => setForm({ ...form, rmId: e.target.value })}>
                        <option value="">— Select —</option>
                        {eligibleRms(users).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    {['advisor', 'employee', 'client'].includes(form.role) && (
                      <div className="form-group">
                        <label>Advisor</label>
                        <select value={form.advisorId || ''} onChange={(e) => setForm({ ...form, advisorId: e.target.value })}>
                          <option value="">— Select —</option>
                          {eligibleAdvisors(users).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {error}
                  </div>
                )}
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDelConfirm(null) }}>
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.4rem' }}>
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
                  <p style={{ color: '#555', lineHeight: 1.6, margin: '0.25rem 0 1rem 0' }}>
                    Are you sure you want to delete <strong>{delConfirm.name}</strong>? This action cannot be undone and will remove all user data.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-outline" onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Management & Reset Modal */}
      {pwdModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closePasswordModal() }}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-head" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesomeIcon icon={faKey} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Set User Password</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>Create or update authentication credentials for any user</p>
                </div>
              </div>
              <button className="modal-close" onClick={closePasswordModal}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <form onSubmit={handleSetPassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.2rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.35rem', display: 'block' }}>
                    Select User
                  </label>
                  <select
                    value={pwdTargetUser?.id || ''}
                    onChange={(e) => {
                      const u = users.find(x => x.id === e.target.value)
                      setPwdTargetUser(u || null)
                      setPwdSuccessMsg('')
                      setPwdError('')
                    }}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {roleLabel(u.role)} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {pwdTargetUser && (
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>{pwdTargetUser.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pwdTargetUser.email}</div>
                    </div>
                    <span className={`badge ${roleBadgeClass(pwdTargetUser.role)}`} style={{ textTransform: 'none' }}>
                      {roleLabel(pwdTargetUser.role)}
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <FontAwesomeIcon icon={faArrowsRotate} /> Generate Strong Password
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value)
                          setPwdError('')
                          setPwdSuccessMsg('')
                        }}
                        placeholder="Enter or generate password (min 8 chars)"
                        required
                        minLength={8}
                        style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: showPassword ? 'monospace' : 'inherit' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>

                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="btn-outline"
                        style={{ padding: '0.65rem 0.95rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                        title="Copy password to clipboard"
                      >
                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} style={{ color: copied ? '#16a34a' : 'inherit' }} />
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                    Minimum 8 characters. Must contain uppercase, lowercase, number, and special character.
                  </p>
                </div>

                {pwdSuccessMsg && (
                  <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FontAwesomeIcon icon={faCheck} style={{ color: '#16a34a' }} />
                    <span>{pwdSuccessMsg}</span>
                  </div>
                )}

                {pwdError && (
                  <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.85rem' }}>
                    {pwdError}
                  </div>
                )}
              </div>

              <div className="modal-foot" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={closePasswordModal}>Close</button>
                <button type="submit" className="btn-primary" style={{ background: '#d97706', borderColor: '#d97706' }}>
                  Save & Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

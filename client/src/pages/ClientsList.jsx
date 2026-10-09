import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faUsers,
  faSackDollar,
  faChartLine,
  faArrowTrendUp,
  faFilePdf,
  faFileExcel,
  faFilter,
  faFileCsv,
  faDownload,
  faUserPlus,
  faXmark,
  faCheck,
  faTrashCan,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore, saveLocalUser, getLocalUsersList, deleteLocalUser } from '../store/auth'
import { fmtINR, fmtPct, initials, roleLabel, downloadCSV, downloadExcel, printHTML, rowsToHTMLTable, validateIndianPhone, validateIndianPAN, normalizeIndianPhone, normalizePAN } from '../utils/format'
import api from '../api'

const sampleClients = []

const emptyCustomerForm = {
  name: '', email: '', phone: '', pan: '', dob: '',
  password: '', status: 'active',
  rmId: '', advisorId: '', armId: ''
}

const MAX_DOB = (() => {
  const d = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})()

const sanitizePhoneDigits = (val) => String(val || '').replace(/\D/g, '').slice(0, 10)

async function tryServerDownload(url, filename) {
  try {
    const res = await api.get(url, { responseType: 'blob' })
    if (res && res.data) {
      const blobUrl = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl) }, 0)
      return true
    }
  } catch (e) { /* fall through */ }
  return false
}

export default function ClientsList() {
  const user = useAuthStore((s) => s.user)
  const [clients, setClients] = useState([])
  const [staffUsers, setStaffUsers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add Customer modal
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyCustomerForm)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [adding, setAdding] = useState(false)

  // Delete Client modal & action
  const [delConfirm, setDelConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [delError, setDelError] = useState('')

  const isStaff = ['admin', 'branch_manager', 'arm', 'rm', 'advisor', 'sub_broker', 'employee'].includes(user?.role)
  const isPrivileged = user?.role === 'admin'
  const canAddCustomer = isStaff

  const handleDeleteClient = async () => {
    if (!delConfirm) return
    setDeleting(true)
    setDelError('')
    try {
      await api.delete(`/users/${delConfirm.id}`)
    } catch (_) {}
    try {
      deleteLocalUser(delConfirm.id)
      deleteLocalUser(delConfirm.email)
      setClients((prev) => prev.filter((c) => c.id !== delConfirm.id && c.email?.toLowerCase() !== delConfirm.email?.toLowerCase()))
      setDelConfirm(null)
    } catch (err) {
      setDelError(err.response?.data?.error || err.message || 'Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  const rms = staffUsers.filter(u => u.role === 'rm')
  const advisors = staffUsers.filter(u => u.role === 'advisor')
  const arms = staffUsers.filter(u => u.role === 'arm')

  useEffect(() => {
    const load = async () => {
      let serverClients = []
      try {
        const res = await api.get('/users?role=client')
        if (res.data && res.data.users) {
          serverClients = res.data.users.map(u => ({
            id: u.id || u._id,
            name: u.name, email: u.email, phone: u.phone, pan: u.pan,
            invested: u.invested || 0,
            current: u.current || 0,
            status: u.status || 'active',
            joined: u.createdAt,
            rmName: u.rmName || '—', advisorName: u.advisorName || '—'
          }))
        }
      } catch (_) {}

      try {
        const uRes = await api.get('/users')
        if (uRes.data?.users) setStaffUsers(uRes.data.users)
      } catch (_) {
        setStaffUsers([])
      }

      // Merge local storage customers so newly added or signed-up customers are always visible
      const localClients = getLocalUsersList()
        .filter(u => u.role === 'client' || (!u.role && u.email && !u.email.endsWith('@genius.com')))
        .map(u => ({
          id: u.id || 'c_' + (u.email || Math.random().toString(36)),
          name: u.name,
          email: u.email,
          phone: u.phone || '—',
          pan: u.pan || '—',
          invested: u.invested || 0,
          current: u.current || 0,
          status: u.status || 'active',
          joined: u.createdAt || new Date().toISOString(),
          rmName: u.rmName || '—',
          advisorName: u.advisorName || '—'
        }))

      const combined = [...serverClients]
      for (const lc of localClients) {
        if (!combined.some(c => c.email?.toLowerCase() === lc.email?.toLowerCase() || (c.id && c.id === lc.id))) {
          combined.unshift(lc)
        }
      }
      setClients(combined)
    }
    load()
  }, [])

  const filtered = clients.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (!c.name.toLowerCase().includes(s) && !c.email.toLowerCase().includes(s) && !(c.phone || '').toLowerCase().includes(s) && !(c.pan || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const totals = filtered.reduce((acc, c) => {
    acc.invested += c.invested || 0
    acc.current += c.current || 0
    return acc
  }, { invested: 0, current: 0 })
  const netReturn = totals.invested ? ((totals.current - totals.invested) / totals.invested) * 100 : 0

  // ── Add Customer handlers ──

  const openAddCustomer = () => {
    setAddForm({ ...emptyCustomerForm })
    setAddError('')
    setAddSuccess('')
    setAdding(false)
    setAddOpen(true)
  }

  const closeAddCustomer = () => {
    setAddOpen(false)
    setAddError('')
    setAddSuccess('')
  }

  const submitAddCustomer = async (e) => {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')
    if (!addForm.name.trim()) { setAddError('Full name is required.'); return }
    if (!addForm.email.trim()) { setAddError('Email is required.'); return }
    if (!addForm.password || addForm.password.length < 6) { setAddError('Password must be at least 6 characters.'); return }

    let finalPhone = ''
    if (addForm.phone) {
      const phoneRes = validateIndianPhone(addForm.phone)
      if (!phoneRes.valid) { setAddError(phoneRes.error); return }
      finalPhone = normalizeIndianPhone(addForm.phone)
    }

    let finalPAN = ''
    if (addForm.pan) {
      finalPAN = normalizePAN(addForm.pan)
      const panRes = validateIndianPAN(finalPAN)
      if (!panRes.valid) { setAddError(panRes.error); return }
    }

    setAdding(true)
    try {
      const payload = {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        phone: finalPhone,
        pan: finalPAN,
        dob: addForm.dob,
        role: 'client',
        status: addForm.status,
        rmId: addForm.rmId || '',
        advisorId: addForm.advisorId || '',
        armId: addForm.armId || '',
        reportsTo: addForm.advisorId || addForm.rmId || '',
      }
      let newId = 'c' + Date.now()
      try {
        const res = await api.post('/users', payload)
        if (res.data?.user) newId = res.data.user.id || res.data.user._id || newId
      } catch (err) { /* local fallback */ }

      const rmUser = staffUsers.find(u => u.id === addForm.rmId)
      const advUser = staffUsers.find(u => u.id === addForm.advisorId)
      const newClient = {
        id: newId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        pan: payload.pan,
        invested: 0,
        current: 0,
        status: payload.status,
        joined: new Date().toISOString(),
        rmName: rmUser?.name || '—',
        advisorName: advUser?.name || '—'
      }
      setClients(prev => [newClient, ...prev])
      saveLocalUser({
        ...payload,
        id: newId,
        createdAt: new Date().toISOString(),
        authSource: 'local'
      })
      setAddSuccess(`Customer "${payload.name}" registered successfully!`)
      setAddForm(emptyCustomerForm)
      setTimeout(() => { closeAddCustomer() }, 2000)
    } catch (err) {
      setAddError(err?.response?.data?.error || 'Failed to register customer. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function downloadOne(c, type) {
    const fname = `Portfolio_${c.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}`
    if (type === 'pdf') {
      const ok = await tryServerDownload(`/reports/portfolio/${c.id}.pdf`, fname + '.pdf')
      if (!ok) {
        const html =
          `<h2>Client Details</h2>
           <table><tbody>
             <tr><th>Name</th><td>${c.name}</td></tr>
             <tr><th>Client ID</th><td>${c.id}</td></tr>
             <tr><th>Email</th><td>${c.email || '—'}</td></tr>
             <tr><th>Phone</th><td>${c.phone || '—'}</td></tr>
             <tr><th>PAN</th><td>${c.pan || '—'}</td></tr>
             <tr><th>RM</th><td>${c.rmName || '—'}</td></tr>
             <tr><th>Advisor</th><td>${c.advisorName || '—'}</td></tr>
             <tr><th>Status</th><td>${c.status || 'active'}</td></tr>
           </tbody></table>
          <h2>Portfolio Summary</h2>
          <table>
            <tr><th>Total Invested</th><th>Current Value</th><th>Net Returns</th><th>Return %</th></tr>
            <tr class="summary-row">
              <td>${fmtINR(c.invested)}</td>
              <td>${fmtINR(c.current)}</td>
              <td class="${c.current-c.invested>=0?'success':'danger'}">${c.current-c.invested>=0?'+':''}${fmtINR(c.current-c.invested)}</td>
              <td class="${c.current-c.invested>=0?'success':'danger'}">${c.invested?fmtPct(((c.current-c.invested)/c.invested)*100):'0%'}</td>
            </tr>
          </table>`
        printHTML(`Portfolio Report — ${c.name}`, html)
      }
    } else {
      const ok = await tryServerDownload(`/reports/portfolio/${c.id}.xlsx`, fname + '.xlsx')
      if (!ok) {
        downloadExcel(
          ['Client ID', 'Name', 'Email', 'Phone', 'PAN', 'RM', 'Advisor', 'Invested', 'Current', 'Net Return', 'Return %', 'Status', 'Joined'],
          [[
            c.id, c.name, c.email || '', c.phone || '', c.pan || '',
            c.rmName || '', c.advisorName || '',
            fmtINR(c.invested), fmtINR(c.current),
            fmtINR(c.current - c.invested),
            c.invested ? fmtPct(((c.current - c.invested)/c.invested)*100) : '0%',
            c.status || 'active',
            c.joined ? new Date(c.joined).toLocaleDateString('en-IN') : ''
          ]],
          fname
        )
      }
    }
  }

  function downloadAllClientsCSV() {
    const headers = ['Client ID', 'Name', 'Email', 'Phone', 'PAN', 'RM', 'Advisor', 'Invested (₹)', 'Current (₹)', 'Net Return (₹)', 'Return %', 'Status', 'Joined']
    const rows = filtered.map(c => [
      c.id, c.name, c.email || '', c.phone || '', c.pan || '',
      c.rmName || '', c.advisorName || '',
      c.invested || 0, c.current || 0,
      (c.current||0) - (c.invested||0),
      c.invested ? (((c.current-c.invested)/c.invested)*100).toFixed(2) + '%' : '0%',
      c.status || 'active',
      c.joined ? new Date(c.joined).toLocaleDateString('en-IN') : ''
    ])
    downloadCSV(headers, rows, `Genius_All_Clients_${new Date().toISOString().slice(0,10)}`)
  }

  function downloadAllClientsPDF() {
    const headers = ['Client ID', 'Name', 'Email', 'Phone', 'PAN', 'Invested', 'Current', 'Return %', 'Status']
    const rows = filtered.map(c => [
      c.id, c.name, c.email || '', c.phone || '', c.pan || '',
      fmtINR(c.invested), fmtINR(c.current),
      c.invested ? fmtPct(((c.current-c.invested)/c.invested)*100) : '0%',
      c.status || 'active'
    ])
    const totalsRow = [
      'TOTAL', `${filtered.length} Clients`, '', '', '',
      fmtINR(totals.invested), fmtINR(totals.current),
      fmtPct(netReturn), ''
    ]
    const html =
      `<h2>Summary</h2>
       <table>
         <tr><th>Total Clients</th><th>Active</th><th>Total Invested</th><th>Total Current Value</th><th>Net Return %</th></tr>
         <tr class="summary-row">
           <td>${filtered.length}</td>
           <td>${filtered.filter(c=>c.status==='active').length}</td>
           <td>${fmtINR(totals.invested)}</td>
           <td>${fmtINR(totals.current)}</td>
           <td class="${netReturn>=0?'success':'danger'}">${fmtPct(netReturn)}</td>
         </tr>
       </table>
       <h2>Complete Client Directory (${filtered.length})</h2>` +
       rowsToHTMLTable(headers, rows, { totalsRow })
    printHTML('Complete Client Data', html)
  }

  function downloadAllUsersCSV() {
    const all = staffUsers.length ? staffUsers : []
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Phone', 'PAN', 'Status', 'Reports To', 'Joined']
    const rows = all.map(u => [
      u.id || u._id, u.name, u.email, roleLabel(u.role), u.phone || '', u.pan || '',
      u.status || 'active', u.reportsToName || '',
      u.createdAt || u.joined ? new Date(u.createdAt || u.joined).toLocaleDateString('en-IN') : ''
    ])
    downloadCSV(headers, rows, `Genius_All_Users_${new Date().toISOString().slice(0, 10)}`)
  }

  function downloadAllUsersPDF() {
    const all = staffUsers.length ? staffUsers : []
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Phone', 'Status', 'Reports To']
    const rows = all.map(u => [
      u.id || u._id, u.name, u.email, roleLabel(u.role),
      u.phone || '', u.status || 'active', u.reportsToName || 'HQ'
    ])
    const html =
      `<h2>Summary</h2>
       <table>
         <tr><th>Total Users</th><th>Admin</th><th>Branch Managers (BM)</th><th>RMs</th><th>ARMs</th><th>Advisors</th><th>Sub Brokers</th><th>Employees</th><th>Clients</th></tr>
         <tr class="summary-row">
           <td>${all.length}</td>
           <td>${all.filter(u => u.role === 'admin').length}</td>
           <td>${all.filter(u => u.role === 'branch_manager').length}</td>
           <td>${all.filter(u => u.role === 'rm').length}</td>
           <td>${all.filter(u => u.role === 'arm').length}</td>
           <td>${all.filter(u => u.role === 'advisor').length}</td>
           <td>${all.filter(u => u.role === 'sub_broker').length}</td>
           <td>${all.filter(u => u.role === 'employee').length}</td>
           <td>${all.filter(u => u.role === 'client').length}</td>
         </tr>
       </table>
       <h2>Complete User Directory (${all.length})</h2>` +
      rowsToHTMLTable(headers, rows)
    printHTML('Complete User & Staff Data', html)
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Clients Directory</h1>
          <p className="text-muted mb-0" style={{ marginTop: 4 }}>{filtered.length} of {clients.length} clients shown</p>
        </div>
        <div className="page-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {canAddCustomer && (
            <button className="btn-primary" onClick={openAddCustomer} id="add-customer-btn">
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 6 }} /> Add Customer
            </button>
          )}
          {isPrivileged && (
            <div className="page-actions" style={{ display: 'contents' }}>
              <button className="btn-outline btn-sm" onClick={downloadAllClientsCSV} title="Download all filtered clients as CSV/Excel">
                <FontAwesomeIcon icon={faFileExcel} style={{ marginRight: 6 }} /> Clients CSV
              </button>
              <button className="btn-outline btn-sm" onClick={downloadAllClientsPDF} title="Print all clients as PDF report">
                <FontAwesomeIcon icon={faFilePdf} style={{ marginRight: 6 }} /> Clients PDF
              </button>
              <button className="btn-primary btn-sm" onClick={downloadAllUsersCSV} title="Download ALL users (staff + clients) as CSV">
                <FontAwesomeIcon icon={faDownload} style={{ marginRight: 6 }} /> All Users CSV
              </button>
              <button className="btn-primary btn-sm" onClick={downloadAllUsersPDF} title="Print ALL users (staff + clients) as PDF report">
                <FontAwesomeIcon icon={faFilePdf} style={{ marginRight: 6 }} /> All Users PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid-4 mb-2">
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Clients</div>
            <div className="stat-value">{filtered.length}</div>
            <div className="stat-sub">Filtered list</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="stat-content">
            <div className="stat-label">Active Clients</div>
            <div className="stat-value">{filtered.filter(c => c.status === 'active').length}</div>
            <div className="stat-sub">{Math.round(filtered.filter(c => c.status === 'active').length / Math.max(1, filtered.length) * 100)}% active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faSackDollar} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Invested</div>
            <div className="stat-value">{fmtINR(totals.invested)}</div>
            <div className="stat-sub">Aggregate principal</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faArrowTrendUp} /></div>
          <div className="stat-content">
            <div className="stat-label">Aggregate Returns</div>
            <div className="stat-value">{fmtPct(netReturn)}</div>
            <div className="stat-sub">{fmtINR(totals.current - totals.invested)} absolute</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search" style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input placeholder="Search name, email, phone, PAN..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <div className="filter-select" style={{ position: 'relative', minWidth: 160 }}>
            <FontAwesomeIcon icon={faFilter} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ paddingLeft: 38 }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Phone / PAN</th>
                <th>RM / Advisor</th>
                <th>Invested</th>
                <th>Current</th>
                <th>Return %</th>
                <th>Status</th>
                <th>Joined</th>
                {isStaff && <th style={{ minWidth: isPrivileged ? 250 : 160 }}>Actions / Reports</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const r = c.invested ? ((c.current - c.invested) / c.invested) * 100 : 0
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar avatar-sm">{initials(c.name)}</div>
                        <div className="user-cell-info">
                          <div className="name">{c.name}</div>
                          <div className="email">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.phone || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#888' }}>{c.pan || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.rmName || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#888' }}>{c.advisorName || '—'}</div>
                    </td>
                    <td>{fmtINR(c.invested)}</td>
                    <td>{fmtINR(c.current)}</td>
                    <td className={r >= 0 ? 'text-up' : 'text-down'}>{fmtPct(r)}</td>
                    <td><span className={`badge badge-${c.status || 'active'}`}>{(c.status || 'active').charAt(0).toUpperCase() + (c.status || 'active').slice(1)}</span></td>
                    <td style={{ fontSize: '0.82rem', color: '#666' }}>{c.joined ? new Date(c.joined).toLocaleDateString() : '—'}</td>
                    {isStaff && (
                      <td>
                        <div className="flex-gap" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
                          <button onClick={() => downloadOne(c, 'pdf')} className="btn-sm btn-danger" style={{ border: 'none', cursor: 'pointer', padding: '0.3rem 0.55rem', fontSize: '0.72rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FontAwesomeIcon icon={faFilePdf} size="xs" /> PDF
                          </button>
                          <button onClick={() => downloadOne(c, 'xlsx')} className="btn-sm btn-success" style={{ border: 'none', cursor: 'pointer', padding: '0.3rem 0.55rem', fontSize: '0.72rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FontAwesomeIcon icon={faFileExcel} size="xs" /> XLSX
                          </button>
                          {isPrivileged && (
                            <button
                              onClick={() => { setDelError(''); setDelConfirm(c) }}
                              className="btn-sm"
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.32rem 0.65rem',
                                fontSize: '0.72rem',
                                borderRadius: 6,
                                background: '#dc2626',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                              title="Delete Client"
                            >
                              <FontAwesomeIcon icon={faTrashCan} size="xs" /> Delete Client
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={isStaff ? 9 : 8}><div className="empty-state"><FontAwesomeIcon icon={faSearch} /><h4>No clients match</h4></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAddCustomer() }}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Add New Customer</h3>
              <button type="button" className="modal-close" onClick={closeAddCustomer}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form onSubmit={submitAddCustomer}>
              <div className="modal-body">
                {addError && <div className="form-error">{addError}</div>}
                {addSuccess && <div className="form-success">{addSuccess}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="e.g. Rahul Sharma" required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="customer@example.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder="Min. 6 characters" minLength={6} required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={addForm.phone}
                      maxLength={10}
                      onChange={(e) => setAddForm({ ...addForm, phone: sanitizePhoneDigits(e.target.value) })}
                      onBlur={(e) => {
                        const n = normalizeIndianPhone(addForm.phone)
                        if (n) setAddForm({ ...addForm, phone: n })
                      }}
                      placeholder="10 digit mobile no." />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>PAN</label>
                    <input value={addForm.pan} onChange={(e) => setAddForm({ ...addForm, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={addForm.dob} max={MAX_DOB} min="1900-01-01" onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Reporting ARM</label>
                    <select value={addForm.armId} onChange={(e) => setAddForm({ ...addForm, armId: e.target.value })}>
                      <option value="">— Not assigned —</option>
                      {arms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reporting RM</label>
                    <select value={addForm.rmId} onChange={(e) => setAddForm({ ...addForm, rmId: e.target.value })}>
                      <option value="">— Not assigned —</option>
                      {rms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reporting Advisor</label>
                    <select value={addForm.advisorId} onChange={(e) => setAddForm({ ...addForm, advisorId: e.target.value })}>
                      <option value="">— Not assigned —</option>
                      {advisors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeAddCustomer} disabled={adding}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={adding}>
                  <FontAwesomeIcon icon={adding ? faCheck : faUserPlus} style={{ marginRight: 6 }} />
                  {adding ? 'Registering…' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDelConfirm(null) }}>
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-head" style={{ borderBottom: '1px solid #fee2e2' }}>
              <h3 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <FontAwesomeIcon icon={faTriangleExclamation} /> Delete Client Account
              </h3>
              <button type="button" className="modal-close" onClick={() => !deleting && setDelConfirm(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              {delError && <div className="form-error" style={{ marginBottom: 12 }}>{delError}</div>}
              <p style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete client <strong>{delConfirm.name}</strong> ({delConfirm.email})?
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8 }}>
                ⚠️ This will permanently remove the client profile and purge all associated records.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setDelConfirm(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleting}
                onClick={handleDeleteClient}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.15rem',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} />
                {deleting ? 'Deleting…' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKey,
  faToggleOn,
  faBullhorn,
  faFloppyDisk,
  faPlus,
  faShieldHalved,
  faEye,
  faEyeSlash,
  faCircleDot,
  faTrashCan,
  faDatabase,
  faCheck,
  faXmark,
  faChartLine,
  faClock
} from '@fortawesome/free-solid-svg-icons'
import api from '../api'
import { useAuthStore } from '../store/auth'

const DEFAULT_DASHBOARDS = [
  { id: 'branch_manager', label: 'Branch Manager Dashboard', role: 'branch_manager', isActive: true },
  { id: 'rm', label: 'Relationship Manager (RM)', role: 'rm', isActive: true },
  { id: 'arm', label: 'Assistant RM (ARM)', role: 'arm', isActive: true },
  { id: 'advisor', label: 'Advisor Dashboard', role: 'advisor', isActive: true },
  { id: 'sub_broker', label: 'Sub Broker Dashboard', role: 'sub_broker', isActive: true },
  { id: 'employee', label: 'Employee Dashboard', role: 'employee', isActive: true },
  { id: 'client', label: 'Client / Investor Portal', role: 'client', isActive: true }
]

const REFRESH_INTERVAL_PRESETS = [
  { label: '1 minute', value: 60000 },
  { label: '2 minutes', value: 120000 },
  { label: '5 minutes', value: 300000 },
  { label: '15 minutes', value: 900000 },
  { label: '30 minutes', value: 1800000 },
  { label: '60 minutes', value: 3600000 }
]

const DEFAULT_MARKET_STOCKS = [
  { code: 'RELIANCE', label: 'Reliance Industries', isActive: true },
  { code: 'TCS', label: 'Tata Consultancy Services', isActive: true },
  { code: 'HDFCBANK', label: 'HDFC Bank', isActive: true },
  { code: 'INFY', label: 'Infosys', isActive: true },
  { code: 'ICICIBANK', label: 'ICICI Bank', isActive: true },
  { code: 'SBIN', label: 'State Bank of India', isActive: true },
  { code: 'ITC', label: 'ITC Limited', isActive: true },
  { code: 'BHARTIARTL', label: 'Bharti Airtel', isActive: true },
  { code: 'LT', label: 'Larsen & Toubro', isActive: true },
  { code: 'HINDUNILVR', label: 'Hindustan Unilever', isActive: true }
]

const DEFAULT_MARKET_INDICES = [
  { code: 'SENSEX', label: 'BSE SENSEX', isActive: true },
  { code: 'NIFTY50', label: 'NIFTY 50', isActive: true },
  { code: 'BANKNIFTY', label: 'Bank Nifty', isActive: true },
  { code: 'NIFTYIT', label: 'Nifty IT', isActive: false },
  { code: 'NIFTYPHARMA', label: 'Nifty Pharma', isActive: false }
]

const defaultMarketConfig = () => ({
  activeStocks: DEFAULT_MARKET_STOCKS.map((s) => ({ ...s })),
  activeIndices: DEFAULT_MARKET_INDICES.map((i) => ({ ...i })),
  refreshIntervalMs: 300000,
  lastFetchedAt: null
})

const LOCAL_PLATFORM_KEY = 'ge_local_platform'

const DATA_SCOPES = [
  { id: 'portfolio', label: 'Portfolio & Holdings', description: 'Client portfolio, holdings, SIP/MF/FD data' },
  { id: 'reports', label: 'Reports & Statements', description: 'Download PDF/Excel reports and statements' },
  { id: 'clients', label: 'Client Data', description: 'View and manage client profiles and KYC records' },
  { id: 'market', label: 'Market Data', description: 'Live market prices, indices, gainers/losers' },
  { id: 'profile', label: 'User Profile', description: 'Personal profile and account information' },
  { id: 'documents', label: 'Documents & KYC', description: 'Upload and view KYC documents' },
  { id: 'transactions', label: 'Transactions', description: 'View and initiate buy/sell/SIP transactions' },
  { id: 'analytics', label: 'Analytics & Insights', description: 'Advanced portfolio analytics and performance reports' },
]

const ROLES_FOR_ACCESS = ['admin', 'branch_manager', 'rm', 'arm', 'advisor', 'sub_broker', 'employee', 'client']

const DEFAULT_API_ACCESS = () => {
  const access = {}
  for (const role of ROLES_FOR_ACCESS) {
    access[role] = {}
    for (const scope of DATA_SCOPES) {
      const isAdmin = role === 'admin'
      const isStaff = ['admin', 'branch_manager', 'rm', 'arm', 'advisor', 'sub_broker', 'employee'].includes(role)
      const isClient = role === 'client'
      access[role][scope.id] = {
        read: isAdmin || (isStaff && ['portfolio', 'reports', 'clients', 'market', 'profile', 'analytics'].includes(scope.id)) || (isClient && ['portfolio', 'reports', 'market', 'profile', 'documents'].includes(scope.id)),
        write: isAdmin || (isStaff && !isClient && ['portfolio', 'clients', 'documents', 'transactions'].includes(scope.id)),
      }
    }
  }
  return access
}

const defaultLocalPlatform = () => ({
  keys: {
    supabase_url: 'https://drkxuilxrhjjcixeuftj.supabase.co',
    supabase_anon_key: 'sb_publishable_udvTla9MSU9HSzF_lJb44A_EWfdZmWe',
    gemini_api_key: '',
    has_supabase_anon_key: true,
    has_gemini_api_key: false,
  },
  dashboards: DEFAULT_DASHBOARDS.map((d) => ({ ...d })),
  apiAccess: DEFAULT_API_ACCESS(),
  notices: [
    {
      id: 'n' + Date.now().toString(36) + '1',
      kind: 'notice',
      title: 'Welcome to Genius Enterprises Portal',
      body: 'Role-based dashboards are live. Contact your RM for onboarding support.',
      audience: 'all',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n' + Date.now().toString(36) + '2',
      kind: 'ad',
      title: 'SIP Top-up Month',
      body: 'Increase your SIP by 10% this month and stay on track for long-term goals.',
      audience: 'client',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  marketConfig: defaultMarketConfig(),
})

const loadLocalPlatform = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PLATFORM_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const base = defaultLocalPlatform()
        const baseMc = base.marketConfig
        const pmc = parsed.marketConfig || {}
        return {
          keys: { ...base.keys, ...(parsed.keys || {}) },
          dashboards: Array.isArray(parsed.dashboards) && parsed.dashboards.length
            ? parsed.dashboards
            : base.dashboards,
          apiAccess: (parsed.apiAccess && typeof parsed.apiAccess === 'object') ? { ...base.apiAccess, ...parsed.apiAccess } : base.apiAccess,
          notices: Array.isArray(parsed.notices) ? parsed.notices : base.notices,
          marketConfig: {
            ...baseMc,
            ...pmc,
            activeStocks: Array.isArray(pmc.activeStocks) && pmc.activeStocks.length
              ? pmc.activeStocks
              : baseMc.activeStocks,
            activeIndices: Array.isArray(pmc.activeIndices) && pmc.activeIndices.length
              ? pmc.activeIndices
              : baseMc.activeIndices,
            refreshIntervalMs: typeof pmc.refreshIntervalMs === 'number' && pmc.refreshIntervalMs >= 60000
              ? pmc.refreshIntervalMs
              : baseMc.refreshIntervalMs,
            lastFetchedAt: pmc.lastFetchedAt || null,
          },
        }
      }
    }
  } catch {}
  return defaultLocalPlatform()
}

const saveLocalPlatform = (data) => {
  try {
    localStorage.setItem(LOCAL_PLATFORM_KEY, JSON.stringify(data))
  } catch {}
}

const maskKey = (value) => {
  if (!value) return ''
  if (value.length <= 8) return '••••'
  return value.slice(0, 6) + '••••' + value.slice(-4)
}

export default function MasterAdmin({ mode = 'full' }) {
  const user = useAuthStore((s) => s.user)
  const showKeys = user?.role === 'admin'
  const showHero = mode === 'full'
  const [keys, setKeys] = useState({
    supabase_url: '',
    supabase_anon_key: '',
    gemini_api_key: ''
  })
  const [dashboards, setDashboards] = useState([])
  const [notices, setNotices] = useState([])
  const [apiAccess, setApiAccess] = useState(DEFAULT_API_ACCESS)
  const [selectedAccessRole, setSelectedAccessRole] = useState('admin')
  const [accessMsg, setAccessMsg] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ kind: 'notice', title: '', body: '', audience: 'all' })
  const [marketConfig, setMarketConfig] = useState(defaultMarketConfig())
  const [cacheMeta, setCacheMeta] = useState(null)
  const [marketMsg, setMarketMsg] = useState('')
  const [newStockCode, setNewStockCode] = useState('')
  const [newStockLabel, setNewStockLabel] = useState('')
  const [stockSearchQuery, setStockSearchQuery] = useState('')

  const load = async () => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    if (isLocalAuth) {
      const lp = loadLocalPlatform()
      setKeys({
        supabase_url: lp.keys.supabase_url || '',
        supabase_anon_key: maskKey(lp.keys.supabase_anon_key) || '',
        gemini_api_key: maskKey(lp.keys.gemini_api_key) || ''
      })
      const allDash = lp.dashboards?.length ? lp.dashboards : DEFAULT_DASHBOARDS
      setDashboards(allDash.filter((db) => db.id !== 'admin' && db.role !== 'admin'))
      setApiAccess(lp.apiAccess || DEFAULT_API_ACCESS())
      setNotices(lp.notices || [])
      setMarketConfig(lp.marketConfig || defaultMarketConfig())
      setCacheMeta(null)
      setLoading(false)
      return
    }
    const [k, d, n, ac, mc] = await Promise.all([
      api.get('/platform/keys').catch(() => ({ data: { keys: {} } })),
      api.get('/platform/dashboards').catch(() => ({ data: { dashboards: DEFAULT_DASHBOARDS } })),
      api.get('/platform/notices?audience=all').catch(() => ({ data: { notices: [] } })),
      api.get('/platform/api-access').catch(() => ({ data: { apiAccess: DEFAULT_API_ACCESS() } })),
      api.get('/platform/market-config').catch(() => ({ data: { marketConfig: defaultMarketConfig(), cacheMeta: null } }))
    ])
    setKeys({
      supabase_url: k.data?.keys?.supabase_url || '',
      supabase_anon_key: k.data?.keys?.supabase_anon_key || '',
      gemini_api_key: k.data?.keys?.gemini_api_key || ''
    })
    const allDash = (d.data?.dashboards && d.data.dashboards.length) ? d.data.dashboards : DEFAULT_DASHBOARDS
    setDashboards(allDash.filter((db) => db.id !== 'admin' && db.role !== 'admin'))
    setApiAccess(ac.data?.apiAccess || DEFAULT_API_ACCESS())
    setNotices(n.data?.notices || [])
    setMarketConfig(mc.data?.marketConfig || defaultMarketConfig())
    setCacheMeta(mc.data?.cacheMeta || null)
    setLoading(false)
  }

  useEffect(() => { load().catch(() => { setLoading(false) }) }, [])

  const extractError = (err, fallback) => {
    const msg = err?.response?.data?.error
    if (msg && typeof msg === 'string') return msg
    if (err?.message) return err.message
    return fallback
  }

  const saveApiAccess = async () => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const merged = { ...lp, apiAccess }
        saveLocalPlatform(merged)
        setAccessMsg('API access rules saved successfully.')
        setTimeout(() => setAccessMsg(''), 3500)
        return
      }
      await api.put('/platform/api-access', { apiAccess })
      setAccessMsg('API access rules saved.')
      setTimeout(() => setAccessMsg(''), 3500)
    } catch (err) {
      setAccessMsg(extractError(err, 'Failed to save API access rules.'))
      setTimeout(() => setAccessMsg(''), 4000)
    }
  }

  const toggleScope = (role, scopeId, permission) => {
    setApiAccess(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [scopeId]: {
          ...(prev[role]?.[scopeId] || {}),
          [permission]: !(prev[role]?.[scopeId]?.[permission])
        }
      }
    }))
  }

  const saveKeys = async (e) => {
    e.preventDefault()
    setMsg('')
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const nextKeys = { ...lp.keys }
        for (const k of ['supabase_url', 'supabase_anon_key', 'gemini_api_key']) {
          const v = keys[k]
          if (typeof v === 'string' && v && !v.includes('••••')) {
            nextKeys[k] = v.trim()
          }
        }
        const merged = { ...lp, keys: nextKeys }
        saveLocalPlatform(merged)
        setKeys({
          supabase_url: nextKeys.supabase_url,
          supabase_anon_key: maskKey(nextKeys.supabase_anon_key),
          gemini_api_key: maskKey(nextKeys.gemini_api_key)
        })
        setMsg('API keys saved locally.')
        setTimeout(() => setMsg(''), 4000)
        return
      }
      const { data } = await api.put('/platform/keys', keys)
      setKeys({
        supabase_url: data.keys.supabase_url,
        supabase_anon_key: data.keys.supabase_anon_key,
        gemini_api_key: data.keys.gemini_api_key
      })
      setMsg('API keys saved. Yahoo Finance infinity ticker with Google Gemini AI fallback updated.')
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      const real = extractError(err, 'Failed to save keys.')
      if (String(real).toLowerCase().includes('forbidden') || String(real).toLowerCase().includes('permission')) {
        setMsg(real + ' Ensure you are signed in as Admin.')
      } else {
        setMsg(real)
      }
      setTimeout(() => setMsg(''), 5000)
    }
  }

  const toggleDash = async (id, isActive) => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const row = lp.dashboards.find((d) => d.id === id)
        if (row) {
          row.isActive = !!isActive
          saveLocalPlatform(lp)
          setDashboards((rows) => rows.map((r) => (r.id === id ? { ...row } : r)))
        }
        return
      }
      const { data } = await api.patch('/platform/dashboards/' + id, { isActive })
      setDashboards((rows) => rows.map((r) => (r.id === id ? data.dashboard : r)))
    } catch (err) {
      setDashboards((rows) => rows.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
      setMsg(extractError(err, 'Failed to update dashboard toggle.'))
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const postNotice = async (e) => {
    e.preventDefault()
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const item = {
          id: 'n' + Date.now().toString(36),
          kind: draft.kind === 'ad' ? 'ad' : 'notice',
          title: String(draft.title || '').slice(0, 120),
          body: String(draft.body || '').slice(0, 2000),
          audience: draft.audience || 'all',
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        lp.notices.unshift(item)
        saveLocalPlatform(lp)
        setNotices((rows) => [item, ...rows])
        setDraft({ kind: 'notice', title: '', body: '', audience: 'all' })
        return
      }
      const { data } = await api.post('/platform/notices', draft)
      setNotices((rows) => [data.notice, ...rows])
      setDraft({ kind: 'notice', title: '', body: '', audience: 'all' })
    } catch (err) {
      setMsg(extractError(err, 'Failed to publish notice.'))
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const toggleNotice = async (n) => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const row = lp.notices.find((x) => x.id === n.id)
        if (row) {
          row.isActive = !row.isActive
          saveLocalPlatform(lp)
          setNotices((rows) => rows.map((r) => (r.id === n.id ? { ...row } : r)))
        }
        return
      }
      await api.patch('/platform/notices/' + n.id, { isActive: !n.isActive })
      setNotices((rows) => rows.map((r) => (r.id === n.id ? { ...r, isActive: !r.isActive } : r)))
    } catch (err) {
      setMsg(extractError(err, 'Failed to update notice.'))
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const deleteNotice = async (id) => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        lp.notices = lp.notices.filter((r) => r.id !== id)
        saveLocalPlatform(lp)
        setNotices((rows) => rows.filter((r) => r.id !== id))
        return
      }
      await api.delete('/platform/notices/' + id)
      setNotices((rows) => rows.filter((r) => r.id !== id))
    } catch (err) {
      setMsg(extractError(err, 'Failed to delete notice.'))
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const handleAddStock = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!newStockCode.trim()) return
    const c = newStockCode.trim().toUpperCase()
    const l = newStockLabel.trim() || c
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      if (isLocalAuth) {
        setMarketConfig((prev) => ({
          ...prev,
          activeStocks: [...(prev.activeStocks || []).filter(s => s.code !== c), { code: c, label: l, isActive: true }]
        }))
        setNewStockCode('')
        setNewStockLabel('')
        setMarketMsg(`Stock ${c} added locally.`)
        setTimeout(() => setMarketMsg(''), 3500)
        return
      }
      const res = await api.post('/platform/market-config/stocks', { code: c, label: l })
      if (res.data?.marketConfig) {
        setMarketConfig(res.data.marketConfig)
      } else {
        setMarketConfig((prev) => ({
          ...prev,
          activeStocks: [...(prev.activeStocks || []).filter(s => s.code !== c), { code: c, label: l, isActive: true }]
        }))
      }
      setNewStockCode('')
      setNewStockLabel('')
      setMarketMsg(`Stock ${c} added successfully to Yahoo Finance loop.`)
      setTimeout(() => setMarketMsg(''), 4000)
    } catch (err) {
      setMarketMsg(extractError(err, 'Failed to add stock.'))
      setTimeout(() => setMarketMsg(''), 4000)
    }
  }

  const toggleMarketStock = async (code, isActive) => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      setMarketConfig((prev) => ({
        ...prev,
        activeStocks: prev.activeStocks.map((s) =>
          s.code.toUpperCase() === code.toUpperCase() ? { ...s, isActive: !!isActive } : s
        ),
      }))
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const row = lp.marketConfig?.activeStocks?.find((s) => s.code.toUpperCase() === code.toUpperCase())
        if (row) {
          row.isActive = !!isActive
          saveLocalPlatform(lp)
        }
        return
      }
      await api.patch('/platform/market-config/stocks/' + encodeURIComponent(code), { isActive: !!isActive })
    } catch (err) {
      setMarketConfig((prev) => ({
        ...prev,
        activeStocks: prev.activeStocks.map((s) =>
          s.code.toUpperCase() === code.toUpperCase() ? { ...s, isActive: !s.isActive } : s
        ),
      }))
      setMarketMsg(extractError(err, 'Failed to update stock toggle.'))
      setTimeout(() => setMarketMsg(''), 3000)
    }
  }

  const toggleMarketIndex = async (code, isActive) => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      setMarketConfig((prev) => ({
        ...prev,
        activeIndices: prev.activeIndices.map((i) =>
          i.code.toUpperCase() === code.toUpperCase() ? { ...i, isActive: !!isActive } : i
        ),
      }))
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        const row = lp.marketConfig?.activeIndices?.find((i) => i.code.toUpperCase() === code.toUpperCase())
        if (row) {
          row.isActive = !!isActive
          saveLocalPlatform(lp)
        }
        return
      }
      await api.patch('/platform/market-config/indices/' + encodeURIComponent(code), { isActive: !!isActive })
    } catch (err) {
      setMarketConfig((prev) => ({
        ...prev,
        activeIndices: prev.activeIndices.map((i) =>
          i.code.toUpperCase() === code.toUpperCase() ? { ...i, isActive: !i.isActive } : i
        ),
      }))
      setMarketMsg(extractError(err, 'Failed to update index toggle.'))
      setTimeout(() => setMarketMsg(''), 3000)
    }
  }

  const saveInterval = async (refreshIntervalMs) => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    const ms = Math.max(60000, Math.min(3600000, Number(refreshIntervalMs) || 300000))
    try {
      setMarketConfig((prev) => ({ ...prev, refreshIntervalMs: ms }))
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        if (lp.marketConfig) {
          lp.marketConfig.refreshIntervalMs = ms
          saveLocalPlatform(lp)
        }
        setMarketMsg('Refresh interval saved (demo mode).')
        setTimeout(() => setMarketMsg(''), 3500)
        return
      }
      await api.patch('/platform/market-config/interval', { refreshIntervalMs: ms })
      setMarketMsg('Refresh interval updated. Takes effect on next market data fetch.')
      setTimeout(() => setMarketMsg(''), 3500)
    } catch (err) {
      setMarketMsg(extractError(err, 'Failed to update refresh interval.'))
      setTimeout(() => setMarketMsg(''), 4000)
    }
  }

  const saveMarketConfig = async () => {
    const isLocalAuth = useAuthStore.getState().isLocalUser()
    try {
      const payload = {
        activeStocks: marketConfig.activeStocks,
        activeIndices: marketConfig.activeIndices,
        refreshIntervalMs: marketConfig.refreshIntervalMs,
      }
      if (isLocalAuth) {
        const lp = loadLocalPlatform()
        lp.marketConfig = { ...(lp.marketConfig || defaultMarketConfig()), ...payload }
        saveLocalPlatform(lp)
        setMarketMsg('Market data controls saved locally (demo mode).')
        setTimeout(() => setMarketMsg(''), 3500)
        return
      }
      const { data } = await api.put('/platform/market-config', payload)
      if (data?.marketConfig) setMarketConfig(data.marketConfig)
      setMarketMsg('Market data configuration saved. Disabled stocks/indices will no longer consume API calls.')
      setTimeout(() => setMarketMsg(''), 4500)
    } catch (err) {
      setMarketMsg(extractError(err, 'Failed to save market configuration.'))
      setTimeout(() => setMarketMsg(''), 4500)
    }
  }

  const activeStockCount = (marketConfig.activeStocks || []).filter((s) => s.isActive !== false).length
  const activeIndexCount = (marketConfig.activeIndices || []).filter((i) => i.isActive !== false).length
  const estCallsPerDay = marketConfig.refreshIntervalMs
    ? Math.ceil((24 * 60 * 60 * 1000) / marketConfig.refreshIntervalMs) * Math.max(1, activeStockCount)
    : 0

  return (
    <div className={'ge-master' + (showHero ? '' : ' ge-master-embedded')}>
      {showHero && (
        <div className="ge-master-hero">
          <h2><FontAwesomeIcon icon={faShieldHalved} style={{ color: '#F39C12' }} /> Platform Controls</h2>
          <p>Rotate project keys, switch role dashboards on or off, and publish notices or ads.</p>
        </div>
      )}
      {msg && <div className="ge-master-msg">{msg}</div>}

      <div className={'ge-master-grid' + (showKeys ? '' : ' ge-master-grid-single')}>
        {showKeys && (
          <section className="ge-master-card">
            <h3><FontAwesomeIcon icon={faKey} /> Project & market keys</h3>
            <form onSubmit={saveKeys} className="ge-master-form">
              <label>Supabase URL
                <input value={keys.supabase_url} onChange={(e) => setKeys({ ...keys, supabase_url: e.target.value })} placeholder="https://xxxx.supabase.co" />
              </label>
              <label>Supabase anon / publishable key
                <input value={keys.supabase_anon_key} onChange={(e) => setKeys({ ...keys, supabase_anon_key: e.target.value })} placeholder="sb_publishable_… or eyJ…" />
              </label>
              <label>Google Gemini API key (Alternative / Fallback)
                <input value={keys.gemini_api_key} onChange={(e) => setKeys({ ...keys, gemini_api_key: e.target.value })} placeholder="Enter Google Gemini API key (AQ....)" />
              </label>
              <p className="ge-master-note">Service-role keys are never stored in the browser. Leave a masked field unchanged to keep the existing secret.</p>
              <button type="submit" className="ge-gold-submit" style={{ maxWidth: 220 }}><FontAwesomeIcon icon={faFloppyDisk} /> Save keys</button>
            </form>
          </section>
        )}

        <section className="ge-master-card">
          <h3><FontAwesomeIcon icon={faToggleOn} /> Dashboards <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Activate / Deactivate role portals</span></h3>
          <div className="ge-master-toggles">
            {loading && dashboards.length === 0 && (
              <div className="ge-toggle-empty">Loading dashboard configuration…</div>
            )}
            {!loading && dashboards.length === 0 && (
              <div className="ge-toggle-empty">No dashboard configurations available.</div>
            )}
            {dashboards.map((d) => (
              <div key={d.id} className={'ge-master-toggle-row' + (d.isActive ? ' on' : '')}>
                <div className="ge-master-toggle-left">
                  <FontAwesomeIcon icon={faCircleDot} className={'ge-toggle-dot ' + (d.isActive ? 'on' : 'off')} />
                  <div className="ge-master-toggle-info">
                    <span className="ge-master-toggle-label">{d.label}</span>
                    <small className="ge-master-toggle-role">Role: {d.role?.replace(/_/g, ' ') || d.id}</small>
                  </div>
                </div>
                <label className="ge-master-switch">
                  <input
                    type="checkbox"
                    checked={!!d.isActive}
                    onChange={(e) => toggleDash(d.id, e.target.checked)}
                  />
                  <span className="ge-master-slider">
                    <em className="ge-slider-label">{d.isActive ? 'Active' : 'Disabled'}</em>
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Market Data Controls ── */}
      <section className="ge-master-card ge-api-access-card">
        <h3><FontAwesomeIcon icon={faChartLine} /> Market Data Controls <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Manage API call usage & refresh interval</span></h3>

        {marketMsg && <div className="ge-api-access-msg">{marketMsg}</div>}

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Active Stocks
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: activeStockCount > 0 ? '#0F172A' : '#94A3B8' }}>
              {activeStockCount}<span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: 4 }}>/ {(marketConfig.activeStocks || []).length}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Active Indices
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: activeIndexCount > 0 ? '#0F172A' : '#94A3B8' }}>
              {activeIndexCount}<span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: 4 }}>/ {(marketConfig.activeIndices || []).length}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Refresh Interval
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A' }}>
              {(marketConfig.refreshIntervalMs / 60000).toFixed(0)}<span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: 4 }}>min</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 6 }}>
              Market Engines
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#16A34A', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Yahoo Finance <small style={{ color: '#2563EB', fontSize: '0.75rem', fontWeight: 600 }}>(Default Infinity)</small></span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Alt: Google Gemini AI</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Stocks column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                <FontAwesomeIcon icon={faChartLine} style={{ color: '#2563EB', marginRight: 8 }} />
                Stocks (Yahoo Default / Gemini Alt)
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Infinity loop ticker
              </span>
            </div>

            {/* Search and Add Stock Controls */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Search active stocks..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '8px' }}
              />
              <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="NSE Symbol (e.g. TATAMOTORS)"
                  value={newStockCode}
                  onChange={(e) => setNewStockCode(e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', textTransform: 'uppercase' }}
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={newStockLabel}
                  onChange={(e) => setNewStockLabel(e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
                <button
                  type="submit"
                  style={{ background: '#0B1C3B', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add
                </button>
              </form>
            </div>

            <div className="ge-master-toggles">
              {loading && (marketConfig.activeStocks || []).length === 0 && (
                <div className="ge-toggle-empty">Loading market configuration…</div>
              )}
              {(marketConfig.activeStocks || [])
                .filter((s) => {
                  if (!stockSearchQuery.trim()) return true
                  const q = stockSearchQuery.toLowerCase().trim()
                  return (s.code && s.code.toLowerCase().includes(q)) || (s.label && s.label.toLowerCase().includes(q))
                })
                .map((s) => (
                <div key={'stk-' + s.code} className={'ge-master-toggle-row' + (s.isActive ? ' on' : '')}>
                  <div className="ge-master-toggle-left">
                    <FontAwesomeIcon icon={faCircleDot} className={'ge-toggle-dot ' + (s.isActive ? 'on' : 'off')} />
                    <div className="ge-master-toggle-info">
                      <span className="ge-master-toggle-label">{s.label}</span>
                      <small className="ge-master-toggle-role">NSE symbol: {s.code}</small>
                    </div>
                  </div>
                  <label className="ge-master-switch">
                    <input
                      type="checkbox"
                      checked={!!s.isActive}
                      onChange={(e) => toggleMarketStock(s.code, e.target.checked)}
                    />
                    <span className="ge-master-slider">
                      <em className="ge-slider-label">{s.isActive ? 'Active' : 'Off'}</em>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Indices column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                <FontAwesomeIcon icon={faDatabase} style={{ color: '#7C3AED', marginRight: 8 }} />
                Indices (ticker)
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Off = hidden on ticker
              </span>
            </div>
            <div className="ge-master-toggles">
              {(marketConfig.activeIndices || []).map((i) => (
                <div key={'idx-' + i.code} className={'ge-master-toggle-row' + (i.isActive ? ' on' : '')}>
                  <div className="ge-master-toggle-left">
                    <FontAwesomeIcon icon={faCircleDot} className={'ge-toggle-dot ' + (i.isActive ? 'on' : 'off')} />
                    <div className="ge-master-toggle-info">
                      <span className="ge-master-toggle-label">{i.label}</span>
                      <small className="ge-master-toggle-role">Code: {i.code}</small>
                    </div>
                  </div>
                  <label className="ge-master-switch">
                    <input
                      type="checkbox"
                      checked={!!i.isActive}
                      onChange={(e) => toggleMarketIndex(i.code, e.target.checked)}
                    />
                    <span className="ge-master-slider">
                      <em className="ge-slider-label">{i.isActive ? 'Show' : 'Hide'}</em>
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Interval + Save column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                <FontAwesomeIcon icon={faClock} style={{ color: '#F59E0B', marginRight: 8 }} />
                Refresh Interval
              </h4>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                How often should the server fetch live market data from Yahoo Finance?
              </label>
              <select
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '0.9rem', borderRadius: 8,
                  border: '1px solid #CBD5E1', background: '#fff', color: '#0F172A', fontWeight: 500
                }}
                value={marketConfig.refreshIntervalMs}
                onChange={(e) => saveInterval(Number(e.target.value))}
              >
                {REFRESH_INTERVAL_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', lineHeight: 1.5, color: '#64748b' }}>
                ✓ <strong>Infinity Loop:</strong> Yahoo Finance is the primary live market engine. Google Gemini AI serves as intelligent alternative fallback if Yahoo Finance is temporarily unreachable.
              </p>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button type="button" className="ge-gold-submit" style={{ width: '100%', maxWidth: '100%' }} onClick={saveMarketConfig}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save Market Configuration
              </button>
            </div>

            <p className="ge-master-note" style={{ marginTop: '0.85rem' }}>
              Changes take effect immediately on next ticker fetch. Existing cached data will continue to be served until the interval expires.
            </p>
          </div>
        </div>
      </section>

      {/* ── API Access Control ── */}
      <section className="ge-master-card ge-api-access-card">
        <h3><FontAwesomeIcon icon={faDatabase} /> API Data Access Control <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Define what data each role can read or write</span></h3>

        <div className="ge-api-role-tabs">
          {ROLES_FOR_ACCESS.map(r => (
            <button
              key={r}
              type="button"
              className={'ge-api-role-tab' + (selectedAccessRole === r ? ' active' : '')}
              onClick={() => setSelectedAccessRole(r)}
            >
              {r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {accessMsg && <div className="ge-api-access-msg">{accessMsg}</div>}

        <div className="ge-api-scopes-grid">
          {DATA_SCOPES.map(scope => {
            const perms = apiAccess[selectedAccessRole]?.[scope.id] || { read: false, write: false }
            return (
              <div key={scope.id} className="ge-api-scope-row">
                <div className="ge-api-scope-info">
                  <span className="ge-api-scope-label">{scope.label}</span>
                  <small className="ge-api-scope-desc">{scope.description}</small>
                </div>
                <div className="ge-api-scope-perms">
                  <button
                    type="button"
                    className={'ge-api-perm-btn' + (perms.read ? ' on' : '')}
                    onClick={() => toggleScope(selectedAccessRole, scope.id, 'read')}
                    title={perms.read ? 'Disable Read' : 'Enable Read'}
                  >
                    <FontAwesomeIcon icon={perms.read ? faCheck : faXmark} />
                    <span>Read</span>
                  </button>
                  <button
                    type="button"
                    className={'ge-api-perm-btn write' + (perms.write ? ' on' : '')}
                    onClick={() => toggleScope(selectedAccessRole, scope.id, 'write')}
                    title={perms.write ? 'Disable Write' : 'Enable Write'}
                  >
                    <FontAwesomeIcon icon={perms.write ? faCheck : faXmark} />
                    <span>Write</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="ge-gold-submit" style={{ maxWidth: 220 }} onClick={saveApiAccess}>
            <FontAwesomeIcon icon={faFloppyDisk} /> Save Access Rules
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              setApiAccess(prev => ({
                ...prev,
                [selectedAccessRole]: Object.fromEntries(DATA_SCOPES.map(s => [s.id, { read: true, write: false }]))
              }))
            }}
          >
            Grant All Read
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              setApiAccess(prev => ({
                ...prev,
                [selectedAccessRole]: Object.fromEntries(DATA_SCOPES.map(s => [s.id, { read: false, write: false }]))
              }))
            }}
          >
            Revoke All
          </button>
        </div>

        <p className="ge-master-note" style={{ marginTop: '0.85rem' }}>These rules control what data each user role may request via the server API. Changes take effect immediately after saving.</p>
      </section>

      <section className="ge-master-card">
        <h3><FontAwesomeIcon icon={faBullhorn} /> Ads & notices <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Publish role-wide announcements</span></h3>
        <form onSubmit={postNotice} className="ge-master-form ge-master-notice-form">
          <div className="ge-notice-row ge-notice-row-split">
            <label className="ge-notice-field">
              <span>Type</span>
              <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
                <option value="notice">Notice</option>
                <option value="ad">Ad</option>
              </select>
            </label>
            <label className="ge-notice-field">
              <span>Audience</span>
              <select value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}>
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="employee">Employees</option>
                <option value="rm">RMs</option>
                <option value="advisor">Advisors</option>
              </select>
            </label>
          </div>
          <label className="ge-notice-field ge-notice-row-full">
            <span>Title</span>
            <input required placeholder="Short title for this notice or ad" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="ge-notice-field ge-notice-row-full">
            <span>Message</span>
            <textarea rows={4} placeholder="Body / description of the notice. Markdown not supported." value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          <div className="ge-notice-row ge-notice-actions">
            <button type="submit" className="ge-gold-submit"><FontAwesomeIcon icon={faPlus} /> Publish</button>
          </div>
        </form>
        <div className="ge-master-notice-list">
          {notices.length === 0 && (
            <div className="ge-toggle-empty">No notices published yet. Create one above.</div>
          )}
          {notices.map((n) => (
            <div key={n.id} className={'ge-master-notice-row' + (n.isActive ? '' : ' inactive')}>
              <div>
                <strong>{n.title}</strong>
                {n.body && <p>{n.body}</p>}
                <div>
                  <small className={'notice-badge ' + n.kind}>{n.kind === 'ad' ? 'Ad' : 'Notice'}</small>
                  <small>Audience: {n.audience === 'all' ? 'All roles' : n.audience}</small>
                  {n.createdAt && <small>Posted: {new Date(n.createdAt).toLocaleDateString()}</small>}
                </div>
              </div>
              <div className="notice-actions">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleNotice(n)} title={n.isActive ? 'Hide from audience' : 'Show to audience'}>
                  <FontAwesomeIcon icon={n.isActive ? faEye : faEyeSlash} />
                  <span>{n.isActive ? 'Hide' : 'Show'}</span>
                </button>
                <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => deleteNotice(n.id)} title="Delete permanently">
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

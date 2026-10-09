import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faUserTie,
  faSackDollar,
  faChartLine,
  faFilePdf,
  faFileExcel,
  faBolt,
  faPhone,
  faMessage,
  faCalendarPlus,
  faArrowRight,
  faBriefcase,
  faBuilding,
  faBuildingColumns,
  faHandHoldingDollar,
  faArrowTrendUp,
  faInbox,
  faSearch,
  faLightbulb,
  faShieldHalved,
  faPiggyBank,
  faCheck,
  faCheckDouble,
  faClock,
  faFileSignature,
  faIdCard,
  faCreditCard,
  faMoneyCheckDollar,
  faFileInvoiceDollar,
  faGear,
  faChartPie,
  faBullhorn,
  faNetworkWired,
  faHeadset,
  faWallet,
  faReceipt,
  faPercent,
  faStar,
  faCircleDot,
  faCircleCheck,
  faCircle,
  faLandmark,
  faStamp,
  faUserShield,
  faFileLines,
  faClipboardCheck,
  faPeopleGroup,
  faRocket,
  faBullseye,
  faCoins,
  faSterlingSign,
  faRotate,
  faLifeRing,
  faCalendarCheck,
  faFileAlt,
  faTicket,
  faHouseUser,
  faAddressCard,
  faMobileScreen,
  faEnvelope,
  faLocationDot,
  faCameraRotate,
  faPaperclip,
  faUpload,
  faComments,
  faReply,
  faEye,
  faRupeeSign,
  faUserGroup,
  faHandshake,
  faVault,
  faGaugeHigh,
  faMoneyBillTrendUp,
  faScaleBalanced,
  faTrophy,
  faXmarkCircle,
  faUserCheck,
  faFileCircleCheck,
  faMoneyBillTransfer,
  faUserPlus,
  faCashRegister,
  faMoneyBillWave,
  faFileInvoice,
  faCamera,
  faHouse,
  faCalendar,
  faCopy,
  faRightFromBracket,
  faLock
} from '@fortawesome/free-solid-svg-icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { useAuthStore } from '../store/auth'
import { fmtINR, fmtPct, fmtNum, initials, roleBadgeClass, roleLabel } from '../utils/format'
import api from '../api'
import SubBrokerDashboard from './SubBrokerDashboard'
import MasterAdmin from './MasterAdmin'
import NoticeBoard from '../components/NoticeBoard'

const COLORS = ['#0B1C3B', '#14305C', '#D12020', '#25D366', '#F39C12', '#2980b9', '#8e44ad', '#16a085']

const StatCard = ({ icon, label, value, sub, iconBg, accentColor, color }) => {
  const effectiveBg = iconBg || (color
    ? `linear-gradient(135deg, ${color}, ${color})`
    : undefined)
  const effectiveAccent = accentColor || color
  return (
    <div className="stat-card" style={effectiveAccent ? { borderLeftColor: effectiveAccent } : {}}>
      <div className="stat-icon" style={effectiveBg ? { background: effectiveBg } : {}}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

const WorkflowStep = ({ step, title, subtitle, status, stepNum, isLast }) => {
  const statusConfig = {
    done: { icon: faCheckDouble, color: '#25D366', bg: '#dcfce7', label: 'Done' },
    active: { icon: faCircleDot, color: '#D12020', bg: '#fee2e2', label: 'Active' },
    pending: { icon: faClock, color: '#F39C12', bg: '#fef3c7', label: 'Pending' },
    blocked: { icon: faCircle, color: '#94a3b8', bg: '#f1f5f9', label: 'Not Started' }
  }
  const sc = statusConfig[status] || statusConfig.blocked
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
        padding: '0.85rem 0.5rem', position: 'relative', minWidth: 0
      }}>
        {!isLast && (
          <div style={{
            position: 'absolute', top: '30px', left: 'calc(50% + 18px)', right: 'calc(-50% + 18px)',
            height: '3px', background: sc.color, opacity: status === 'done' ? 1 : status === 'active' ? 0.6 : 0.25,
            borderRadius: '2px', zIndex: 0
          }} />
        )}
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: sc.bg,
          color: sc.color, fontSize: '0.95rem', fontWeight: 700, zIndex: 1,
          border: `2px solid ${sc.color}40`, marginBottom: '0.6rem', flexShrink: 0
        }}>
          <FontAwesomeIcon icon={sc.icon} />
        </div>
        <div style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700,
          color: sc.color, background: sc.bg, padding: '0.12rem 0.55rem', borderRadius: '10px',
          marginBottom: '0.4rem', letterSpacing: '0.3px', textTransform: 'uppercase', flexShrink: 0
        }}>
          Step {stepNum} • {sc.label}
        </div>
        <div style={{
          fontWeight: 700, fontSize: '0.88rem', color: status === 'blocked' ? '#94a3b8' : '#0B1C3B',
          textAlign: 'center', marginBottom: '0.2rem', lineHeight: 1.3
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '0.74rem', color: status === 'blocked' ? '#cbd5e1' : '#64748b',
          textAlign: 'center', lineHeight: 1.4
        }}>
          {subtitle}
        </div>
      </div>
    </div>
  )
}

const WorkflowPipeline = ({ steps, title }) => {
  const normalized = (steps || []).map((s) => ({
    title: s.title,
    subtitle: s.subtitle ?? s.desc ?? '',
    status:
      typeof s.status === 'string'
        ? s.status.toLowerCase().replace(/\s+/g, '_') === 'active'
          ? 'active'
          : s.status.toLowerCase().replace(/\s+/g, '_') === 'done'
            ? 'done'
            : s.status.toLowerCase().replace(/\s+/g, '_') === 'pending'
              ? 'pending'
              : 'blocked'
        : (s.status || 'blocked')
  }))
  return (
    <div className="card">
      <div className="flex-between mb-1">
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem', marginTop: '2px' }}>
            Track your end-to-end workflow progress
          </p>
        </div>
        <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.74rem' }}>
          Pipeline View
        </span>
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', padding: '0.5rem 0' }}>
        {normalized.map((s, i) => (
          <WorkflowStep key={i} {...s} stepNum={i + 1} isLast={i === normalized.length - 1} />
        ))}
      </div>
    </div>
  )
}

const InfoCard = ({ icon, title, desc, stats, color, value, sub }) => (
  <div style={{
    background: '#fff', borderRadius: '14px', padding: '1rem',
    boxShadow: '0 2px 12px rgba(11,28,59,0.06)', borderLeft: `4px solid ${color || '#0B1C3B'}`,
    display: 'flex', flexDirection: 'column', gap: stats || desc ? '0.5rem' : '0.3rem', height: '100%'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      {icon && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', background: `${color || '#0B1C3B'}15`,
          color: color || '#0B1C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0
        }}>
          <FontAwesomeIcon icon={icon} />
        </div>
      )}
      <h4 style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>{title}</h4>
    </div>
    {value !== undefined && (
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0B1C3B', marginTop: 2 }}>{value}</div>
    )}
    {sub && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{sub}</div>}
    {desc && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>{desc}</p>}
    {stats && Array.isArray(stats) && stats.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: value !== undefined ? 4 : 'auto' }}>
        {stats.map((s, i) => (
          <span key={i} style={{
            background: `${color || '#0B1C3B'}10`, color: color || '#0B1C3B', padding: '0.22rem 0.6rem',
            borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700
          }}>
            {s}
          </span>
        ))}
      </div>
    )}
  </div>
)

const BigProgress = ({ label, value, max, color = '#D12020', sub }) => {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{
      background: '#fff', borderRadius: '14px', padding: '1.25rem',
      boxShadow: '0 2px 12px rgba(11,28,59,0.06)', borderTop: `4px solid ${color}`
    }}>
      <div className="flex-between mb-1">
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0B1C3B' }}>{label}</h4>
        <span className="badge" style={{ background: `${color}15`, color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0B1C3B' }}>{fmtINR(value)}</div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>of {fmtINR(max)} target</div>
      </div>
      <div style={{
        height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden', marginBottom: '0.5rem'
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: '7px', transition: 'width 0.5s ease'
        }} />
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{sub}</div>}
    </div>
  )
}

const DocCard = ({ icon, title, status, uploaded, color }) => {
  const statusMap = {
    Verified: { bg: '#dcfce7', fg: '#16a34a' },
    Pending: { bg: '#fef3c7', fg: '#92400e' },
    Uploaded: { bg: '#dbeafe', fg: '#1d4ed8' },
    Rejected: { bg: '#fee2e2', fg: '#dc2626' }
  }
  const s = statusMap[status] || statusMap.Pending
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '0.9rem 1rem',
      border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', gap: '0.85rem'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0
      }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B1C3B' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{uploaded}</div>
      </div>
      <span style={{
        background: s.bg, color: s.fg, fontSize: '0.7rem', fontWeight: 700,
        padding: '0.22rem 0.6rem', borderRadius: '10px'
      }}>
        {status}
      </span>
    </div>
  )
}

const AttendanceWeek = ({ record }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  let normalized = []
  if (Array.isArray(record)) {
    normalized = record
  } else if (record && typeof record === 'object') {
    normalized = days.map((d) => {
      const pair = record[d]
      if (Array.isArray(pair)) return pair[0] || 'Off'
      return '—'
    })
  } else {
    normalized = []
  }
  return (
    <div style={{
      background: '#fff', borderRadius: '14px', padding: '1rem',
      boxShadow: '0 2px 12px rgba(11,28,59,0.06)', borderLeft: '4px solid #16a085'
    }}>
      <div className="flex-between mb-2">
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0B1C3B' }}>
          <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 6, color: '#16a085' }} />
          Weekly Attendance — Current Week
        </h4>
        <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>On-time</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {days.map((d, i) => {
          const val = normalized[i]
          const working = i < 6
          return (
            <div key={d} style={{
              textAlign: 'center', padding: '0.6rem 0.3rem',
              borderRadius: '10px', background: working ? '#dcfce720' : '#f1f5f9',
              border: `1px solid ${working ? '#25D36630' : '#cbd5e150'}`
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: working ? '#16a34a' : '#94a3b8' }}>{d}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.3rem' }}>
                {working ? (val || '9:05') : '—'}
              </div>
              <FontAwesomeIcon icon={working ? faCheck : faXmarkCircle} style={{
                marginTop: '0.3rem', fontSize: '0.8rem',
                color: working ? '#25D366' : '#cbd5e1'
              }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SalarySlip = ({ data }) => (
  <div style={{
    background: 'linear-gradient(135deg,#0B1C3B,#14305C)',
    color: '#fff', borderRadius: '14px', padding: '1.25rem',
    boxShadow: '0 4px 18px rgba(11,28,59,0.2)'
  }}>
    <div className="flex-between mb-2">
      <div>
        <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>
          <FontAwesomeIcon icon={faMoneyCheckDollar} style={{ marginRight: 6, color: '#F39C12' }} />
          Salary — August 2026
        </h4>
        <div style={{ fontSize: '0.74rem', opacity: 0.8, marginTop: 2 }}>Payslip ID: GEN-2026-08-0147</div>
      </div>
      <span className="badge" style={{ background: '#25D366', color: '#fff', fontWeight: 700 }}>Credited</span>
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
      borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.9rem'
    }}>
      <div>
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 3 }}>Basic + DA</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmtINR(data.basic)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 3 }}>HRA + Allowances</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmtINR(data.hra)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 3 }}>Incentive / Bonus</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#25D366' }}>+{fmtINR(data.incentive)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 3 }}>PF + Tax Deducted</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F39C12' }}>-{fmtINR(data.pf)}</div>
      </div>
    </div>
    <div style={{
      marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px dashed rgba(255,255,255,0.2)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
    }}>
      <div>
        <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Net Take Home</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{fmtINR(data.net)}</div>
      </div>
      <FontAwesomeIcon icon={faRupeeSign} style={{ fontSize: '2rem', opacity: 0.3 }} />
    </div>
  </div>
)

const NotifPanel = ({ items, color = '#0B1C3B' }) => (
  <div style={{
    background: '#fff', borderRadius: '14px', padding: '1rem 1.1rem',
    boxShadow: '0 2px 12px rgba(11,28,59,0.06)', borderLeft: `4px solid ${color}`, height: '100%'
  }}>
    <div className="flex-between mb-2">
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0B1C3B' }}>
        <FontAwesomeIcon icon={faInbox} style={{ marginRight: 6, color }} /> Notifications
      </h4>
      <span className="badge" style={{ background: `${color}15`, color, fontWeight: 700 }}>{items.length} New</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 260, overflowY: 'auto' }}>
      {items.map((n, i) => (
        <div key={i} style={{
          display: 'flex', gap: '0.7rem', padding: '0.65rem 0.75rem',
          borderRadius: '10px', background: n.color ? `${n.color}08` : '#f8fafc',
          borderLeft: `3px solid ${n.color || color}`
        }}>
          <FontAwesomeIcon icon={n.icon || faMessage} style={{
            color: n.color || color, marginTop: 3, fontSize: '0.9rem', flexShrink: 0
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0B1C3B', lineHeight: 1.3 }}>{n.title}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ProfileCard = ({ client }) => (
  <div style={{
    background: 'linear-gradient(135deg,#f8fafc 0%,#dbeafe30 100%)',
    borderRadius: '14px', padding: '1.25rem',
    border: '1px solid #1e3a8a20'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <div className="avatar" style={{
        width: 62, height: 62, fontSize: '1.4rem',
        background: 'linear-gradient(135deg,#2980b9,#14305C)'
      }}>
        {initials(client.name)}
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#0B1C3B' }}>{client.name}</h4>
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Customer ID: {client.id}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <span className="badge badge-active" style={{ background: '#25D36622', color: '#16a34a' }}>
            <FontAwesomeIcon icon={faCircleCheck} /> Verified
          </span>
          <span className="badge" style={{ background: '#F39C1222', color: '#92400e' }}>
            Premium
          </span>
        </div>
      </div>
    </div>
    <div style={{ display: 'grid', gap: '0.55rem', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <FontAwesomeIcon icon={faMobileScreen} style={{ color: '#16a085', width: 18 }} />
        <span style={{ color: '#64748b' }}>Mobile:</span>
        <span style={{ fontWeight: 600, color: '#0B1C3B' }}>{client.mobile}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <FontAwesomeIcon icon={faEnvelope} style={{ color: '#2980b9', width: 18 }} />
        <span style={{ color: '#64748b' }}>Email:</span>
        <span style={{ fontWeight: 600, color: '#0B1C3B' }}>{client.email}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <FontAwesomeIcon icon={faAddressCard} style={{ color: '#8e44ad', width: 18 }} />
        <span style={{ color: '#64748b' }}>PAN:</span>
        <span style={{ fontWeight: 600, color: '#0B1C3B' }}>{client.pan}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <FontAwesomeIcon icon={faIdCard} style={{ color: '#D12020', width: 18 }} />
        <span style={{ color: '#64748b' }}>Aadhaar:</span>
        <span style={{ fontWeight: 600, color: '#0B1C3B' }}>{client.aadhaar}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
        <FontAwesomeIcon icon={faLocationDot} style={{ color: '#F39C12', width: 18, marginTop: 2 }} />
        <span style={{ color: '#64748b' }}>Address:</span>
        <span style={{ fontWeight: 600, color: '#0B1C3B', lineHeight: 1.4 }}>{client.address}</span>
      </div>
    </div>
  </div>
)

const SupportTickets = ({ tickets }) => (
  <div style={{
    background: '#fff', borderRadius: '14px', padding: '1.1rem',
    boxShadow: '0 2px 12px rgba(11,28,59,0.06)', borderLeft: '4px solid #8e44ad', height: '100%'
  }}>
    <div className="flex-between mb-2">
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0B1C3B' }}>
        <FontAwesomeIcon icon={faLifeRing} style={{ marginRight: 6, color: '#8e44ad' }} />
        Support Tickets & Service Requests
      </h4>
      <button className="btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
        <FontAwesomeIcon icon={faTicket} /> Raise Ticket
      </button>
    </div>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td style={{ fontWeight: 700, fontSize: '0.78rem', color: '#14305C' }}>{t.id}</td>
              <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                <FontAwesomeIcon icon={t.icon || faComments} style={{ color: '#8e44ad', marginRight: 6 }} />
                {t.subject}
              </td>
              <td>
                <span className="badge" style={{
                  background: t.status === 'Resolved' ? '#dcfce7' :
                            t.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                  color: t.status === 'Resolved' ? '#16a34a' :
                         t.status === 'In Progress' ? '#1d4ed8' : '#92400e',
                  fontWeight: 700, fontSize: '0.7rem'
                }}>{t.status}</span>
              </td>
              <td style={{ fontSize: '0.76rem', color: '#64748b' }}>{t.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({
    clientsCount: 0,
    staffCount: 0,
    aum: 0,
    netReturns: 0,
    commissionGenerated: 0,
    dashboardStatus: 'All Systems Live',
    newLeads: 0,
    conversions: 0,
    pendingApprovals: 0,
    branchCount: 0,
    portfolioDist: [],
    monthlyRevenue: [],
    roleWisePerformance: [],
    users: []
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get('/users'),
          api.get('/portfolio/admin-overview').catch(() => null)
        ])
        if (uRes.data) setData(d => ({ ...d, users: uRes.data.users || uRes.data || [] }))
        if (pRes?.data) setData(d => ({ ...d, ...pRes.data }))
      } catch (e) {}
    }
    load()
  }, [])

  const orgWorkflow = [
    { title: 'Lead Generation', subtitle: 'Advisors source new clients', status: 'done' },
    { title: 'Product Counseling', subtitle: 'RM & Advisors pitch products', status: 'done' },
    { title: 'Sales Closure', subtitle: 'Policy / SIP / Loan activation', status: 'active' },
    { title: 'KYC & Onboarding', subtitle: 'Docs verification & approval', status: 'active' },
    { title: 'Commission Payout', subtitle: 'Revenue share with all stakeholders', status: 'pending' }
  ]

  const crossRoleWorkflow = [
    { title: 'Client at Branch', subtitle: 'Customer walks in Genius Branch', status: 'done' },
    { title: 'Employee Opens A/c', subtitle: 'Aadhaar + PAN + Account Open', status: 'done' },
    { title: 'RM Suggests Plan', subtitle: 'Investment & Insurance advisory', status: 'done' },
    { title: 'ARM Collects Docs', subtitle: 'KYC + Forms + File Prep', status: 'active' },
    { title: 'Advisor Explains', subtitle: 'Product features & benefits call', status: 'active' },
    { title: 'Client Buys Policy', subtitle: 'Signs proposal & pays premium', status: 'pending' },
    { title: 'Commission Credit', subtitle: 'Advisor + RM + ARM payout', status: 'pending' },
    { title: 'Dashboard Update', subtitle: 'All dashboards refresh live', status: 'blocked' }
  ]

  return (
    <>
      <div className="grid-3 mb-2">
        <StatCard icon={faUsers} label="Total Clients" value={fmtNum(data.clientsCount)} sub="Across all regions" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" />
        <StatCard icon={faUserTie} label="Staff Members" value={fmtNum(data.staffCount)} sub="BM + RM + ARM + Advisor" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" />
        <StatCard icon={faSackDollar} label="Aggregate AUM" value={fmtINR(data.aum)} sub="All client portfolios" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" />
        <StatCard icon={faChartLine} label="Net Returns" value={fmtPct(data.netReturns)} sub="Weighted portfolio avg" iconBg="linear-gradient(135deg,#16a085,#0e6251)" />
        <StatCard icon={faHandHoldingDollar} label="Commission Paid" value={fmtINR(data.commissionGenerated)} sub="Company Payouts (MTD)" iconBg="linear-gradient(135deg,#D12020,#922b21)" />
        <StatCard icon={faBullhorn} label="New Leads (MTD)" value={fmtNum(data.newLeads)} sub="Fresh prospects added" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" />
      </div>

      <div className="grid-4 mb-2">
        <StatCard icon={faArrowTrendUp} label="Conversions" value={data.conversions} sub="MTD policy/SIP bookings" accentColor="#25D366" iconBg="linear-gradient(135deg,#25D366,#128c4a)" />
        <StatCard icon={faClock} label="Pending Approvals" value={data.pendingApprovals} sub="Awaiting your action" accentColor="#F39C12" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" />
        <StatCard icon={faBullseye} label="Monthly Target" value={`86%`} sub="Of ₹1.45Cr revenue goal" accentColor="#D12020" iconBg="linear-gradient(135deg,#D12020,#922b21)" />
        <StatCard icon={faBolt} label="Ops Status" value={data.dashboardStatus} sub="All services operational" accentColor="#0B1C3B" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" />
      </div>

      <WorkflowPipeline steps={orgWorkflow} title="Organization-Wide Sales Workflow" />

      <div className="card mb-2" style={{
        background: 'linear-gradient(135deg,#fef3c722,#dbeafe22)',
        border: '2px dashed #F39C1255'
      }}>
        <div className="flex-between mb-2" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0B1C3B' }}>
              <FontAwesomeIcon icon={faNetworkWired} style={{ color: '#D12020', marginRight: 8 }} />
              Real-Life Cross-Role Workflow — Client Onboarding Journey
            </h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.82rem', marginTop: 3 }}>
              How Employee → RM → ARM → Advisor → Client collaborate in a single customer transaction
            </p>
          </div>
          <span className="badge" style={{ background: '#D12020', color: '#fff', fontWeight: 700 }}>
            <FontAwesomeIcon icon={faHandshake} /> 8-Stage Unified Flow
          </span>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0.5rem 0', gap: 0 }}>
          {crossRoleWorkflow.map((s, i) => (
            <WorkflowStep key={i} {...s} stepNum={i + 1} isLast={i === crossRoleWorkflow.length - 1} />
          ))}
        </div>
      </div>

      <div className="grid-2 mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <InfoCard
            icon={faNetworkWired}
            title="Hierarchy & Team Ops"
            desc="Oversee 42 staff across complete 6-level hierarchy: Branch Manager → RM → ARM → Employee → Advisor → Client. 12 branches, 4 zones tracked centrally."
            stats={['4 Zones', `12 Branches`, '42 Active Staff']}
            color="#2980b9"
          />
          <InfoCard
            icon={faSterlingSign}
            title="Revenue Engine"
            desc="Combined monthly revenue ₹1.25Cr across Mutual Funds, Insurance, Loans, Savings. AUM growth 14.8% YoY. Company holds ₹18.5Cr client assets."
            stats={['4 Verticals', '₹18.5Cr AUM', '14.8% ROI']}
            color="#8e44ad"
          />
          <InfoCard
            icon={faClipboardCheck}
            title="KYC & Compliance"
            desc="Monitor document verification, account openings and policy issuance. SEBI + IRDAI + RBI regulatory compliance across entire 12-branch network."
            stats={['7 Pending', '248 Verified', '98.2% Pass']}
            color="#16a085"
          />
          <InfoCard
            icon={faFileInvoiceDollar}
            title="Payout & Commissions"
            desc="Automated commission calculation — RM 2%, ARM 0.5%, Advisor 5-25% product-wise. Transparent payout reports every 15th with invoice download."
            stats={['MTD ₹12.5L', '5 Rate Slabs', '100% On-time']}
            color="#D12020"
          />
        </div>
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Monthly Revenue & Commission Trend</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Last 6 Months</span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 100000).toFixed(1) + 'L'} />
                <Tooltip formatter={(v) => fmtINR(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Total Revenue" fill="#0B1C3B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="commission" name="Commission Payout" fill="#D12020" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Portfolio Distribution — Top Clients (AUM)</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.portfolioDist} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 100000).toFixed(0) + 'L'} />
                <Tooltip formatter={(v) => fmtINR(v)} />
                <Bar dataKey="totalValue" name="AUM (₹)" fill="#14305C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Role-wise Performance Snapshot — 6 Levels</h3>
            <button className="btn-primary btn-sm" onClick={() => navigate('/app/users')}>
              Manage Users <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Headcount</th>
                  <th>Avg Performance</th>
                  <th>Revenue Contribution</th>
                </tr>
              </thead>
              <tbody>
                {data.roleWisePerformance.map((r, i) => (
                  <tr key={i}>
                    <td><span className={`badge ${roleBadgeClass(r.role.toLowerCase().replace(' ', '_'))}`}>{r.role}</span></td>
                    <td>{r.count} active</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px',
                          overflow: 'hidden', maxWidth: '100px'
                        }}>
                          <div style={{
                            height: '100%', width: `${r.performance}%`,
                            background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`,
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0B1C3B' }}>{r.performance}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#16a085' }}>{fmtINR(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-1">
          <h3>User Directory — Full Hierarchy (7 Roles incl. Branch Manager)</h3>
          <button className="btn-outline btn-sm" onClick={() => navigate('/app/users')}>
            View All <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Reporting To</th>
              </tr>
            </thead>
            <tbody>
              {data.users.slice(0, 8).map((u) => (
                <tr key={u.id || u._id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar avatar-sm">{initials(u.name)}</div>
                      <div className="user-cell-info">
                        <div className="name">{u.name}</div>
                        <div className="email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleBadgeClass(u.role)}`}>{roleLabel(u.role)}</span></td>
                  <td><span className={`badge badge-${u.status === 'active' ? 'active' : 'inactive'}`}>{u.status || 'active'}</span></td>
                  <td style={{ fontSize: '0.82rem', color: '#666' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{u.reportsToName || 'Admin Office'}</td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No users loaded. Click "Manage Users" to view or create accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="platform-controls-admin-only">
        <div style={{
          marginTop: '2.2rem',
          padding: '1.1rem 1.3rem 1.25rem',
          marginBottom: '1rem',
          border: '1px solid rgba(20, 48, 92, 0.15)',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, rgba(11, 28, 59, 0.04), rgba(201, 162, 39, 0.03))',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem',
            borderBottom: '1px solid rgba(11, 28, 59, 0.08)', paddingBottom: '0.8rem', flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flex: 1, minWidth: 0 }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#14305C', fontSize: '1.05rem' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '1.08rem', color: '#0B1C3B', fontWeight: 800, letterSpacing: '0.2px' }}>
                  Platform Controls <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C9A227', letterSpacing: '0.5px', marginLeft: '0.55rem', textTransform: 'uppercase' }}>Admin Only</span>
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  Manage platform API keys, role dashboard visibility, and publish platform-wide notices.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              <Link to="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: 'white',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.15px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0B1C3B'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              >
                <FontAwesomeIcon icon={faHouse} />
                Back to Main Page
              </Link>
            </div>
          </div>
          <MasterAdmin mode="embedded" />
        </div>
      </div>
    </>
  )
}

function BranchManagerDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({
    branchName: 'Genius Enterprises — Main Branch',
    branchCode: 'GE-001',
    totalStaff: 0,
    clientsThisMonth: 0,
    branchAUM: 0,
    revenueMTD: 0,
    revenueTarget: 0,
    newAccounts: 0,
    policiesIssued: 0,
    sipsStarted: 0,
    loanDisbursed: 0,
    customerRating: 5.0,
    staffList: [],
    monthly: [],
    topProducts: [],
    notices: []
  })

  const bmWorkflow = [
    { title: 'Branch Morning Huddle', subtitle: 'Set daily targets for RM/ARM/Staff', status: 'done' },
    { title: 'High-Value Client Call', subtitle: 'HNI courtesy calls & RM accompany', status: 'done' },
    { title: 'KYC & Audit Review', subtitle: 'Sign pending verifications & compliance', status: 'active' },
    { title: 'Staff Target Review', subtitle: 'Mid-day numbers vs. monthly goal', status: 'active' },
    { title: 'Revenue & MIS Report', subtitle: 'Close day & submit report to ZO', status: 'pending' }
  ]

  return (
    <>
      <div className="card mb-2" style={{
        background: 'linear-gradient(135deg,#0B1C3B,#14305C)', color: '#fff', borderRadius: '16px'
      }}>
        <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, letterSpacing: 1 }}>BRANCH {data.branchCode}</div>
            <h3 style={{ color: '#fff', margin: '4px 0' }}>{data.branchName}</h3>
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 5 }} />
              {data.totalStaff} Staff • {data.clientsThisMonth} New Clients MTD • Rating ⭐ {data.customerRating}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Branch AUM</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#F39C12' }}>{fmtINR(data.branchAUM)}</div>
          </div>
        </div>
      </div>

      <div className="grid-3 mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <StatCard icon={faHouseUser} label="Total Staff" value={data.totalStaff} sub="Active Branch Staff" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faUsers} label="New Clients MTD" value={data.clientsThisMonth} sub="Walk-in + Referral + RM" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faMoneyBillTrendUp} label="Revenue MTD" value={fmtINR(data.revenueMTD)} sub="Branch total all verticals" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faLandmark} label="Accounts Opened" value={data.newAccounts} sub="Savings + Current MTD" iconBg="linear-gradient(135deg,#25D366,#128c4a)" accentColor="#25D366" />
        <StatCard icon={faShieldHalved} label="Policies Issued" value={data.policiesIssued} sub="Life + Health Combined" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faHandHoldingDollar} label="Loans Disbursed" value={fmtINR(data.loanDisbursed)} sub="Home + Personal MTD" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" accentColor="#F39C12" />
      </div>

      <div className="grid-4 mb-2">
        <StatCard icon={faChartLine} label="SIPs Started" value={data.sipsStarted} sub="New Mandates MTD" accentColor="#2980b9" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" />
        <StatCard icon={faTrophy} label="Zone Ranking" value="—" sub="North Zone" accentColor="#F39C12" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" />
        <StatCard icon={faStar} label="Customer Rating" value={`${data.customerRating} ★`} sub="Rating Score" accentColor="#8e44ad" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" />
        <StatCard icon={faGaugeHigh} label="Staff Avg Perf" value="0%" sub="Combined Team Metric" accentColor="#16a085" iconBg="linear-gradient(135deg,#16a085,#0e6251)" />
      </div>

      <WorkflowPipeline steps={bmWorkflow} title="Branch Manager — Daily Operational Workflow" />

      <div className="grid-2 mb-2">
        <BigProgress
          label="Branch Monthly Revenue Target"
          value={data.revenueMTD}
          max={data.revenueTarget}
          color="#D12020"
          sub="Target tracking active"
        />
        <NotifPanel items={data.notices} color="#8e44ad" />
      </div>

      <div className="grid-2 mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <InfoCard
            icon={faUserGroup}
            title="RM Leadership"
            desc="Lead 2 Relationship Managers handling 44 premium clients between them. Joint-call on HNI accounts above ₹20L AUM. Approve client concessions and fee waivers."
            stats={['2 Active RMs', '44 Clients', '₹4.85 Cr AUM']}
            color="#2980b9"
          />
          <InfoCard
            icon={faClipboardCheck}
            title="Compliance & Audit"
            desc="Daily review of KYC queue, cashier cash balance, RBI compliance checklist. Sign 32 new account openings every month. Audit scheduled bi-annually by Zonal Office."
            stats={['0 Audit Flaws', '98.2% KYC Pass', '15 Sign/Day Avg']}
            color="#16a085"
          />
          <InfoCard
            icon={faVault}
            title="Branch Operations"
            desc="Monitor cashier cabin, locker vault, ATM replenishment, server uptime, staff attendance and housekeeping. Escalate downtime or cash-shortage immediately to ZO."
            stats={['3 Lockers Free', 'ATM 100% Uptime', '4 Work Counters']}
            color="#F39C12"
          />
          <InfoCard
            icon={faScaleBalanced}
            title="Target vs Actual"
            desc="Branch monthly quota — ₹4.5L revenue, 40 new accounts, 20 policies, 25 SIPs. Track every product line daily in the huddle and course-correct underperformers."
            stats={['85.6% Revenue', '80% Accounts', '90% Policies']}
            color="#8e44ad"
          />
        </div>
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Branch Performance — 5 Month Trend</h3>
            <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
              Growing 📈
            </span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtINR(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => v} />
                <Legend />
                <Bar yAxisId="right" dataKey="accounts" name="Accounts Opened" fill="#2980b9" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="policies" name="Policies Issued" fill="#D12020" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="revenue" name="Branch Revenue (₹)" fill="#14305C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Branch Staff Performance Report</h3>
            <button className="btn-primary btn-sm" onClick={() => navigate('/app/users')}>
              View Team <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Clients</th>
                  <th>MTD Revenue</th>
                  <th>Perf %</th>
                </tr>
              </thead>
              <tbody>
                {data.staffList.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar avatar-sm">{initials(st.name)}</div>
                        <div>
                          <div className="name" style={{ fontWeight: 600 }}>{st.name}</div>
                          <div className="email" style={{ fontSize: '0.72rem' }}>{st.id}@genius.com</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleBadgeClass(st.role)}`}>{st.role.toUpperCase()}</span></td>
                    <td style={{ fontWeight: 700 }}>{st.clients || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{st.rev > 0 ? fmtINR(st.rev) : 'Ops'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px',
                          maxWidth: '100px', overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${st.perf}%`, height: '100%',
                            background: st.perf >= 90 ? 'linear-gradient(90deg,#25D366,#128c4a)'
                                    : st.perf >= 75 ? 'linear-gradient(90deg,#F39C12,#b9770e)'
                                    : 'linear-gradient(90deg,#D12020,#922b21)',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{st.perf}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Top Products Sold This Month (Branch)</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>5 Bestsellers</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product / Scheme</th>
                  <th>Count</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontWeight: 700 }}>{p.count}</td>
                    <td style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>{fmtINR(p.amt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function ARMDashboard() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState({
    todaysTasks: 0,
    pendingKyc: 0,
    meetings: 0,
    followUps: 0,
    policiesPending: 0,
    loanFiles: 0,
    docsCollected: 0,
    crmUpdates: 0,
    tasksList: [],
    rms: [],
    weeklyActivity: [],
    policyList: [],
    loanList: [],
    notifs: []
  })

  const armWorkflow = [
    { title: 'Task Received from RM', subtitle: 'Meeting / Docs / Call requests', status: 'done' },
    { title: 'Client Outreach Call', subtitle: 'Appointment confirmation & follow-up', status: 'done' },
    { title: 'Document Preparation', subtitle: 'KYC forms, loan files verification', status: 'active' },
    { title: 'Meeting Coordination', subtitle: 'Arrange RM-Client bridge or visit', status: 'active' },
    { title: 'CRM Status Update', subtitle: 'Log files, notes and completion status', status: 'pending' }
  ]

  return (
    <>
      <div className="grid-3 mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <StatCard icon={faBolt} label="Today's Tasks" value={data.todaysTasks} sub="Assigned by RM Team" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faFilePdf} label="Pending KYC" value={data.pendingKyc} sub="Verification queue" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" accentColor="#F39C12" />
        <StatCard icon={faCalendarPlus} label="Meeting Schedule" value={data.meetings} sub="Client & RM syncs today" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faPhone} label="Client Follow-up" value={data.followUps} sub="Pending callback queue" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faInbox} label="Pending Policies" value={data.policiesPending} sub="Issuance in-process" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faBriefcase} label="Loan Files" value={data.loanFiles} sub="Under verification stage" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" accentColor="#0B1C3B" />
      </div>

      <div className="grid-4 mb-2">
        <StatCard icon={faFileLines} label="Pending Documents" value={data.docsCollected > 32 ? 8 : 14} sub="Aadhaar + PAN + Forms" accentColor="#25D366" iconBg="linear-gradient(135deg,#25D366,#128c4a)" />
        <StatCard icon={faClipboardCheck} label="Task Completion" value={data.crmUpdates} sub="CRM entries this week" accentColor="#8e44ad" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" />
        <StatCard icon={faUserTie} label="Reporting RM" value={user?.reportsToName || 'Priya Sharma'} sub="Your Supervisor" accentColor="#2980b9" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" />
        <StatCard icon={faBullseye} label="Weekly Target" value="78%" sub="Docs & Task completion" accentColor="#F39C12" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" />
      </div>

      <WorkflowPipeline steps={armWorkflow} title="ARM Daily Workflow — RM Support Pipeline" />

      <div className="grid-2 mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <InfoCard
            icon={faHeadset}
            title="RM Support Desk"
            desc="Act as the backbone for RM team — schedule high-value client meetings, coordinate document pickups, confirm appointments and handle follow-up calls on behalf of assigned Relationship Managers."
            stats={['4 RM Buddies', '12 Tasks/Day', '4 Meetings Scheduled']}
            color="#8e44ad"
          />
          <InfoCard
            icon={faFileSignature}
            title="Document Management"
            desc="Collect, scan and verify KYC documents (Aadhaar, PAN, income proofs). Ensure loan files, insurance proposal forms and SIP mandates are complete before RM handoff."
            stats={['5 KYC Pending', '6 Loan Files', '32 Collected/Wk']}
            color="#F39C12"
          />
          <InfoCard
            icon={faCalendarPlus}
            title="Meeting & Diary Ops"
            desc="Coordinate RM calendars, fix client appointments, prepare meeting kits with relevant product brochures and post-meeting follow-up scheduling."
            stats={['4 Today', '14 This Week', '98% Attendance']}
            color="#2980b9"
          />
          <InfoCard
            icon={faGear}
            title="CRM Data Steward"
            desc="Keep CRM squeaky clean — log every call, upload documents, update client status, tag next follow-up date and flag any escalations back to RM in real-time."
            stats={['28 Updates/Wk', '5 Tags/Client', 'Escalations: 2']}
            color="#16a085"
          />
        </div>
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Weekly Activity — Calls, Meetings & Docs</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Last 6 Days</span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B1C3B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0B1C3B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="docsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D12020" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#D12020" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="calls" name="Outbound Calls" stroke="#0B1C3B" strokeWidth={2.5} fill="url(#callsGrad)" />
                <Area type="monotone" dataKey="docs" name="Docs Collected" stroke="#D12020" strokeWidth={2.5} fill="url(#docsGrad)" />
                <Line type="monotone" dataKey="meetings" name="Meetings Coordinated" stroke="#F39C12" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Insurance Policies — Pending Issue Desk</h3>
            <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
              {data.policyList.length} in Pipeline
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Plan</th>
                  <th>Stage</th>
                  <th>Aging Days</th>
                </tr>
              </thead>
              <tbody>
                {data.policyList.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar avatar-sm">{initials(p.client)}</div>
                        <div className="name" style={{ fontWeight: 600 }}>{p.client}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.plan}</td>
                    <td>
                      <span className="badge" style={{
                        background: p.stage.includes('Sanction') || p.stage.includes('Underwriting') ? '#dbeafe' : '#fef3c7',
                        color: p.stage.includes('Sanction') || p.stage.includes('Underwriting') ? '#1d4ed8' : '#92400e',
                        fontWeight: 700, fontSize: '0.72rem'
                      }}>{p.stage}</span>
                    </td>
                    <td style={{
                      fontWeight: 700, color: p.days > 3 ? '#dc2626' : p.days > 1 ? '#92400e' : '#16a34a'
                    }}>{p.days} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Loan Files — Verification Queue</h3>
            <span className="badge" style={{ background: '#0B1C3B22', color: '#14305C', fontWeight: 700 }}>
              {data.loanList.length} Files
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.loanList.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.client}</td>
                    <td style={{ fontSize: '0.82rem' }}>{l.product}</td>
                    <td>
                      <span className="badge" style={{
                        background: l.priority === 'High' ? '#fee2e2' : l.priority === 'Medium' ? '#fef3c7' : '#dcfce7',
                        color: l.priority === 'High' ? '#dc2626' : l.priority === 'Medium' ? '#92400e' : '#16a34a',
                        fontWeight: 700, fontSize: '0.72rem'
                      }}>{l.priority}</span>
                    </td>
                    <td>
                      <span className="badge badge-inactive" style={{
                        background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: '0.72rem'
                      }}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Today's Task Queue</h3>
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>{data.tasksList.length} Items</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Task Description</th>
                  <th>Client / Entity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.tasksList.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="badge" style={{
                        background: t.priority === 'High' ? '#fee2e2' : t.priority === 'Medium' ? '#fef3c7' : '#dcfce7',
                        color: t.priority === 'High' ? '#dc2626' : t.priority === 'Medium' ? '#92400e' : '#16a34a',
                        fontWeight: 700
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{t.task}</td>
                    <td>{t.client}</td>
                    <td>
                      <span className={`badge badge-${t.status.includes('Pending') ? 'inactive' : t.status.includes('Scheduled') ? 'inactive' : 'active'}`}
                        style={t.status.includes('Scheduled') ? { background: '#dbeafe', color: '#1d4ed8' } : {}}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="flex-between mb-1">
              <h3>RM Support Matrix — Live Status</h3>
              <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>4 RMs Active</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>RM Name</th>
                    <th>Zone</th>
                    <th>Pending Docs</th>
                    <th>Meetings</th>
                    <th>Handoffs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rms.map((rm) => (
                    <tr key={rm.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#2980b9,#1e3a72)' }}>{initials(rm.name)}</div>
                          <div>
                            <div className="name" style={{ fontWeight: 600 }}>{rm.name}</div>
                            <div className="email" style={{ fontSize: '0.75rem' }}>{rm.id}@genius.com</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#14305C' }}>{rm.zone}</td>
                      <td style={{ color: rm.pendingDocs > 2 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{rm.pendingDocs}</td>
                      <td style={{ fontWeight: 600 }}>{rm.meetings}</td>
                      <td style={{ fontWeight: 600, color: '#2980b9' }}>{rm.handoff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <NotifPanel items={data.notifs} color="#8e44ad" />
        </div>
      </div>
    </>
  )
}

function RMDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [data, setData] = useState({
    assignedClients: 0,
    premiumClients: 0,
    meetings: 0,
    salesCount: 0,
    revenue: 0,
    target: 0,
    commission: 0,
    commissionYear: 0,
    performance: 0,
    aumBook: 0,
    upsellPipeline: 0,
    topClients: [],
    salesBreakdown: [],
    quarterlyPerformance: [],
    team: [],
    loanStatus: [],
    insSales: 0,
    mfSales: 0
  })

  const rmWorkflow = [
    { title: 'High-Value Client Meeting', subtitle: 'Face-to-face or Zoom consultation', status: 'done' },
    { title: 'Portfolio Deep Review', subtitle: 'FD / MF / Insurance / Loan current state', status: 'done' },
    { title: 'Personalized Suggestions', subtitle: 'Investment, loan, insurance plans', status: 'active' },
    { title: 'Structured Follow-up', subtitle: 'Close pending issues and answer queries', status: 'active' },
    { title: 'Revenue & Target Tracking', subtitle: 'Book achieved commission & next target', status: 'pending' }
  ]

  return (
    <>
      <div className="grid-4 mb-2">
        <StatCard icon={faUsers} label="Assigned Clients" value={data.assignedClients} sub="Total Book Size" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faStar} label="Premium Clients" value={data.premiumClients} sub="HNI — Above ₹20L AUM" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" accentColor="#F39C12" />
        <StatCard icon={faCalendarPlus} label="Today's Meetings" value={data.meetings} sub="4 Client + 2 Internal" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faBriefcase} label="Product Sales" value={data.salesCount} sub="Loan / Insurance / MF MTD" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faHandHoldingDollar} label="Revenue" value={fmtINR(data.revenue)} sub="MTD commission generated" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faSackDollar} label="Target" value={fmtINR(data.target)} sub="Your monthly quota" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" accentColor="#0B1C3B" />
        <StatCard icon={faChartLine} label="Performance" value={`${data.performance}%`} sub="Target Achievement" iconBg="linear-gradient(135deg,#25D366,#128c4a)" accentColor="#25D366" />
        <StatCard icon={faPiggyBank} label="Total AUM Book" value={fmtINR(data.aumBook)} sub="All client assets" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
      </div>

      <div className="grid-4 mb-2">
        <StatCard icon={faShieldHalved} label="Insurance Sales" value={data.insSales} sub="Life + Health Policies" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faChartPie} label="Mutual Fund Sales" value={data.mfSales} sub="SIP + Lumpsum Booked" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faPhone} label="Pending Follow-up" value={data.upsellPipeline} sub="Client & RM callbacks" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faMoneyBillTrendUp} label="Commission" value={fmtINR(data.commission)} sub={`FY: ${fmtINR(data.commissionYear)}`} iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
      </div>

      <WorkflowPipeline steps={rmWorkflow} title="RM Client Advisory Workflow" />

      <div className="grid-2 mb-2">
        <BigProgress
          label="My Commission Earnings MTD"
          value={data.commission}
          max={90000}
          color="#8e44ad"
          sub={`₹22,500 incremental on target • Incentive slab 2% of AUM growth`}
        />
        <BigProgress
          label="Revenue Target — August 2026"
          value={data.revenue}
          max={data.target}
          color="#D12020"
          sub={`${fmtINR(data.target - data.revenue)} more to achieve 100% • 5 client meetings lined up this week`}
        />
      </div>

      <div className="grid-2 mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <InfoCard
            icon={faUsers}
            title="Client Relationship"
            desc="Personally manage 24 clients including 8 premium HNI accounts. Conduct quarterly portfolio reviews, understand life-stage goals and anticipate investment needs before they ask."
            stats={['8 HNI Clients', '24 Book Size', '94% Retention']}
            color="#2980b9"
          />
          <InfoCard
            icon={faChartPie}
            title="Wealth Advisory"
            desc="Deep review of MF portfolio, fixed income holdings, insurance coverage and outstanding loans. Rebalance allocation, suggest top-ups or switches based on market regime."
            stats={['₹3.25 Cr AUM', '5 Product Lines', '14.8% Avg Return']}
            color="#8e44ad"
          />
          <InfoCard
            icon={faSackDollar}
            title="Cross-Sell & Upsell"
            desc="Identify upsell opportunities across the book. Convert SIP to lumpsum, enhance life cover, top-up health insurance and pitch loan balance transfers for eligible clients."
            stats={['7 in Pipeline', '15 MTD Sales', '45% MF Mix']}
            color="#D12020"
          />
          <InfoCard
            icon={faPeopleGroup}
            title="Team Leadership"
            desc="Lead 3 Advisors and 1 ARM. Set weekly targets, joint-call for premium clients, review commission statements and mentor the team on product knowledge and closing skills."
            stats={['3 Advisors', '1 ARM Buddy', '90% Team Perf']}
            color="#16a085"
          />
        </div>
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Product Sales Mix — Current Quarter</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>₹4.5L Commission</span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.salesBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {data.salesBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v + '%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Quarterly Performance & Commission</h3>
            <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Last 4 Quarters</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.quarterlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="q" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtINR(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, n) => (typeof v === 'number' && v > 10000 ? fmtINR(v) : v)} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#14305C" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="commission" name="My Commission" fill="#8e44ad" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="sales" name="Sales Count" fill="#F39C12" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Loan Status — My Client Book</h3>
            <span className="badge" style={{ background: '#0B1C3B22', color: '#14305C', fontWeight: 700 }}>4 Live</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Loan Product</th>
                  <th>Amount</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {data.loanStatus.map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{l.client}</td>
                    <td>{l.product}</td>
                    <td style={{ fontWeight: 700 }}>{fmtINR(l.amount)}</td>
                    <td>
                      <span className="badge" style={{
                        background: l.stage === 'Disbursed' ? '#dcfce7' :
                                  l.stage === 'Sanctioned' ? '#dbeafe' :
                                  l.stage === 'Processing' ? '#fef3c7' : '#fee2e2',
                        color: l.stage === 'Disbursed' ? '#16a34a' :
                               l.stage === 'Sanctioned' ? '#1d4ed8' :
                               l.stage === 'Processing' ? '#92400e' : '#dc2626',
                        fontWeight: 700, fontSize: '0.72rem'
                      }}>{l.stage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-1" style={{ marginTop: '0.75rem' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.78rem' }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#16a34a' }} /> Portfolio Review & Follow-up Tracker
            </h5>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>AUM / Value</th>
                  <th>Risk</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar avatar-sm">{initials(c.name)}</div>
                        <div>
                          <div className="name" style={{ fontWeight: 600 }}>{c.name}</div>
                          <div className="email" style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.products}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0B1C3B' }}>{fmtINR(c.value)}</td>
                    <td>
                      <span className="badge" style={{
                        background: c.risk === 'Aggressive' ? '#fee2e2' : c.risk === 'Moderate' ? '#fef3c7' : '#dcfce7',
                        color: c.risk === 'Aggressive' ? '#dc2626' : c.risk === 'Moderate' ? '#92400e' : '#16a34a',
                        fontWeight: 700
                      }}>
                        {c.risk}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.followUp.includes('Done') || c.followUp.includes('Disbursed') ? 'active' : c.followUp.includes('Scheduled') ? 'inactive' : 'inactive'}`}
                        style={
                          c.followUp.includes('Scheduled') ? { background: '#dbeafe', color: '#1d4ed8' } :
                          c.followUp.includes('Pending') || c.followUp.includes('On-boarded') ? { background: '#fef3c7', color: '#92400e' } : {}
                        }>
                        {c.followUp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-1">
          <h3>My Team — Advisors & ARM Performance</h3>
          <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>4 Members</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role</th>
                <th>Clients / Cases</th>
                <th>MTD Contribution</th>
                <th>Target %</th>
              </tr>
            </thead>
            <tbody>
              {data.team.map((tm) => (
                <tr key={tm.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar avatar-sm">{initials(tm.name)}</div>
                      <div>
                        <div className="name" style={{ fontWeight: 600 }}>{tm.name}</div>
                        <div className="email" style={{ fontSize: '0.72rem' }}>{tm.id}@genius.com</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleBadgeClass(tm.role)}`}>{tm.role.toUpperCase()}</span></td>
                  <td style={{ fontWeight: 600 }}>{tm.advisees ? tm.advisees + ' advisees' : 'Ops Support'}</td>
                  <td style={{ fontWeight: 700, color: '#16a085' }}>{tm.mtdSales > 0 ? fmtINR(tm.mtdSales * 100000) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px',
                        overflow: 'hidden', maxWidth: '120px'
                      }}>
                        <div style={{
                          height: '100%', width: `${tm.targetMet}%`,
                          background: tm.targetMet >= 85 ? 'linear-gradient(90deg,#25D366,#128c4a)' : tm.targetMet >= 70 ? 'linear-gradient(90deg,#F39C12,#b9770e)' : 'linear-gradient(90deg,#D12020,#922b21)',
                          borderRadius: '4px'
                        }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{tm.targetMet}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function AdvisorDashboard() {
  const [data, setData] = useState({
    totalClients: 0,
    todaysMeetings: 0,
    policySold: 0,
    mfSip: 0,
    mfLumpsum: 0,
    commission: 0,
    renewals: 0,
    targetProgress: 0,
    targetSales: 0,
    targetCommission: 0,
    leadsInPipeline: 0,
    demosDone: 0,
    allocation: [],
    weeklyLeads: [],
    advisees: [],
    leadSource: [],
    renewalList: [],
    sipBook: []
  })

  const advisorWorkflow = [
    { title: 'Client Prospecting', subtitle: 'Generate leads via referrals & outreach', status: 'done' },
    { title: 'Product Counseling', subtitle: 'Explain insurance & mutual fund solutions', status: 'done' },
    { title: 'Sale Closure', subtitle: 'Policy proposal or SIP mandate signed', status: 'active' },
    { title: 'KYC Completion', subtitle: 'Documents submitted & verification completed', status: 'active' },
    { title: 'Commission Earned', subtitle: 'Brokerage credit issued to account', status: 'pending' }
  ]

  return (
    <>
      <div className="grid-4 mb-2">
        <StatCard icon={faUsers} label="Total Clients" value={data.totalClients} sub="With live portfolio" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faCalendarPlus} label="Today's Meetings" value={data.todaysMeetings} sub="Client calls & branch visits" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faFileSignature} label="Policies Sold" value={data.policySold} sub="Current Month Bookings" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faChartLine} label="Mutual Fund SIPs" value={fmtINR(data.mfSip)} sub="Monthly Inflow" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faHandHoldingDollar} label="Commission" value={fmtINR(data.commission)} sub="Earned Month-to-date" iconBg="linear-gradient(135deg,#25D366,#128c4a)" accentColor="#25D366" />
        <StatCard icon={faRotate} label="Renewals" value={data.renewals} sub="Premium & SIP top-up" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" accentColor="#F39C12" />
        <StatCard icon={faBullseye} label="Target Progress" value={`${data.targetProgress}%`} sub="Monthly Sales Quota" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" accentColor="#0B1C3B" />
        <StatCard icon={faIdCard} label="Pending KYC" value={5} sub="Aadhaar + PAN + Income Proof" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
      </div>

      <div className="grid-2 mb-2">
        <BigProgress
          label="Sales Target — Policies & SIP Combined"
          value={data.policySold}
          max={data.targetSales}
          color="#D12020"
          sub={`${data.targetSales - data.policySold} more policies to achieve monthly target • Close rate 39% currently`}
        />
        <BigProgress
          label="Commission Earnings Goal"
          value={data.commission}
          max={data.targetCommission}
          color="#16a085"
          sub={`Next payout 15th August • FY earnings so far ₹5,80,000 across 42 clients`}
        />
      </div>

      <WorkflowPipeline steps={advisorWorkflow} title="Advisor Sales Workflow — Prospect to Payout" />

      <div className="grid-2 mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <InfoCard
            icon={faBullhorn}
            title="Lead Generation"
            desc="Build your own prospect funnel through client referrals, cold outreach, social media and RM handoffs. Convert leads into meetings and then into sales."
            stats={['14 Hot Leads', '5 Sources', '39% Avg Close']}
            color="#D12020"
          />
          <InfoCard
            icon={faLightbulb}
            title="Product Knowledge"
            desc="Explain Term Life, Health, ULIP, Endowment, Mutual Fund (SIP & Lumpsum). Illustrate maturity benefits, tax deductions under 80C/D and claim process examples."
            stats={['4 Product Lines', '18 Policies MTD', '42 Live Clients']}
            color="#8e44ad"
          />
          <InfoCard
            icon={faIdCard}
            title="KYC & Documentation"
            desc="Ensure every sale is backed by clean KYC — Aadhaar, PAN, Income Proof, Account Details. Follow-up for missing documents so policy issues fast."
            stats={['5 Pending', '13 Completed', '2.1 Day Avg TAT']}
            color="#F39C12"
          />
          <InfoCard
            icon={faCoins}
            title="Commission & Payouts"
            desc="Track your earnings on every policy and SIP booked — first-year commission, renewal commission and MF trail. Payouts are credited directly to your bank every 15th."
            stats={['MTD ₹48,500', 'Next: 15 Aug', 'FY ₹5.8L']}
            color="#16a085"
          />
        </div>
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Weekly Funnel — Leads → Demos → Closings</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Month of August</span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.weeklyLeads} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="New Leads" fill="#0B1C3B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="demos" name="Product Demos" fill="#2980b9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="closes" name="Sales Closed" fill="#25D366" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mb-2">
        <div className="flex-between mb-1">
          <h3>
            <FontAwesomeIcon icon={faRotate} style={{ marginRight: 6, color: '#F39C12' }} />
            Renewals Due — Premium & SIP Top-up (Next 30 Days)
          </h3>
          <span className="badge" style={{ background: '#F39C1222', color: '#92400e', fontWeight: 700 }}>
            {data.renewalList.length} Items • ₹{(data.renewalList.reduce((s, r) => s + r.amount, 0)).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Product / Scheme</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Renewal Status</th>
              </tr>
            </thead>
            <tbody>
              {data.renewalList.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.client}</td>
                  <td style={{ fontSize: '0.82rem' }}>{r.product}</td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 600, color: '#14305C' }}>{r.dueDate}</td>
                  <td style={{ fontWeight: 700 }}>{fmtINR(r.amount)}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.status.includes('Ready') ? '#dcfce7' :
                                r.status.includes('Sent') || r.status.includes('Scheduled') ? '#dbeafe' :
                                r.status.includes('Call') ? '#fef3c7' : '#fee2e2',
                      color: r.status.includes('Ready') ? '#16a34a' :
                             r.status.includes('Sent') || r.status.includes('Scheduled') ? '#1d4ed8' :
                             r.status.includes('Call') ? '#92400e' : '#dc2626',
                      fontWeight: 700, fontSize: '0.72rem'
                    }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Product-wise Sales Mix — Commission</h3>
            <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>Commission Split</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {data.allocation.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v + '%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>
              <FontAwesomeIcon icon={faChartLine} style={{ marginRight: 6, color: '#16a085' }} />
              My MF SIP Book
            </h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>
              {fmtINR(data.mfSip)} / Month
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th>Avg SIP</th>
                  <th>Clients</th>
                  <th>Monthly Amt</th>
                  <th>XIRR</th>
                </tr>
              </thead>
              <tbody>
                {data.sipBook.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.scheme}</td>
                    <td>{fmtINR(s.sip)}</td>
                    <td style={{ fontWeight: 700 }}>{s.clients}</td>
                    <td style={{ fontWeight: 700, color: '#14305C' }}>{fmtINR(s.total)}</td>
                    <td style={{ fontWeight: 700, color: s.xirr > 15 ? '#16a34a' : '#2980b9' }}>{s.xirr}% ★</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Lead Sources — Quality & Conversion</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Total 69 Leads</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Leads</th>
                  <th>Close Rate</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {data.leadSource.map((ls, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{ls.source}</td>
                    <td style={{ fontWeight: 700 }}>{ls.count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px',
                          overflow: 'hidden', maxWidth: '100px'
                        }}>
                          <div style={{
                            height: '100%', width: `${ls.closeRate}%`,
                            background: ls.closeRate >= 50 ? '#25D366' : ls.closeRate >= 30 ? '#F39C12' : '#D12020',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{ls.closeRate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: ls.closeRate >= 50 ? '#dcfce7' : ls.closeRate >= 30 ? '#fef3c7' : '#fee2e2',
                        color: ls.closeRate >= 50 ? '#16a34a' : ls.closeRate >= 30 ? '#92400e' : '#dc2626',
                        fontWeight: 700
                      }}>
                        {ls.closeRate >= 50 ? 'Excellent' : ls.closeRate >= 30 ? 'Good' : 'Warm'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Recent Client Interactions — Live Sales Pipeline</h3>
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>{data.advisees.length} Entries</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Stage</th>
                  <th>Last Contact</th>
                  <th>Next Action</th>
                </tr>
              </thead>
              <tbody>
                {data.advisees.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar" style={{ background: a.color }}>{initials(a.name)}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{a.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{a.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.product}</td>
                    <td>
                      <span className="badge" style={{
                        background: a.stage === 'Closed' ? '#dcfce7' : a.stage === 'Proposal' ? '#dbeafe' : a.stage === 'Negotiation' ? '#fef3c7' : a.stage === 'Lead' ? '#fee2e2' : '#f1f5f9',
                        color: a.stage === 'Closed' ? '#16a34a' : a.stage === 'Proposal' ? '#1d4ed8' : a.stage === 'Negotiation' ? '#92400e' : a.stage === 'Lead' ? '#dc2626' : '#475569',
                        fontWeight: 700
                      }}>{a.stage}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>{a.lastContact}</td>
                    <td>
                      <span className="badge" style={{ background: '#ecfeff', color: '#0e7490', fontWeight: 600 }}>{a.nextAction}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function EmployeeDashboard() {
    const navigate = useNavigate()
    const data = {
      todayCustomers: 0,
      accountOpenings: 0,
      pendingVerifications: 0,
      loanRequests: 0,
      insuranceRequests: 0,
      mfRequests: 0,
      attendance: { Mon: ['—', '—'], Tue: ['—', '—'], Wed: ['—', '—'], Thu: ['—', '—'], Fri: ['—', '—'], Sat: ['—', '—'], Sun: [null, null] },
      salary: { payslipId: 'SLP-2026-0000', month: 'August 2026', basic: 0, hra: 0, incentive: 0, pf: 0, professionalTax: 0, net: 0 },
      notifications: [],
      quickActions: [
        { icon: faUserPlus, label: 'New Account', color: '#25D366', action: 'new-account' },
        { icon: faShieldHalved, label: 'Insurance', color: '#9333ea', action: 'insurance' },
        { icon: faSackDollar, label: 'Mutual Fund', color: '#ca8a04', action: 'mutual-fund' },
        { icon: faFileInvoice, label: 'Reports', color: '#0891b2', action: 'reports' }
      ],
      footfall: [],
      register: [],
      kycBacklog: []
    };
    return (
      <div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #0B1C3B 0%, #14346b 100%)', color: '#fff', border: 'none' }}>
          <div className="flex-between">
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>👤 Bank Employee · Counter No. <b>03</b></div>
              <h2 style={{ color: '#fff', margin: '0.4rem 0' }}>Welcome, <b>Employee Operations</b> 🏦</h2>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>EMP ID: EMP-10452 · Branch Operations · Shift: General (9 AM – 6 PM)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data.todayCustomers}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Customers Served Today</div>
            </div>
          </div>
        </div>

        <div className="grid-4 mt-1">
          <StatCard icon={faUsers} label="Today's Customers" value={fmtNum(data.todayCustomers)} sub="0 Deposit · 0 Withdraw · 0 Service" color="#0B1C3B" />
          <StatCard icon={faCreditCard} label="Today's Account Openings" value={fmtNum(data.accountOpenings)} sub="0 Savings · 0 Current · 0 PPF" color="#25D366" />
          <StatCard icon={faClock} label="Pending Verifications" value={fmtNum(data.pendingVerifications)} sub="0 Aadhaar · 0 PAN · 0 Photo" color="#F39C12" />
          <StatCard icon={faCopy} label="Loan Requests" value={fmtNum(data.loanRequests)} sub="0 Home · 0 Personal · 0 Vehicle" color="#D12020" />
        </div>
        <div className="grid-4 mt-1">
          <StatCard icon={faShieldHalved} label="Insurance Requests" value={fmtNum(data.insuranceRequests)} sub="0 Life · 0 Health" color="#9333ea" />
          <StatCard icon={faChartLine} label="Mutual Fund Requests" value={fmtNum(data.mfRequests)} sub="0 SIP · 0 Lumpsum" color="#ca8a04" />
          <StatCard icon={faHandHoldingDollar} label="Cash Handled Today" value={fmtINR(0)} sub="₹0 Deposit · ₹0 Withdraw" color="#0e7490" />
          <StatCard icon={faFileLines} label="Reports Generated" value="0" sub="0 Cash · 0 Account · 0 Audit" color="#0891b2" />
        </div>

        <div className="grid-2 mt-1">
          <div className="card">
            <h3 className="mb-1">🗓️ Weekly Attendance</h3>
            <AttendanceWeek record={data.attendance} />
          </div>
          <div>
            <SalarySlip data={data.salary} />
          </div>
        </div>

        <div className="grid-3 mt-1">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 className="mb-1">Daily Office Workflow</h3>
            <WorkflowPipeline steps={[
              { no: 1, title: 'Report to Branch', desc: 'Login, Cash vault check', status: 'Done' },
              { no: 2, title: 'Customer Welcome', desc: 'Token, Query Resolution', status: 'Done' },
              { no: 3, title: 'Document Verification', desc: 'Aadhaar + PAN + KYC', status: 'Active' },
              { no: 4, title: 'Transaction Processing', desc: 'Account, Loan, Insurance, MF', status: 'Pending' },
              { no: 5, title: 'End-of-Day Reports', desc: 'Cash tally, MIS, Vault close', status: 'Pending' }
            ]} />
          </div>
          <NotifPanel items={data.notifications} />
        </div>

        <div className="card mt-1">
          <h3 className="mb-1">⚡ Quick Actions — Counter Work</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {data.quickActions.map((q, i) => (
              <div
                key={i}
                className="quick-action-tile"
                style={{ borderColor: q.color + '55', cursor: 'pointer' }}
                onClick={() => {
                  if (q.action === 'reports') {
                    navigate('/app/reports')
                  } else if (q.action === 'new-account') {
                    navigate('/app/users')
                  } else if (q.action === 'insurance' || q.action === 'mutual-fund') {
                    navigate('/app/clients')
                  }
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: q.color + '18', color: q.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'
                }}>
                  <FontAwesomeIcon icon={q.icon} size="lg" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{q.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2 mt-1">
          <div className="card">
            <h3 className="mb-1">📊 Branch Footfall — This Week</h3>
            <div style={{ width: '100%', height: '260px' }}>
              <AreaChart data={data.footfall}>
                <defs>
                  <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B1C3B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0B1C3B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="cust" stroke="#0B1C3B" strokeWidth={3} fill="url(#custGrad)" />
              </AreaChart>
            </div>
          </div>
          <div className="card">
            <div className="flex-between mb-1">
              <h3>🎯 Branch Monthly Milestone</h3>
              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>0% Complete</span>
            </div>
            <BigProgress label="Branch Deposit Target" value={0} max={0} color="#25D366" sub="₹0 / ₹0" />
            <div style={{ marginTop: '1rem' }}>
              <BigProgress label="Account Opening Target" value={0} max={0} color="#0B1C3B" sub="0 A/C / 0 A/C" />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <BigProgress label="Cross-Sell (Insurance)" value={0} max={0} color="#9333ea" sub="0 Policies / 0 Target" />
            </div>
          </div>
        </div>

        <div className="grid-2 mt-1">
          <div className="card">
            <div className="flex-between mb-1">
              <h3>📋 Counter Register — Today's Transactions</h3>
              <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>{data.register.length} Entries</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.register.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#0B1C3B' }}>{r.time}</td>
                      <td style={{ fontWeight: 600 }}>{r.cust}</td>
                      <td>{r.service}</td>
                      <td style={{ fontWeight: 700 }}>{r.amount > 0 ? fmtINR(r.amount) : '—'}</td>
                      <td>
                        <span className="badge" style={{
                          background: r.status === 'Done' ? '#dcfce7' : '#fef3c7',
                          color: r.status === 'Done' ? '#16a34a' : '#92400e', fontWeight: 700
                        }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="flex-between mb-1">
              <h3>⚠️ KYC Backlog Queue</h3>
              <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>{data.kycBacklog.length} Pending</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Document</th>
                    <th>Age (Days)</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kycBacklog.map((k, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{k.cust}</td>
                      <td>{k.doc}</td>
                      <td style={{ fontWeight: 700, color: k.age >= 3 ? '#D12020' : '#475569' }}>{k.age}d</td>
                      <td>
                        <span className="badge" style={{
                          background: k.priority === 'Critical' ? '#fee2e2' : k.priority === 'High' ? '#fef3c7' : k.priority === 'Medium' ? '#dbeafe' : '#f1f5f9',
                          color: k.priority === 'Critical' ? '#dc2626' : k.priority === 'High' ? '#92400e' : k.priority === 'Medium' ? '#1d4ed8' : '#475569',
                          fontWeight: 700
                        }}>{k.priority}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <div style={{ fontWeight: 700, color: '#92400e' }}>💡 Standard Branch Workflow</div>
              <div style={{ fontSize: '0.88rem', color: '#78350f', marginTop: '0.4rem' }}>
                <b>Client Walk-in Protocol:</b> Verify Aadhaar ✔ Verify PAN ✔ Open Savings Account ✔ Issue Debit Card ✔ — Service Request Completed.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}

function ClientDashboard() {
  const user = useAuthStore((s) => s.user)
  const profile = {
    name: user?.name || 'Client Account',
    customerId: user?.id ? `CUST-${user.id.slice(0, 6)}` : 'CUST-00001',
    mobile: user?.phone || '+91 00000 00000',
    email: user?.email || 'client@genius.com',
    pan: user?.pan || 'ABCDE1234F',
    aadhaar: user?.aadhaar || 'XXXX XXXX 0000',
    dob: '—',
    address: 'On File',
    nomName: 'Nominee on File',
    color: '#0B1C3B'
  }
  const data = {
    savingsAcc: { no: 'SB-0000 0000 0000', balance: 0, ifsc: 'GEN0000001' },
    fdTotal: 0,
    mfValue: 0,
    insuranceSum: 0,
    loanEmi: 0,
    docs: [],
    tickets: [],
    insurance: [],
    mutualFunds: [],
    loan: [],
    transactions: [],
    cashflow: [],
    wealthAlloc: []
  }
  return (
    <div>
      <div className="grid-3">
        <div style={{ gridColumn: 'span 2' }}>
          <ProfileCard client={{ ...profile, accounts: 'Savings Account', since: 'New Account' }} />
        </div>
        <div className="grid-2">
          <StatCard icon={faPiggyBank} label="Savings A/c" value={fmtINR(data.savingsAcc.balance)} sub={`${data.savingsAcc.no.slice(-4)}`} color="#0B1C3B" />
          <StatCard icon={faVault} label="Fixed Deposits" value={fmtINR(data.fdTotal)} sub="0 FDs Active" color="#25D366" />
          <StatCard icon={faChartLine} label="Mutual Funds" value={fmtINR(data.mfValue)} sub="0 Schemes" color="#F39C12" />
          <StatCard icon={faShieldHalved} label="Insurance Cover" value={fmtINR(data.insuranceSum)} sub={`${data.insurance.length} Active Policies`} color="#9333ea" />
        </div>
      </div>

      <div className="card mt-1">
        <h3 className="mb-1">🛤️ Your Client Journey</h3>
        <WorkflowPipeline steps={[
          { no: 1, title: 'Account Registered', desc: 'Authentication Setup Complete', status: 'Done' },
          { no: 2, title: 'KYC Verification', desc: 'Submit Identity & Address Proof', status: 'Active' },
          { no: 3, title: 'First Investment / Deposit', desc: 'Savings, FD or Mutual Fund', status: 'Pending' },
          { no: 4, title: 'Insurance Protection', desc: 'Life & Health Coverage', status: 'Pending' },
          { no: 5, title: 'Wealth Management', desc: 'Portfolio Advisory & Growth', status: 'Pending' }
        ]} />
      </div>

        <div className="grid-2 mt-1">
          <div className="card">
            <h3 className="mb-1">📁 KYC Documents Vault</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {data.docs.map((d, i) => (
                <DocCard key={i} icon={d.icon} title={d.title} status={d.status} uploaded={d.uploaded} color={d.color} />
              ))}
            </div>
            <button className="btn btn-primary mt-1" style={{ width: '100%' }}>
              <FontAwesomeIcon icon={faUpload} /> &nbsp; Upload Pending Documents
            </button>
          </div>
          <div>
            <SupportTickets tickets={data.tickets} />
          </div>
        </div>

        <div className="grid-2 mt-1">
          <div className="card">
            <div className="flex-between mb-1">
              <h3>🛡️ My Insurance Policies</h3>
              <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>{data.insurance.length} Active</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Policy No.</th>
                    <th>Premium</th>
                    <th>Sum Assured</th>
                    <th>Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {data.insurance.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.policyNo}</td>
                      <td style={{ fontWeight: 600 }}>{fmtINR(p.premium)}</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>{fmtINR(p.sumAssured)}</td>
                      <td style={{ fontSize: '0.85rem', color: '#0B1C3B', fontWeight: 600 }}>{p.nextDue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="flex-between mb-1">
              <h3>📈 Mutual Fund Holdings</h3>
              <span className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>+18.4% CAGR</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Scheme</th>
                    <th>Units</th>
                    <th>NAV</th>
                    <th>Value</th>
                    <th>XIRR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mutualFunds.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{f.scheme}</td>
                      <td style={{ fontFamily: 'monospace' }}>{f.units.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>₹{f.nav.toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>{fmtINR(f.value)}</td>
                      <td>
                        <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>+{f.xirr}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'linear-gradient(90deg, #ecfdf5, #dcfce7)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Investment</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0B1C3B' }}>{fmtINR(0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>Unrealized P/L</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#16a34a' }}>+{fmtINR(0)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2 mt-1">
          <div className="card">
            <div className="flex-between mb-1">
              <h3>🏠 Home Loan EMI Schedule</h3>
              <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>EMI {fmtINR(data.loanEmi)} /mo</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>EMI</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.loan.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{l.date}</td>
                      <td style={{ fontWeight: 700 }}>{fmtINR(l.emi)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{fmtINR(l.principal)}</td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>{fmtINR(l.interest)}</td>
                      <td>
                        <span className="badge" style={{
                          background: l.status === 'Paid' ? '#dcfce7' : l.status === 'Upcoming' ? '#fef3c7' : '#f1f5f9',
                          color: l.status === 'Paid' ? '#16a34a' : l.status === 'Upcoming' ? '#92400e' : '#475569', fontWeight: 700
                        }}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '0.8rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <InfoCard icon={faHandshake} title="Outstanding" value={fmtINR(0)} sub="No Active Loan" />
              <InfoCard icon={faCalendar} title="Tenor" value="0 Months" sub="0 EMIs" />
              <InfoCard icon={faPercent} title="Rate & Status" value="0.00% p.a." sub="N/A" />
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3 className="mb-1">💸 Cashflow Trend</h3>
              <div style={{ width: '100%', height: '220px' }}>
                <BarChart data={data.cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                  <Bar dataKey="in" name="Income ₹" fill="#25D366" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="out" name="Expense ₹" fill="#D12020" radius={[6, 6, 0, 0]} />
                </BarChart>
              </div>
            </div>
            <div className="card">
              <h3 className="mb-1">💼 Wealth Allocation</h3>
              <div style={{ width: '100%', height: '220px' }}>
                <PieChart>
                  <Pie data={data.wealthAlloc} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name} ₹${(e.value / 100000).toFixed(1)}L`}>
                    {data.wealthAlloc.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtINR(v)} />
                </PieChart>
              </div>
            </div>
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="flex-between mb-1">
                <h3>📒 Recent A/c Transactions</h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-sm btn-outline"><FontAwesomeIcon icon={faFilePdf} /> PDF</button>
                  <button className="btn btn-sm btn-outline"><FontAwesomeIcon icon={faFileExcel} /> Tax</button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Particulars</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{t.date}</td>
                        <td>{t.desc}</td>
                        <td>
                          <span className="badge" style={{
                            background: t.category === 'Income' ? '#dcfce7' : t.category === 'Investment' ? '#dbeafe' : t.category === 'Insurance' ? '#f3e8ff' : t.category === 'Utility' ? '#fef3c7' : '#fee2e2',
                            color: t.category === 'Income' ? '#16a34a' : t.category === 'Investment' ? '#1d4ed8' : t.category === 'Insurance' ? '#7c3aed' : t.category === 'Utility' ? '#92400e' : '#dc2626',
                            fontWeight: 700
                          }}>{t.category}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: t.type === 'CR' ? '#16a34a' : '#dc2626' }}>
                          {t.type === 'CR' ? '+' : '−'}{fmtINR(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

const RoleHeader = ({ title, subtitle, icon, activeRoleView, onSwitchRoleView }) => {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {}
    logout()
    navigate('/portal/login')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0B1C3B 0%, #14305C 100%)',
      borderRadius: '14px',
      padding: '1rem 1.15rem',
      marginBottom: '1.25rem',
      color: '#ffffff',
      boxShadow: '0 6px 18px rgba(11, 28, 59, 0.14)',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.8rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0
        }}>
          <FontAwesomeIcon icon={icon || faGaugeHigh} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h1 className="role-header-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
              {title}
            </h1>
            <span className={`badge ${roleBadgeClass(user?.role)}`} style={{ textTransform: 'none', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
              {roleLabel(user?.role)}
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <p className="role-header-subtitle" style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.82)' }}>
            {subtitle || `Logged in as ${user?.name || 'User'} (${user?.email || ''})`}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 600 }}>Switch Role View:</span>
            <select
              value={activeRoleView || 'admin'}
              onChange={(e) => {
                const v = e.target.value
                onSwitchRoleView && onSwitchRoleView(v)
              }}
              style={{
                background: '#0B1C3B', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600
              }}
            >
              <option value="admin">Admin Dashboard</option>
              <option value="branch_manager">Branch Manager View</option>
              <option value="rm">RM View</option>
              <option value="arm">ARM View</option>
              <option value="advisor">Advisor View</option>
              <option value="sub_broker">Sub Broker View</option>
              <option value="employee">Employee View</option>
              <option value="client">Client View</option>
            </select>
          </div>
        )}

        {isAdmin && (
          <Link to="/app/platform" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.8rem', padding: '0.55rem 0.9rem', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <FontAwesomeIcon icon={faShieldHalved} /> Platform Controls
          </Link>
        )}

        {isAdmin && (
          <Link to="/app/users" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.8rem', padding: '0.55rem 0.9rem', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <FontAwesomeIcon icon={faUsers} /> Manage All Users
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-sm"
          style={{
            background: 'linear-gradient(135deg, #D12020, #e74c3c)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(209, 32, 32, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} /> Log Out
        </button>
      </div>
    </div>
  )
}

export default function DashboardRole() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'client'
  const [activeRoleView, setActiveRoleView] = useState(role)
  const [dashConf, setDashConf] = useState([])

  useEffect(() => {
    setActiveRoleView(role)
  }, [role])

  useEffect(() => {
    ;(async () => {
      const isLocalAuth = useAuthStore.getState().isLocalUser()
      if (isLocalAuth) {
        try {
          const raw = localStorage.getItem('ge_local_platform')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && Array.isArray(parsed.dashboards)) {
              setDashConf(parsed.dashboards)
              return
            }
          }
        } catch {}
      }
      try {
        const { data } = await api.get('/platform/dashboards')
        setDashConf(data.dashboards || [])
      } catch (e) {
        setDashConf([])
      }
    })()
  }, [])

  const viewRole = user?.role === 'admin' ? activeRoleView : role
  const effectiveRole = viewRole
  const canBypass = role === 'admin'

  const isDashboardActive = (r) => {
    if (!r || canBypass) return true
    const conf = dashConf.find((d) => d.role === r || d.id === r)
    if (!conf) return true
    return !!conf.isActive
  }

  const renderRoleDashboard = () => {
    if (!isDashboardActive(effectiveRole) && !canBypass) {
      return <DashboardDisabled role={effectiveRole} roleTitle={roleTitles[effectiveRole] || effectiveRole} />
    }
    if (!isDashboardActive(effectiveRole) && canBypass && user?.role !== 'admin' && role !== effectiveRole) {
      return <DashboardDisabled role={effectiveRole} roleTitle={roleTitles[effectiveRole] || effectiveRole} preview />
    }
    switch (effectiveRole) {
      case 'admin':
        return <AdminDashboard />
      case 'branch_manager':
        return <BranchManagerDashboard />
      case 'rm':
        return <RMDashboard />
      case 'arm':
        return <ARMDashboard />
      case 'advisor':
        return <AdvisorDashboard />
      case 'sub_broker':
        return <SubBrokerDashboard />
      case 'employee':
        return <EmployeeDashboard />
      case 'client':
      default:
        return <ClientDashboard />
    }
  }

  const roleTitles = {
    admin: 'Admin Management & Operations Portal',
    branch_manager: 'Branch Manager Operations & Performance Portal',
    rm: 'Relationship Manager Portfolio & Client Portal',
    arm: 'Assistant RM Operations & Workflow Portal',
    advisor: 'Wealth Advisor Advisory & Planning Portal',
    sub_broker: 'Sub Broker Channel & Client Acquisition Portal',
    employee: 'Employee Operations & Daily Workflow Dashboard',
    client: 'Investor Wealth & Portfolio Dashboard'
  }

  return (
    <div>
      <RoleHeader
        title={roleTitles[effectiveRole] || 'Role Dashboard'}
        subtitle={`Logged in as ${user?.name || 'User'} (${user?.email || ''})`}
        icon={faGaugeHigh}
        activeRoleView={activeRoleView}
        onSwitchRoleView={setActiveRoleView}
      />
      {renderRoleDashboard()}
      <div className="notice-bottom-wrap">
        <NoticeBoard audience={user?.role || 'client'} compact={true} />
      </div>
    </div>
  )
}

function DashboardDisabled({ role, roleTitle, preview = false }) {
  const roleDisplay = (roleTitle || role || 'this portal')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/_/g, ' ')
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem'
    }}>
      <div style={{
        maxWidth: 560,
        width: '100%',
        background: 'white',
        borderRadius: 18,
        padding: '2.4rem 2.2rem',
        boxShadow: '0 10px 40px rgba(11, 28, 59, 0.12)',
        border: '1px solid #e8eef7',
        textAlign: 'center'
      }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 1.2rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(13, 52, 106, 0.12), rgba(201, 162, 39, 0.18))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FontAwesomeIcon icon={faLock} style={{ fontSize: '1.6rem', color: '#14305C' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0B1C3B', margin: 0, fontWeight: 800, letterSpacing: '0.2px' }}>
          {preview ? 'Role Preview Unavailable' : 'Dashboard Temporarily Unavailable'}
        </h2>
        <p style={{
          color: '#64748b',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          margin: '0.75rem 0 0'
        }}>
          {preview
            ? `The <strong>${roleDisplay}</strong> dashboard is currently disabled by platform admin and cannot be previewed.`
            : `The <strong>${roleDisplay}</strong> portal is currently disabled by platform admin. Please check back later or contact your system administrator.`
          }
        </p>
        <div style={{
          marginTop: '1.5rem',
          padding: '0.85rem 1rem',
          borderRadius: 10,
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          color: '#64748b',
          fontSize: '0.82rem',
          fontWeight: 500
        }}>
          If you believe this is a mistake, contact the Admin team to re-enable access for the{' '}
          <span style={{ fontWeight: 700, color: '#0B1C3B' }}>{roleDisplay}</span> portal.
        </div>
      </div>
    </div>
  )
}

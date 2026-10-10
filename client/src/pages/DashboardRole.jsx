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
  faLock,
  faTrashCan,
  faTriangleExclamation,
  faXmark
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
import { useAuthStore, getLocalUsersList, deleteLocalUser } from '../store/auth'
import { fmtINR, fmtPct, fmtNum, initials, roleBadgeClass, roleLabel, downloadExcel, printHTML } from '../utils/format'
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

const SupportTickets = ({ tickets = [], onRaiseTicket }) => (
  <div style={{
    background: '#fff', borderRadius: '14px', padding: '1.1rem',
    boxShadow: '0 2px 12px rgba(11,28,59,0.06)', borderLeft: '4px solid #8e44ad', height: '100%'
  }}>
    <div className="flex-between mb-2">
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0B1C3B' }}>
        <FontAwesomeIcon icon={faLifeRing} style={{ marginRight: 6, color: '#8e44ad' }} />
        Support Tickets & Service Requests
      </h4>
      <button
        type="button"
        onClick={onRaiseTicket}
        className="btn-primary btn-sm"
        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
      >
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
          {(!tickets || tickets.length === 0) ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem', fontStyle: 'italic', fontSize: '0.82rem' }}>
                No active support tickets found. Click "Raise Ticket" above to submit a service request.
              </td>
            </tr>
          ) : (
            tickets.map((t) => (
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
            ))
          )}
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

  const [delUserConfirm, setDelUserConfirm] = useState(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [delUserError, setDelUserError] = useState('')

  const handleDeleteClient = async () => {
    if (!delUserConfirm) return
    setDeletingUser(true)
    setDelUserError('')
    try {
      await api.delete(`/users/${delUserConfirm.id}`)
    } catch (_) {}
    deleteLocalUser(delUserConfirm.id)
    deleteLocalUser(delUserConfirm.email)
    setData(prev => ({
      ...prev,
      users: Array.isArray(prev.users) ? prev.users.filter(u => (u.id || u._id) !== delUserConfirm.id && u.email?.toLowerCase() !== delUserConfirm.email?.toLowerCase()) : [],
      clientsCount: Math.max(0, (prev.clientsCount || 0) - (delUserConfirm.role === 'client' ? 1 : 0))
    }))
    setDelUserConfirm(null)
    setDeletingUser(false)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get('/users').catch(() => null),
          api.get('/portfolio/admin-overview').catch(() => null)
        ])
        const rawUsers = uRes?.data?.users || (Array.isArray(uRes?.data) ? uRes.data : [])
        const safeUsers = Array.isArray(rawUsers) ? rawUsers : []
        const localList = getLocalUsersList()
        const combined = [...safeUsers]
        for (const lu of localList) {
          if (!combined.some(u => u.email?.toLowerCase() === lu.email?.toLowerCase() || (u.id && u.id === lu.id))) {
            combined.push(lu)
          }
        }
        const safeOverview = (pRes?.data && typeof pRes.data === 'object' && !Array.isArray(pRes.data)) ? pRes.data : {}

        const calculatedClients = combined.filter(u => u.role === 'client').length
        const calculatedStaff = combined.filter(u => u.role && u.role !== 'client').length

        setData(d => ({
          ...d,
          ...safeOverview,
          clientsCount: Math.max(safeOverview.clientsCount || 0, calculatedClients),
          staffCount: Math.max(safeOverview.staffCount || 0, calculatedStaff),
          users: combined,
          portfolioDist: Array.isArray(safeOverview.portfolioDist) ? safeOverview.portfolioDist : (d.portfolioDist || []),
          monthlyRevenue: Array.isArray(safeOverview.monthlyRevenue) ? safeOverview.monthlyRevenue : (d.monthlyRevenue || []),
          roleWisePerformance: Array.isArray(safeOverview.roleWisePerformance) ? safeOverview.roleWisePerformance : (d.roleWisePerformance || [])
        }))
      } catch (e) {
        console.warn('Admin dashboard load error:', e)
      }
    }
    load()
  }, [])

  return (
    <>
      <div className="dash-grid-stats">
        <StatCard icon={faUsers} label="Total Clients" value={fmtNum(data.clientsCount)} sub="Registered clients" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" />
        <StatCard icon={faUserTie} label="Staff Members" value={fmtNum(data.staffCount)} sub="Active staff hierarchy" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" />
        <StatCard icon={faSackDollar} label="Aggregate AUM" value={fmtINR(data.aum)} sub="Portfolio wealth" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" />
        <StatCard icon={faChartLine} label="Net Returns" value={fmtPct(data.netReturns)} sub="Weighted avg" iconBg="linear-gradient(135deg,#16a085,#0e6251)" />
        <StatCard icon={faHandHoldingDollar} label="Commission Paid" value={fmtINR(data.commissionGenerated)} sub="MTD payouts" iconBg="linear-gradient(135deg,#D12020,#922b21)" />
        <StatCard icon={faArrowTrendUp} label="Conversions" value={data.conversions} sub="Active bookings" accentColor="#25D366" iconBg="linear-gradient(135deg,#25D366,#128c4a)" />
      </div>

      <div className="dash-grid-cols-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Monthly Revenue & Commission Trend</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Last 6 Months</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 100000).toFixed(1) + 'L'} />
                <Tooltip formatter={(v) => fmtINR(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#0B1C3B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="commission" name="Commission" fill="#D12020" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Portfolio Distribution — Top Clients (AUM)</h3>
          </div>
          <div style={{ width: '100%', height: 280 }}>
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
      </div>

      <div className="card mb-2">
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(data?.users) ? data.users : []).slice(0, 8).map((u) => (
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
                  <td>
                    {u.role === 'client' ? (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => { setDelUserError(''); setDelUserConfirm(u) }}
                        style={{
                          border: 'none',
                          padding: '0.28rem 0.6rem',
                          fontSize: '0.72rem',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: '#dc2626',
                          color: '#fff',
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
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Core Staff</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!Array.isArray(data?.users) || data.users.length === 0) && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No users loaded. Click "Manage Users" to view or create accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {delUserConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !deletingUser) setDelUserConfirm(null) }}>
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-head" style={{ borderBottom: '1px solid #fee2e2' }}>
              <h3 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <FontAwesomeIcon icon={faTriangleExclamation} /> Delete Client Account
              </h3>
              <button type="button" className="modal-close" onClick={() => !deletingUser && setDelUserConfirm(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              {delUserError && <div className="form-error" style={{ marginBottom: 12 }}>{delUserError}</div>}
              <p style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5 }}>
                Are you sure you want to delete client <strong>{delUserConfirm.name}</strong> ({delUserConfirm.email})?
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8 }}>
                ⚠️ This will permanently remove the client profile and purge all associated records.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setDelUserConfirm(null)} disabled={deletingUser}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deletingUser}
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
                {deletingUser ? 'Deleting…' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

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

  useEffect(() => {
    const load = async () => {
      try {
        const uRes = await api.get('/users').catch(() => null)
        const rawUsers = uRes?.data?.users || (Array.isArray(uRes?.data) ? uRes.data : [])
        const serverUsers = Array.isArray(rawUsers) ? rawUsers : []
        const localList = getLocalUsersList()
        const combined = [...serverUsers]
        for (const lu of localList) {
          if (!combined.some(u => u.email?.toLowerCase() === lu.email?.toLowerCase() || (u.id && u.id === lu.id))) {
            combined.push(lu)
          }
        }
        const clientUsers = combined.filter(u => u.role === 'client' || (!u.role && u.email && !u.email.endsWith('@genius.com')))
        const staffUsers = combined.filter(u => u.role && u.role !== 'client')

        setData(prev => ({
          ...prev,
          totalStaff: staffUsers.length || 7,
          clientsThisMonth: clientUsers.length,
          newAccounts: clientUsers.length,
          staffList: staffUsers.map(s => ({
            name: s.name,
            role: roleLabel(s.role),
            target: '100%',
            achieved: s.status === 'active' ? 'Active' : 'Pending',
            status: s.status || 'active'
          }))
        }))
      } catch (e) {}
    }
    load()
  }, [])

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

      <div className="dash-grid-stats">
        <StatCard icon={faHouseUser} label="Total Staff" value={data.totalStaff} sub="Active branch team" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faUsers} label="New Clients MTD" value={data.clientsThisMonth} sub="Walk-in & referral" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faMoneyBillTrendUp} label="Revenue MTD" value={fmtINR(data.revenueMTD)} sub="Branch total" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faChartLine} label="Mutual Funds" value={data.sipsStarted} sub="Active SIPs Book" iconBg="linear-gradient(135deg,#25D366,#128c4a)" accentColor="#25D366" />
        <StatCard icon={faArrowTrendUp} label="Stock Accounts" value={data.newAccounts} sub="Demat Client Book" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faStar} label="Customer Rating" value={`${data.customerRating} ★`} sub="Branch score" accentColor="#F39C12" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" />
      </div>

      <div className="dash-grid-cols-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Branch Monthly Revenue Target</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Target Tracking</span>
          </div>
          <BigProgress
            label="Revenue Target Progress"
            value={data.revenueMTD}
            max={data.revenueTarget}
            color="#D12020"
            sub="Branch target performance"
          />
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Branch Performance — 5 Month Trend</h3>
            <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
              Growing 📈
            </span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtINR(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => v} />
                <Legend />
                <Bar yAxisId="right" dataKey="accounts" name="Mutual Funds" fill="#2980b9" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="policies" name="Stock Portfolios" fill="#25D366" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dash-grid-cols-2">
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

  return (
    <>
      <div className="dash-grid-stats mb-2">
        <StatCard icon={faBolt} label="Today's Tasks" value={data.todaysTasks} sub="Assigned tasks" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faFilePdf} label="Pending KYC" value={data.pendingKyc} sub="Verification queue" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" accentColor="#F39C12" />
        <StatCard icon={faCalendarPlus} label="Meeting Schedule" value={data.meetings} sub="RM syncs today" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faPhone} label="Client Follow-up" value={data.followUps} sub="Callbacks" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faInbox} label="Pending Policies" value={data.policiesPending} sub="In-process" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faUserTie} label="Reporting RM" value={user?.reportsToName || 'Priya Sharma'} sub="Supervisor" accentColor="#2980b9" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" />
      </div>

      <div className="card mb-2">
        <div className="flex-between mb-1">
          <h3>Weekly Activity — Calls & Meetings</h3>
          <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Last 6 Days</span>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B1C3B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0B1C3B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="calls" name="Outbound Calls" stroke="#0B1C3B" strokeWidth={2.5} fill="url(#callsGrad)" />
              <Line type="monotone" dataKey="meetings" name="Meetings" stroke="#F39C12" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-grid-cols-2 mb-2">
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


  useEffect(() => {
    const load = async () => {
      try {
        const uRes = await api.get('/users?role=client').catch(() => null)
        const rawUsers = uRes?.data?.users || (Array.isArray(uRes?.data) ? uRes.data : [])
        const serverUsers = Array.isArray(rawUsers) ? rawUsers : []
        const localList = getLocalUsersList()
        const combined = [...serverUsers]
        for (const lu of localList) {
          if (lu.role === 'client' || (!lu.role && lu.email && !lu.email.endsWith('@genius.com'))) {
            if (!combined.some(u => u.email?.toLowerCase() === lu.email?.toLowerCase() || (u.id && u.id === lu.id))) {
              combined.push(lu)
            }
          }
        }
        setData(prev => ({
          ...prev,
          assignedClients: combined.length,
          premiumClients: Math.ceil(combined.length * 0.4),
          topClients: combined.slice(0, 5).map(c => ({
            name: c.name,
            aum: c.invested || 2500000,
            tier: 'HNI Client',
            growth: '+12.4%'
          }))
        }))
      } catch (e) {}
    }
    load()
  }, [])

  return (
    <>
      <div className="dash-grid-stats mb-2">
        <StatCard icon={faUsers} label="Assigned Clients" value={data.assignedClients} sub="Total Book Size" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faStar} label="Premium Clients" value={data.premiumClients} sub="HNI Clients" iconBg="linear-gradient(135deg,#F39C12,#b9770e)" accentColor="#F39C12" />
        <StatCard icon={faPiggyBank} label="Total AUM Book" value={fmtINR(data.aumBook)} sub="All client assets" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faBriefcase} label="Product Sales" value={data.salesCount} sub="Mutual Funds & Stocks" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faHandHoldingDollar} label="Revenue MTD" value={fmtINR(data.revenue)} sub="Commission generated" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faMoneyBillTrendUp} label="Commission" value={fmtINR(data.commission)} sub={`FY: ${fmtINR(data.commissionYear)}`} iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
      </div>

      <div className="dash-grid-cols-2 mb-2">
        <BigProgress
          label="My Commission Earnings MTD"
          value={data.commission}
          max={90000}
          color="#8e44ad"
          sub={`Incentive slab 2% of AUM growth`}
        />
        <BigProgress
          label="Revenue Target — August 2026"
          value={data.revenue}
          max={data.target}
          color="#D12020"
          sub={`${fmtINR(data.target - data.revenue)} remaining to 100% target`}
        />
      </div>

      <div className="dash-grid-cols-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Product Sales Mix</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>₹4.5L Commission</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.salesBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
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
      </div>

      <div className="dash-grid-cols-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Client Investment Book</h3>
            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>Active</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Investment Type</th>
                  <th>Amount</th>
                  <th>Status</th>
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
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Portfolio Review & Follow-up</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>Active</span>
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
                      <span className={`badge badge-${c.followUp?.includes('Done') || c.followUp?.includes('Disbursed') ? 'active' : 'inactive'}`}
                        style={
                          c.followUp?.includes('Scheduled') ? { background: '#dbeafe', color: '#1d4ed8' } :
                          c.followUp?.includes('Pending') || c.followUp?.includes('On-boarded') ? { background: '#fef3c7', color: '#92400e' } : {}
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


  return (
    <>
      <div className="dash-grid-stats mb-2">
        <StatCard icon={faUsers} label="Total Clients" value={data.totalClients} sub="Active portfolio" iconBg="linear-gradient(135deg,#16a085,#0e6251)" accentColor="#16a085" />
        <StatCard icon={faCalendarPlus} label="Today's Meetings" value={data.todaysMeetings} sub="Client visits & calls" iconBg="linear-gradient(135deg,#2980b9,#1e3a72)" accentColor="#2980b9" />
        <StatCard icon={faArrowTrendUp} label="Stock Trades" value={data.policySold} sub="Current Month" iconBg="linear-gradient(135deg,#D12020,#922b21)" accentColor="#D12020" />
        <StatCard icon={faChartLine} label="Mutual Fund SIPs" value={fmtINR(data.mfSip)} sub="Monthly Inflow" iconBg="linear-gradient(135deg,#8e44ad,#6c3483)" accentColor="#8e44ad" />
        <StatCard icon={faHandHoldingDollar} label="Commission" value={fmtINR(data.commission)} sub="Month-to-date" iconBg="linear-gradient(135deg,#25D366,#128c4a)" accentColor="#25D366" />
        <StatCard icon={faBullseye} label="Target Progress" value={`${data.targetProgress}%`} sub="Monthly Sales Quota" iconBg="linear-gradient(135deg,#0B1C3B,#14305C)" accentColor="#0B1C3B" />
      </div>

      <div className="dash-grid-cols-2 mb-2">
        <BigProgress
          label="Sales Target — Equity & SIP Combined"
          value={data.policySold}
          max={data.targetSales}
          color="#D12020"
          sub={`${data.targetSales - data.policySold} more orders to achieve monthly target`}
        />
        <BigProgress
          label="Commission Earnings Goal"
          value={data.commission}
          max={data.targetCommission}
          color="#16a085"
          sub={`Next payout scheduled 15th August`}
        />
      </div>

      <div className="dash-grid-cols-2 mb-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Weekly Funnel — Leads & Closings</h3>
            <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>August</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
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

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Product Sales Mix</h3>
            <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>Commission</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
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

      <div className="dash-grid-cols-2 mb-2">
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

        <div className="card">
          <div className="flex-between mb-1">
            <h3>Lead Sources</h3>
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
        { icon: faUserPlus, label: 'New Client', color: '#25D366', action: 'new-account' },
        { icon: faChartLine, label: 'Stocks / Equity', color: '#1d4ed8', action: 'stocks' },
        { icon: faSackDollar, label: 'Mutual Funds', color: '#ca8a04', action: 'mutual-fund' },
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

        <div className="dash-grid-stats mt-1">
          <StatCard icon={faUsers} label="Today's Customers" value={fmtNum(data.todayCustomers)} sub="Branch Footfall" color="#0B1C3B" />
          <StatCard icon={faCreditCard} label="Client Onboarding" value={fmtNum(data.accountOpenings)} sub="Demat & MF KYC" color="#25D366" />
          <StatCard icon={faClock} label="Pending Verifications" value={fmtNum(data.pendingVerifications)} sub="KYC Queue" color="#F39C12" />
          <StatCard icon={faArrowTrendUp} label="Stock Orders" value={fmtNum(data.loanRequests)} sub="Equity Trades" color="#1d4ed8" />
          <StatCard icon={faChartLine} label="Mutual Fund Requests" value={fmtNum(data.mfRequests)} sub="SIP & Lumpsum" color="#ca8a04" />
        </div>

        <div className="card mt-1">
          <h3 className="mb-1">⚡ Quick Actions — Counter Work</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
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

        <div className="dash-grid-cols-2 mt-1">
          <div className="card">
            <h3 className="mb-1">🗓️ Weekly Attendance</h3>
            <AttendanceWeek record={data.attendance} />
          </div>
          <div>
            <SalarySlip data={data.salary} />
          </div>
        </div>

        <div className="dash-grid-cols-2 mt-1">
          <div className="card">
            <h3 className="mb-1">📊 Branch Footfall — This Week</h3>
            <div style={{ width: '100%', height: '240px' }}>
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
            <div style={{ marginTop: '0.85rem' }}>
              <BigProgress label="Account Opening Target" value={0} max={0} color="#0B1C3B" sub="0 A/C / 0 A/C" />
            </div>
            <div style={{ marginTop: '0.85rem' }}>
              <BigProgress label="Cross-Sell (Insurance)" value={0} max={0} color="#9333ea" sub="0 Policies / 0 Target" />
            </div>
          </div>
        </div>

        <div className="dash-grid-cols-2 mt-1">
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
                    <th>Age</th>
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

  const [portfolioData, setPortfolioData] = useState(null)

  // Support Tickets State
  const [tickets, setTickets] = useState(() => {
    try {
      const key = `ge_client_tickets_${user?.id || user?.email || 'default'}`
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : []
    } catch (_) {
      return []
    }
  })
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('Mutual Funds & SIP')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketNotice, setTicketNotice] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchPortfolio = async () => {
      try {
        const res = await api.get('/portfolio/me')
        if (isMounted && res.data && res.data.portfolio) {
          setPortfolioData(res.data.portfolio)
        }
      } catch (err) {
        // use clean fallback
      }
    }
    fetchPortfolio()
    return () => { isMounted = false }
  }, [])

  // Partition portfolio holdings into Mutual Funds and Stocks:
  const rawHoldings = portfolioData?.holdings || []
  
  const mutualFunds = rawHoldings.filter(h => 
    h.type === 'MF' || 
    h.category === 'Mutual Fund' || 
    (h.name && (h.name.toLowerCase().includes('fund') || h.name.toLowerCase().includes('index') || h.name.toLowerCase().includes('sip')))
  )

  const stocks = rawHoldings.filter(h => !mutualFunds.includes(h))

  const totalValue = portfolioData?.totalValue || (rawHoldings.reduce((sum, h) => sum + (Number(h.totalValue) || Number(h.currentPrice * h.units) || 0), 0))
  const totalInvested = portfolioData?.totalInvested || (rawHoldings.reduce((sum, h) => sum + (Number(h.invested) || Number(h.avgPrice * h.units) || 0), 0))
  const netReturns = totalInvested > 0 ? totalValue - totalInvested : 0
  const returnsPct = portfolioData?.returnsPct || (totalInvested > 0 ? +((netReturns / totalInvested) * 100).toFixed(2) : 0)

  const mfValue = mutualFunds.reduce((sum, h) => sum + (Number(h.totalValue) || Number(h.currentPrice * h.units) || 0), 0)
  const mfInvested = mutualFunds.reduce((sum, h) => sum + (Number(h.invested) || Number(h.avgPrice * h.units) || 0), 0)

  const stockValue = stocks.reduce((sum, h) => sum + (Number(h.totalValue) || Number(h.currentPrice * h.units) || 0), 0)
  const stockInvested = stocks.reduce((sum, h) => sum + (Number(h.invested) || Number(h.avgPrice * h.units) || 0), 0)

  const recentTxns = portfolioData?.transactions || []

  const handleCreateTicket = (e) => {
    e.preventDefault()
    if (!ticketSubject.trim()) return
    const newTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: ticketSubject.trim(),
      category: ticketCategory,
      status: 'Open',
      updated: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    const next = [newTicket, ...tickets]
    setTickets(next)
    try {
      const key = `ge_client_tickets_${user?.id || user?.email || 'default'}`
      localStorage.setItem(key, JSON.stringify(next))
    } catch (_) {}
    setTicketSubject('')
    setTicketMessage('')
    setShowTicketModal(false)
    setTicketNotice(`✓ Support Ticket #${newTicket.id} raised successfully! Our team will attend shortly.`)
    setTimeout(() => setTicketNotice(''), 6000)
  }

  const handleDownloadStatementPDF = () => {
    const clientName = profile.name || user?.name || 'Valued Client'
    const clientId = profile.customerId || 'CUST-00001'
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    let txRowsHTML = ''
    if (recentTxns && recentTxns.length > 0) {
      txRowsHTML = recentTxns.map(t => `
        <tr>
          <td>${t.date || '—'}</td>
          <td>${t.desc || t.particulars || t.scheme || 'Order'}</td>
          <td>${t.type || 'ORDER'}</td>
          <td style="font-weight: 700;">${fmtINR(t.amount || 0)}</td>
        </tr>
      `).join('')
    } else {
      txRowsHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #64748b; padding: 16px; font-style: italic;">
            No recent mutual fund or stock transactions recorded for this statement period.
          </td>
        </tr>
      `
    }

    let mfRowsHTML = ''
    if (mutualFunds && mutualFunds.length > 0) {
      mfRowsHTML = mutualFunds.map(f => {
        const val = Number(f.totalValue) || Number(f.currentPrice * f.units) || 0
        return `<tr>
          <td>${f.name || f.scheme || 'Scheme'}</td>
          <td>${Number(f.units || 0).toFixed(2)}</td>
          <td>₹${Number(f.currentPrice || f.nav || 0).toFixed(2)}</td>
          <td>${fmtINR(val)}</td>
        </tr>`
      }).join('')
    } else {
      mfRowsHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">No mutual fund holdings recorded.</td></tr>`
    }

    let stockRowsHTML = ''
    if (stocks && stocks.length > 0) {
      stockRowsHTML = stocks.map(s => {
        const val = Number(s.totalValue) || Number(s.currentPrice * s.units) || 0
        return `<tr>
          <td>${s.name || s.symbol || 'Stock'}</td>
          <td>${s.units || s.qty || 0}</td>
          <td>₹${Number(s.currentPrice || 0).toFixed(2)}</td>
          <td>${fmtINR(val)}</td>
        </tr>`
      }).join('')
    } else {
      stockRowsHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">No stock holdings recorded.</td></tr>`
    }

    const htmlContent = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <table style="width: 100%; border: none; margin: 0;">
          <tr style="background: none;"><td style="border: none; padding: 3px 0;"><strong>Client Name:</strong> ${clientName}</td><td style="border: none; padding: 3px 0;"><strong>Account ID:</strong> ${clientId}</td></tr>
          <tr style="background: none;"><td style="border: none; padding: 3px 0;"><strong>PAN:</strong> ${profile.pan || '—'}</td><td style="border: none; padding: 3px 0;"><strong>Email:</strong> ${profile.email || '—'}</td></tr>
          <tr style="background: none;"><td style="border: none; padding: 3px 0;"><strong>Statement Date:</strong> ${dateStr}</td><td style="border: none; padding: 3px 0;"><strong>Total Valuation:</strong> ${fmtINR(totalValue)}</td></tr>
        </table>
      </div>

      <h2>Portfolio Valuation Summary</h2>
      <table>
        <thead>
          <tr><th>Asset Class</th><th>Invested Capital</th><th>Current Market Value</th><th>Unrealized P&amp;L</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Mutual Funds</td>
            <td>${fmtINR(mfInvested)}</td>
            <td>${fmtINR(mfValue)}</td>
            <td class="${mfValue >= mfInvested ? 'success' : 'danger'}">${mfValue >= mfInvested ? '+' : ''}${fmtINR(mfValue - mfInvested)}</td>
          </tr>
          <tr>
            <td>Stocks &amp; Equity</td>
            <td>${fmtINR(stockInvested)}</td>
            <td>${fmtINR(stockValue)}</td>
            <td class="${stockValue >= stockInvested ? 'success' : 'danger'}">${stockValue >= stockInvested ? '+' : ''}${fmtINR(stockValue - stockInvested)}</td>
          </tr>
          <tr class="summary-row">
            <td>Total Portfolio</td>
            <td>${fmtINR(totalInvested)}</td>
            <td>${fmtINR(totalValue)}</td>
            <td class="${netReturns >= 0 ? 'success' : 'danger'}">${netReturns >= 0 ? '+' : ''}${fmtINR(netReturns)}</td>
          </tr>
        </tbody>
      </table>

      <h2>Mutual Fund Schemes</h2>
      <table>
        <thead><tr><th>Scheme Name</th><th>Units</th><th>NAV (₹)</th><th>Current Value</th></tr></thead>
        <tbody>${mfRowsHTML}</tbody>
      </table>

      <h2>Stock &amp; Equity Holdings</h2>
      <table>
        <thead><tr><th>Company / Symbol</th><th>Quantity</th><th>CMP (₹)</th><th>Current Value</th></tr></thead>
        <tbody>${stockRowsHTML}</tbody>
      </table>

      <h2>Recent Transactions &amp; Orders</h2>
      <table>
        <thead><tr><th>Date</th><th>Order Particulars</th><th>Type</th><th>Amount</th></tr></thead>
        <tbody>${txRowsHTML}</tbody>
      </table>
    `

    printHTML(`Client Statement — ${clientName} (${clientId})`, htmlContent)
  }

  const handleExportExcel = () => {
    const clientId = profile.customerId || 'Client'
    const headers = ['Date', 'Order Particulars', 'Type', 'Amount (INR)']
    let rows = []
    if (recentTxns && recentTxns.length > 0) {
      rows = recentTxns.map(t => [
        t.date || '—',
        t.desc || t.particulars || t.scheme || 'Order',
        t.type || 'ORDER',
        Number(t.amount || 0)
      ])
    } else {
      // Show blank / clean placeholder row when no data
      rows = [
        ['—', 'No mutual fund or stock transactions recorded', '—', 0]
      ]
    }
    downloadExcel(headers, rows, `Orders_Statement_${clientId}.xls`)
  }

  return (
    <div>
      <div className="dash-grid-cols-2">
        <ProfileCard client={{ ...profile, accounts: 'Demat & Mutual Funds', since: 'Active Account' }} />
        <div className="dash-grid-stats">
          <StatCard icon={faWallet} label="Total Portfolio" value={fmtINR(totalValue)} sub={`Invested: ${fmtINR(totalInvested)}`} color="#0B1C3B" />
          <StatCard icon={faChartLine} label="Mutual Funds" value={fmtINR(mfValue)} sub={`${mutualFunds.length} Active Schemes`} color="#F39C12" />
          <StatCard icon={faArrowTrendUp} label="Stock Holdings" value={fmtINR(stockValue)} sub={`${stocks.length} Companies`} color="#25D366" />
          <StatCard icon={faCoins} label="Unrealized Returns" value={`${netReturns >= 0 ? '+' : ''}${fmtINR(netReturns)}`} sub={`${returnsPct >= 0 ? '+' : ''}${returnsPct}% Net Gain`} color={netReturns >= 0 ? '#16a34a' : '#dc2626'} />
        </div>
      </div>

      <div className="dash-grid-cols-2 mt-1">
        {/* Mutual Funds Holdings Card */}
        <div className="card">
          <div className="flex-between mb-1">
            <h3>📈 Mutual Fund Holdings</h3>
            <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
              {mutualFunds.length} {mutualFunds.length === 1 ? 'Scheme' : 'Schemes'}
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th>Units</th>
                  <th>NAV</th>
                  <th>Value</th>
                  <th>Returns</th>
                </tr>
              </thead>
              <tbody>
                {mutualFunds.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem 0.5rem', fontStyle: 'italic' }}>
                      No active Mutual Fund schemes in your portfolio.
                    </td>
                  </tr>
                ) : (
                  mutualFunds.map((f, i) => {
                    const val = Number(f.totalValue) || Number(f.currentPrice * f.units) || 0
                    const inv = Number(f.invested) || Number(f.avgPrice * f.units) || val
                    const retPct = inv > 0 ? +(((val - inv) / inv) * 100).toFixed(2) : 0
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{f.name || f.scheme || f.symbol}</td>
                        <td style={{ fontFamily: 'monospace' }}>{Number(f.units || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(f.currentPrice || f.nav || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>{fmtINR(val)}</td>
                        <td>
                          <span className="badge" style={{
                            background: retPct >= 0 ? '#dcfce7' : '#fee2e2',
                            color: retPct >= 0 ? '#16a34a' : '#dc2626',
                            fontWeight: 700
                          }}>
                            {retPct >= 0 ? `+${retPct}%` : `${retPct}%`}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'linear-gradient(90deg, #ecfdf5, #dcfce7)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total MF Investment</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0B1C3B' }}>{fmtINR(mfInvested)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>Unrealized Gain/Loss</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: mfValue >= mfInvested ? '#16a34a' : '#dc2626' }}>
                {mfValue >= mfInvested ? '+' : ''}{fmtINR(mfValue - mfInvested)}
              </div>
            </div>
          </div>
        </div>

        {/* Stock & Equity Portfolio Card */}
        <div className="card">
          <div className="flex-between mb-1">
            <h3>📊 Stock & Equity Portfolio</h3>
            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>
              {stocks.length} {stocks.length === 1 ? 'Stock' : 'Stocks'}
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stock / Company</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>CMP</th>
                  <th>Current Value</th>
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem 0.5rem', fontStyle: 'italic' }}>
                      No active equity/stock holdings in your Demat portfolio.
                    </td>
                  </tr>
                ) : (
                  stocks.map((s, i) => {
                    const val = Number(s.totalValue) || Number(s.currentPrice * s.units) || 0
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{s.name || s.symbol}</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.units || s.qty || 0}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(s.avgPrice || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(s.currentPrice || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: '#0B1C3B' }}>{fmtINR(val)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'linear-gradient(90deg, #ecfdf5, #dcfce7)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Equity Investment</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0B1C3B' }}>{fmtINR(stockInvested)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>Unrealized Gain/Loss</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: stockValue >= stockInvested ? '#16a34a' : '#dc2626' }}>
                {stockValue >= stockInvested ? '+' : ''}{fmtINR(stockValue - stockInvested)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation & Support */}
      <div className="dash-grid-cols-2 mt-1">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>💼 Portfolio Allocation</h3>
            <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
              MF & Stocks Only
            </span>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
              <span style={{ fontWeight: 600, color: '#0B1C3B' }}>📈 Mutual Funds</span>
              <span style={{ fontWeight: 700, color: '#F39C12' }}>
                {totalValue > 0 ? `${((mfValue / totalValue) * 100).toFixed(1)}%` : '0%'} ({fmtINR(mfValue)})
              </span>
            </div>
            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', marginBottom: '1.2rem' }}>
              <div style={{
                height: '100%',
                width: `${totalValue > 0 ? (mfValue / totalValue) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #F39C12, #f59e0b)',
                borderRadius: '5px'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
              <span style={{ fontWeight: 600, color: '#0B1C3B' }}>📊 Stocks & Equity</span>
              <span style={{ fontWeight: 700, color: '#25D366' }}>
                {totalValue > 0 ? `${((stockValue / totalValue) * 100).toFixed(1)}%` : '0%'} ({fmtINR(stockValue)})
              </span>
            </div>
            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', marginBottom: '1.2rem' }}>
              <div style={{
                height: '100%',
                width: `${totalValue > 0 ? (stockValue / totalValue) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #25D366, #16a34a)',
                borderRadius: '5px'
              }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ padding: '0.6rem 0.8rem', background: '#fffbeb', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>Active SIPs</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>{mutualFunds.length}</div>
              </div>
              <div style={{ padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Stock Holdings</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{stocks.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-1">💬 Client Support & Queries</h3>
          <div style={{ marginTop: '0.5rem' }}>
            <SupportTickets tickets={tickets} onRaiseTicket={() => setShowTicketModal(true)} />
          </div>
        </div>
      </div>

      {/* Recent Orders / Transactions */}
      <div className="card mt-1">
        <div className="flex-between mb-1">
          <h3>📒 Recent Mutual Funds & Stocks Orders</h3>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={handleDownloadStatementPDF}
              className="btn btn-sm btn-outline"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Download or Print Portfolio & Transactions Statement as PDF"
            >
              <FontAwesomeIcon icon={faFilePdf} style={{ color: '#D12020' }} /> Statement PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn btn-sm btn-outline"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Export Transactions & Orders to Excel spreadsheet"
            >
              <FontAwesomeIcon icon={faFileExcel} style={{ color: '#16a34a' }} /> Export Excel
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Particulars</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem', fontStyle: 'italic' }}>
                    No recent mutual fund or stock transactions recorded.
                  </td>
                </tr>
              ) : (
                recentTxns.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{t.date}</td>
                    <td>{t.desc || t.particulars || t.scheme}</td>
                    <td>
                      <span className="badge" style={{
                        background: (t.type === 'BUY' || t.type === 'SIP') ? '#dcfce7' : '#fee2e2',
                        color: (t.type === 'BUY' || t.type === 'SIP') ? '#16a34a' : '#dc2626',
                        fontWeight: 700
                      }}>{t.type || 'ORDER'}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#0B1C3B' }}>
                      {fmtINR(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {showTicketModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 28, 59, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowTicketModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #0B1C3B, #14305C)',
              color: '#fff',
              padding: '1.2rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                  <FontAwesomeIcon icon={faLifeRing} style={{ marginRight: 8, color: '#F39C12' }} />
                  Raise Support Ticket
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Submit a query or request to your relationship manager
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="Mutual Funds & SIP">Mutual Funds &amp; SIP Query</option>
                  <option value="Stocks & Demat">Stocks &amp; Demat Holdings</option>
                  <option value="Statement & Tax Report">Statement &amp; Tax Report Request</option>
                  <option value="KYC & Profile Update">KYC / Bank Detail Update</option>
                  <option value="Redemption / Withdrawal">Redemption / Payout Request</option>
                  <option value="General Advisory">General Advisory &amp; Support</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Assistance needed with SIP adjustment or holding statement"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Description / Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide any specific details regarding your query..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  style={{ padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FontAwesomeIcon icon={faTicket} /> Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
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

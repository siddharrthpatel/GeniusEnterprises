import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faHandshake,
  faCoins,
  faRotate,
  faIdCard,
  faChartLine,
  faUserPlus,
  faFileLines
} from '@fortawesome/free-solid-svg-icons'
import { fmtINR } from '../utils/format'

const stats = [
  { icon: faUsers, label: 'Downline Clients', value: '18', sub: 'Across your channel' },
  { icon: faHandshake, label: 'Policies Sold', value: '12', sub: 'MTD Bookings' },
  { icon: faChartLine, label: 'Mutual Fund SIP', value: fmtINR(185000), sub: 'Active monthly book' },
  { icon: faCoins, label: 'Brokerage Earned', value: fmtINR(42500), sub: 'Ready for payout' },
  { icon: faRotate, label: 'Renewals Due', value: '4', sub: 'Next 15 days' },
  { icon: faIdCard, label: 'Active KYC', value: '18/18', sub: '100% compliant' }
]

export default function SubBrokerDashboard() {
  return (
    <div>
      <div className="dash-grid-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#0B1C3B,#14305C)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0
            }}>
              <FontAwesomeIcon icon={s.icon} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex-between mb-1" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>Sub-Broker Channel Overview</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/app/clients" className="btn-primary btn-sm">
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 6 }} /> My Clients
            </Link>
            <Link to="/app/reports" className="btn-outline btn-sm">
              <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 6 }} /> Commission Report
            </Link>
          </div>
        </div>
        <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>
          Manage your client portfolio, track monthly brokerage payouts, and monitor policy renewals seamlessly.
        </p>
      </div>
    </div>
  )
}


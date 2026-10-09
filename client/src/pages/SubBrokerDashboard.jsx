import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faHandshake,
  faCoins,
  faRotate,
  faIdCard,
  faChartLine,
  faBullseye
} from '@fortawesome/free-solid-svg-icons'
import { fmtINR } from '../utils/format'

const stats = [
  { icon: faUsers, label: 'Downline Clients', value: '0', sub: '0 this month' },
  { icon: faHandshake, label: 'Policies Sold', value: '0', sub: 'MTD' },
  { icon: faChartLine, label: 'Mutual Fund SIP', value: fmtINR(0), sub: 'monthly book' },
  { icon: faCoins, label: 'Brokerage', value: fmtINR(0), sub: 'pending payout' },
  { icon: faRotate, label: 'Renewals', value: '0', sub: 'due in 15 days' },
  { icon: faIdCard, label: 'Pending KYC', value: '0', sub: 'verification queue' },
  { icon: faBullseye, label: 'Target Progress', value: '0%', sub: '₹0 of ₹0' }
]

export default function SubBrokerDashboard() {
  return (
    <div>
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0B1C3B', marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{s.sub}</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg,#C9A227,#E8C547)',
                color: '#1a1408', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={s.icon} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Channel workflow</h3>
        <ol style={{ paddingLeft: '1.1rem', lineHeight: 1.7, color: '#334155' }}>
          <li>Source a client and complete KYC with the branch employee.</li>
          <li>Pitch insurance / SIP with the mapped advisor.</li>
          <li>RM reviews premium cases; ARM files documents.</li>
          <li>On issuance, brokerage posts to this dashboard for payout.</li>
        </ol>
      </div>
    </div>
  )
}

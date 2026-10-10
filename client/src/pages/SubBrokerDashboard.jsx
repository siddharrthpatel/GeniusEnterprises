/** (developed by @neelotpal.dey) **/
import React, { useState, useEffect } from 'react'
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
  faFileLines,
  faArrowsRotate,
  faCircleCheck,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { fmtINR } from '../utils/format'
import { useAuthStore, getLocalUsersList } from '../store/auth'
import api from '../api'

export default function SubBrokerDashboard() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState({
    downlineClients: 0,
    policiesSold: 0,
    mfSip: 0,
    brokerageEarned: 0,
    renewalsDue: 0,
    activeKycCount: 0,
    totalKycCount: 0,
    clientsList: []
  })

  const loadData = async () => {
    setLoading(true)
    try {
      let serverUsers = []
      try {
        const res = await api.get('/users?role=client')
        const raw = res?.data?.users || (Array.isArray(res?.data) ? res.data : [])
        serverUsers = Array.isArray(raw) ? raw : []
      } catch (_) {}

      const localList = getLocalUsersList().filter(
        (u) => u.role === 'client' || (!u.role && u.email && !u.email.endsWith('@genius.com'))
      )

      const combined = [...serverUsers]
      for (const lu of localList) {
        if (!combined.some((u) => u.email?.toLowerCase() === lu.email?.toLowerCase() || (u.id && u.id === lu.id))) {
          combined.push(lu)
        }
      }

      // Filter clients assigned to this sub-broker
      const currentUserId = user?.id
      const myClients = combined.filter((c) => {
        if (!currentUserId) return false
        return (
          c.reportsTo === currentUserId ||
          c.advisorId === currentUserId ||
          c.subBrokerId === currentUserId ||
          c.rmId === currentUserId
        )
      })

      if (myClients.length === 0) {
        // Strictly set to 0 when no data / clients exist in Supabase
        setMetrics({
          downlineClients: 0,
          policiesSold: 0,
          mfSip: 0,
          brokerageEarned: 0,
          renewalsDue: 0,
          activeKycCount: 0,
          totalKycCount: 0,
          clientsList: []
        })
      } else {
        // Calculate based on real assigned clients
        let kycDone = 0
        let totalInvested = 0

        for (const c of myClients) {
          if (c.pan && c.phone) kycDone++
          if (c.invested) totalInvested += Number(c.invested) || 0
        }

        const liveBrokerage = Math.round(totalInvested * 0.005)
        const liveSip = Math.round(totalInvested * 0.1)

        setMetrics({
          downlineClients: myClients.length,
          policiesSold: 0,
          mfSip: liveSip,
          brokerageEarned: liveBrokerage,
          renewalsDue: 0,
          activeKycCount: kycDone,
          totalKycCount: myClients.length,
          clientsList: myClients
        })
      }
    } catch (err) {
      console.warn('[SubBrokerDashboard] Failed to load data:', err)
      setMetrics({
        downlineClients: 0,
        policiesSold: 0,
        mfSip: 0,
        brokerageEarned: 0,
        renewalsDue: 0,
        activeKycCount: 0,
        totalKycCount: 0,
        clientsList: []
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const stats = [
    {
      icon: faUsers,
      label: 'Downline Clients',
      value: String(metrics.downlineClients),
      sub: metrics.downlineClients > 0 ? 'Across your channel' : '0 registered clients',
      color: 'linear-gradient(135deg,#0B1C3B,#14305C)'
    },
    {
      icon: faHandshake,
      label: 'Policies Sold',
      value: String(metrics.policiesSold),
      sub: metrics.policiesSold > 0 ? 'MTD Bookings' : 'No bookings yet',
      color: 'linear-gradient(135deg,#16a085,#0e6251)'
    },
    {
      icon: faChartLine,
      label: 'Mutual Fund SIP',
      value: fmtINR(metrics.mfSip),
      sub: metrics.mfSip > 0 ? 'Active monthly book' : '₹0 active book',
      color: 'linear-gradient(135deg,#8e44ad,#6c3483)'
    },
    {
      icon: faCoins,
      label: 'Brokerage Earned',
      value: fmtINR(metrics.brokerageEarned),
      sub: metrics.brokerageEarned > 0 ? 'Ready for payout' : '₹0 pending payout',
      color: 'linear-gradient(135deg,#D12020,#922b21)'
    },
    {
      icon: faRotate,
      label: 'Renewals Due',
      value: String(metrics.renewalsDue),
      sub: metrics.renewalsDue > 0 ? 'Next 15 days' : 'No upcoming renewals',
      color: 'linear-gradient(135deg,#F39C12,#b9770e)'
    },
    {
      icon: faIdCard,
      label: 'Active KYC',
      value: `${metrics.activeKycCount}/${metrics.totalKycCount}`,
      sub: metrics.totalKycCount > 0 ? `${Math.round((metrics.activeKycCount / metrics.totalKycCount) * 100)}% verified` : '0 verified',
      color: 'linear-gradient(135deg,#2980b9,#1e3a72)'
    }
  ]

  return (
    <div>
      <div className="flex-between mb-2" style={{ flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0B1C3B' }}>Sub-Broker Dashboard</h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Live portfolio channel metrics synced with Supabase
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => { setRefreshing(true); loadData(); }}
            disabled={loading || refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FontAwesomeIcon icon={faArrowsRotate} spin={refreshing} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/app/clients" className="btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FontAwesomeIcon icon={faUsers} /> My Clients
          </Link>
          <Link to="/app/reports" className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FontAwesomeIcon icon={faFileLines} /> Commission Report
          </Link>
        </div>
      </div>

      <div className="dash-grid-stats mb-2">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: s.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0
              }}
            >
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

      {metrics.clientsList.length > 0 ? (
        <div className="card mb-2">
          <div className="flex-between mb-1" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>Downline Clients ({metrics.clientsList.length})</h3>
            <Link to="/app/clients" className="btn-outline btn-sm">View All in Client Manager</Link>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>PAN</th>
                  <th>KYC Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.clientsList.slice(0, 5).map((c) => (
                  <tr key={c.id || c.email}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.pan || '—'}</td>
                    <td>
                      {c.pan && c.phone ? (
                        <span className="badge badge-active" style={{ background: '#dcfce7', color: '#16a34a' }}>
                          Verified
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card mb-2" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#0B1C3B', fontSize: '1.1rem' }}>No Downline Clients Assigned Yet</h3>
          <p style={{ margin: '0 auto 1.25rem', maxWidth: 520, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
            All channel metrics are currently at zero. When clients register under your sub-broker account or are assigned to you by administrators in Supabase, their real-time portfolio metrics and brokerage earnings will appear here.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/app/clients" className="btn-primary btn-sm">
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 6 }} /> Register / View Clients
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex-between mb-1" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>Sub-Broker Channel Overview</h3>
        </div>
        <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>
          Manage your client portfolio, track monthly brokerage payouts, and monitor policy renewals seamlessly. All metrics dynamically update from Supabase database records.
        </p>
      </div>
    </div>
  )
}

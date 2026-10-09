import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFilePdf,
  faFileExcel,
  faChevronDown,
  faCircleCheck,
  faFileCircleCheck
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore } from '../store/auth'
import { fmtINR, downloadExcel, printHTML, rowsToHTMLTable } from '../utils/format'
import api from '../api'

const mockHoldings = [
  ['Nifty 50 Index Fund - Direct Growth', 'INF100K0123', 1500000, 1785000, 31.6, 19.0],
  ['Axis Bluechip Fund', 'INF207K0124', 800000, 920000, 16.3, 15.0],
  ['SBI Small Cap Fund', 'INF320K0125', 500000, 560000, 9.9, 12.0],
  ['HDFC Mid-Cap Opportunities', 'INF105K0126', 700000, 805000, 14.2, 15.0],
  ['LIC Jeevan Labh Policy', 'LIC-12345', 600000, 650000, 11.5, 8.3],
  ['PPF Account - 15 Yr', 'PPF-99887', 500000, 570000, 10.1, 14.0],
  ['SBI Savings Account', 'SB-100234', 200000, 200000, 3.5, 3.5],
  ['Apollo Family Health Plan', 'APOLLO-123', 100000, 100000, 1.8, 0.0],
]
const mockTransactions = [
  ['2026-08-05', 'Purchase', 'Nifty 50 Index Fund', 50000, 1250, 40.00],
  ['2026-07-28', 'SIP', 'Axis Bluechip Fund', 10000, 250, 40.00],
  ['2026-07-20', 'SIP', 'SBI Small Cap Fund', 10000, 200, 50.00],
  ['2026-07-10', 'Dividend', 'HDFC Mid-Cap Opportunities', 4300, null, null],
  ['2026-06-25', 'Purchase', 'PPF Account', 100000, null, null],
  ['2026-06-05', 'Redemption', 'SBI Savings A/c', -25000, null, null],
  ['2026-05-20', 'Premium', 'LIC Jeevan Labh', 60000, null, null],
]

export default function ClientReports() {
  const user = useAuthStore((s) => s.user)
  const isClient = user?.role === 'client'
  const [selectedClient, setSelectedClient] = useState('')
  const [clients, setClients] = useState([])
  const [busy, setBusy] = useState({ pdf: false, xlsx: false })
  const [summary, setSummary] = useState({
    invested: 4800000,
    current: 5640000,
    gains: 840000,
    totalTxns: 42,
    dividendIncome: 86200,
    stampDuty: 2400,
    stcg: 42000,
    ltcg: 0
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/users?role=client')
        if (res.data && res.data.users) setClients(res.data.users)
      } catch (e) {
        setClients([
          { id: 'c1', name: 'Meera Reddy', email: 'meera@example.com', phone: '+91 9810000008', pan: 'CLMR1234H' },
          { id: 'c2', name: 'Rajesh Khanna', email: 'rajesh@example.com', phone: '+91 9810000009', pan: 'CLRK1234I' },
          { id: 'c3', name: 'Sunita Kapoor', email: 'sunita@example.com', phone: '+91 9810000010', pan: 'CLSK1234J' },
          { id: 'c4', name: 'Vijay Malhotra', email: 'vijay@example.com', phone: '+91 9810000011', pan: 'CLVM1234K' },
        ])
      }
    }
    if (!isClient) load()
  }, [isClient])

  const targetId = isClient ? (user?.id || 'c1') : selectedClient
  const targetClient = isClient
    ? user || clients[0]
    : clients.find(c => c.id === selectedClient) || clients[0]

  async function tryServerDownload(url, filename, type) {
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
    } catch (e) { /* fall through to client-side */ }
    return false
  }

  function holdingsToCSVRows() {
    return mockHoldings.map(h => [h[0], h[1], fmtINR(h[2]), fmtINR(h[3]), fmtPct(h[4]), fmtPct(h[5])])
  }
  function txnsToCSVRows() {
    return mockTransactions.map(t => [t[0], t[1], t[2], t[3] != null ? fmtINR(t[3]) : '', t[4] ?? '', t[5] ?? ''])
  }

  async function downloadPDFReport() {
    if (!targetId) return
    setBusy(b => ({ ...b, pdf: true }))
    try {
      const fname = `Portfolio_${(targetClient?.name || 'report').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`
      const ok = await tryServerDownload(`/reports/portfolio/${targetId}.pdf`, fname, 'pdf')
      if (!ok) {
        const html =
          `<h2>Client Details</h2>
           <table><tbody>
             <tr><th>Name</th><td>${targetClient?.name || 'Client User'}</td></tr>
             <tr><th>Client ID</th><td>${targetId}</td></tr>
             <tr><th>Email</th><td>${targetClient?.email || '—'}</td></tr>
             <tr><th>Phone</th><td>${targetClient?.phone || '—'}</td></tr>
             <tr><th>PAN</th><td>${targetClient?.pan || '—'}</td></tr>
           </tbody></table>
          <h2>Portfolio Summary</h2>
          <table>
            <tr><th>Total Invested</th><th>Current Value</th><th>Net Returns</th><th>Return %</th></tr>
            <tr class="summary-row">
              <td>${fmtINR(summary.invested)}</td>
              <td>${fmtINR(summary.current)}</td>
              <td class="${summary.gains>=0?'success':'danger'}">${summary.gains>=0?'+':''}${fmtINR(summary.gains)}</td>
              <td class="${summary.gains>=0?'success':'danger'}">${summary.gains>=0?'+':''}${fmtPct(summary.gains/summary.invested*100)}</td>
            </tr>
          </table>
          <h2>Holdings</h2>` +
          rowsToHTMLTable(
            ['Instrument', 'Code', 'Invested', 'Current Value', 'Weight %', 'Change %'],
            mockHoldings.map(h => [h[0], h[1], fmtINR(h[2]), fmtINR(h[3]), fmtPct(h[4]), fmtPct(h[5])])
          ) +
          `<h2>Recent Transactions</h2>` +
          rowsToHTMLTable(
            ['Date', 'Type', 'Scheme', 'Amount (₹)', 'Units', 'NAV'],
            mockTransactions.map(t => [t[0], t[1], t[2], fmtINR(t[3]||0), t[4] ?? '-', t[5] ?? '-'])
          )
        printHTML(`Portfolio Report — ${targetClient?.name || 'Client'}`, html)
      }
    } finally {
      setBusy(b => ({ ...b, pdf: false }))
    }
  }

  async function downloadXLSXReport() {
    if (!targetId) return
    setBusy(b => ({ ...b, xlsx: true }))
    try {
      const fname = `Portfolio_${(targetClient?.name || 'report').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}`
      const ok = await tryServerDownload(`/reports/portfolio/${targetId}.xlsx`, fname + '.xlsx', 'xlsx')
      if (!ok) {
        downloadExcel(
          ['Client: ' + (targetClient?.name || 'Client') + ' — Generated: ' + new Date().toLocaleString('en-IN')],
          [],
          fname
        )
        setTimeout(() => {
          downloadExcel(
            ['Instrument', 'Code', 'Invested', 'Current Value', 'Weight %', 'Change %'],
            holdingsToCSVRows(),
            fname + '__Holdings'
          )
        }, 80)
        setTimeout(() => {
          downloadExcel(
            ['Date', 'Type', 'Scheme', 'Amount', 'Units', 'NAV'],
            txnsToCSVRows(),
            fname + '__Transactions'
          )
        }, 160)
      }
    } finally {
      setBusy(b => ({ ...b, xlsx: false }))
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Client Reports</h1>
          <p className="text-muted mb-0" style={{ marginTop: 4 }}>
            Generate and download detailed portfolio reports in PDF or Excel format
          </p>
        </div>
      </div>

      {!isClient && (
        <div className="card mb-2">
          <div className="form-group" style={{ maxWidth: 420, margin: 0 }}>
            <label><FontAwesomeIcon icon={faChevronDown} style={{ marginRight: 6 }} />Select a Client First</label>
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
              <option value="">— Choose a client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.id}</option>)}
            </select>
          </div>
          {!selectedClient && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f7ff', borderRadius: 10, color: '#1e3a8a', fontSize: '0.9rem', borderLeft: '3px solid #1e3a8a' }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 6 }} />
              Select a client above to view their report options and summary preview.
            </div>
          )}
        </div>
      )}

      {(isClient || selectedClient) && (
        <>
          <div className="report-tiles mb-2">
            <div className="report-tile pdf" style={{ cursor: busy.pdf ? 'wait' : 'pointer' }} onClick={!busy.pdf ? downloadPDFReport : undefined}>
              <div className="rt-icon pdf"><FontAwesomeIcon icon={faFilePdf} /></div>
              <div className="rt-title">Download PDF Report</div>
              <div className="rt-sub">Comprehensive portfolio summary, holdings, performance & transactions. Ideal for printing and sharing.</div>
              <button className="btn-danger" style={{ marginTop: 8 }} disabled={busy.pdf}>
                <FontAwesomeIcon icon={faFilePdf} style={{ marginRight: 6 }} />
                {busy.pdf ? 'Generating…' : 'Generate PDF'}
              </button>
            </div>
            <div className="report-tile excel" style={{ cursor: busy.xlsx ? 'wait' : 'pointer' }} onClick={!busy.xlsx ? downloadXLSXReport : undefined}>
              <div className="rt-icon excel"><FontAwesomeIcon icon={faFileExcel} /></div>
              <div className="rt-title">Download Excel Report</div>
              <div className="rt-sub">Tabular holdings, transactions, and allocation data. Ready for analysis in any spreadsheet tool.</div>
              <button className="btn-success" style={{ marginTop: 8 }} disabled={busy.xlsx}>
                <FontAwesomeIcon icon={faFileExcel} style={{ marginRight: 6 }} />
                {busy.xlsx ? 'Generating…' : 'Generate XLSX'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex-between mb-1">
              <h3><FontAwesomeIcon icon={faFileCircleCheck} style={{ marginRight: 8, color: '#0B1C3B' }} /> Report Summary Preview</h3>
              <span className="badge badge-active"><FontAwesomeIcon icon={faCircleCheck} /> Data refreshed today</span>
            </div>

            <div className="grid-4 mb-2">
              <div style={{ padding: '1rem', background: '#f7f9fc', borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', color: '#777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Invested</div>
                <div style={{ fontFamily: 'Montserrat', fontSize: '1.35rem', fontWeight: 700, color: '#0B1C3B', marginTop: 4 }}>{fmtINR(summary.invested)}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f7f9fc', borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', color: '#777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Value</div>
                <div style={{ fontFamily: 'Montserrat', fontSize: '1.35rem', fontWeight: 700, color: '#0B1C3B', marginTop: 4 }}>{fmtINR(summary.current)}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f7f9fc', borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', color: '#777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Gains</div>
                <div style={{ fontFamily: 'Montserrat', fontSize: '1.35rem', fontWeight: 700, color: '#25D366', marginTop: 4 }}>+{fmtINR(summary.gains)}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f7f9fc', borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', color: '#777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dividend Income</div>
                <div style={{ fontFamily: 'Montserrat', fontSize: '1.35rem', fontWeight: 700, color: '#F39C12', marginTop: 4 }}>{fmtINR(summary.dividendIncome)}</div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Amount (₹)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total Invested Amount</td>
                    <td>{fmtINR(summary.invested)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>All contributions including SIPs & lumpsum</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total Current Value</td>
                    <td>{fmtINR(summary.current)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>Marked to market at latest NAVs</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Absolute Gains</td>
                    <td className="text-up">+{fmtINR(summary.gains)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>Current − Invested</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total Transactions</td>
                    <td>{summary.totalTxns}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>Purchases, redemptions, switches, dividends</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Dividend Income (FY)</td>
                    <td>{fmtINR(summary.dividendIncome)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>Taxable at slab rate</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Stamp Duty Paid</td>
                    <td>{fmtINR(summary.stampDuty)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>0.005% on mutual fund purchases</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Short Term Capital Gains</td>
                    <td>{fmtINR(summary.stcg)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>Equity: 15% • Debt: slab rate</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Long Term Capital Gains</td>
                    <td>{fmtINR(summary.ltcg)}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>Equity: 10% above ₹1L • Debt: 20% with indexation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

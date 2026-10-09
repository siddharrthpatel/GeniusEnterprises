import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDays,
  faCoins,
  faPercent,
  faSackDollar,
  faPiggyBank,
  faLandmark,
  faVault,
  faBuildingColumns,
  faSeedling,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { fmtINR, fmtPct } from '../utils/format'
import api from '../api'

const defaults = {
  years: 10,
  sipMonthly: 10000,
  sipRate: 12,
  mfLumpsum: 500000,
  mfRate: 14,
  rdMonthly: 5000,
  rdRate: 6.5,
  fdPrincipal: 500000,
  fdRate: 7,
  ppfYearly: 150000
}

function calcResult(inputs) {
  const { years, sipMonthly, sipRate, mfLumpsum, mfRate, rdMonthly, rdRate, fdPrincipal, fdRate, ppfYearly } = inputs
  const n = years
  const sipN = n * 12
  const sipR = sipRate / 100 / 12
  const sipInvested = sipMonthly * sipN
  const sipValue = sipR > 0 ? sipMonthly * ((Math.pow(1 + sipR, sipN) - 1) / sipR) * (1 + sipR) : sipInvested

  const mfInvested = mfLumpsum
  const mfValue = mfLumpsum * Math.pow(1 + mfRate / 100, n)

  const rdN = n * 12
  const rdR = rdRate / 100 / 4
  const rdInvested = rdMonthly * rdN
  let rdValue = 0
  for (let i = 0; i < rdN; i++) {
    const monthsLeft = rdN - i
    rdValue += rdMonthly * Math.pow(1 + rdR, Math.floor(monthsLeft / 3))
  }

  const fdInvested = fdPrincipal
  const fdValue = fdPrincipal * Math.pow(1 + (fdRate / 100) / 4, n * 4)

  const ppfInvested = ppfYearly * n
  const ppfRate = 7.1 / 100
  let ppfValue = 0
  for (let i = 0; i < n; i++) {
    ppfValue = (ppfValue + ppfYearly) * (1 + ppfRate)
  }

  return {
    sip: { name: 'SIP', invested: sipInvested, value: sipValue, returns: sipValue - sipInvested, returnPct: sipInvested ? ((sipValue - sipInvested) / sipInvested) * 100 : 0, risk: 'Med' },
    mf: { name: 'Mutual Fund', invested: mfInvested, value: mfValue, returns: mfValue - mfInvested, returnPct: mfInvested ? ((mfValue - mfInvested) / mfInvested) * 100 : 0, risk: 'High' },
    rd: { name: 'RD', invested: rdInvested, value: rdValue, returns: rdValue - rdInvested, returnPct: rdInvested ? ((rdValue - rdInvested) / rdInvested) * 100 : 0, risk: 'Low' },
    fd: { name: 'FD', invested: fdInvested, value: fdValue, returns: fdValue - fdInvested, returnPct: fdInvested ? ((fdValue - fdInvested) / fdInvested) * 100 : 0, risk: 'Low' },
    ppf: { name: 'PPF', invested: ppfInvested, value: ppfValue, returns: ppfValue - ppfInvested, returnPct: ppfInvested ? ((ppfValue - ppfInvested) / ppfInvested) * 100 : 0, risk: 'Low' }
  }
}

const ProductCard = ({ cls, label, data }) => (
  <div className={`compare-card ${cls}`}>
    <div className="cc-head">{label}</div>
    <div className="cc-row"><span>Invested</span><span>{fmtINR(data.invested)}</span></div>
    <div className="cc-row"><span>Maturity Value</span><span>{fmtINR(data.value)}</span></div>
    <div className="cc-row">
      <span>Returns</span>
      <span className={data.returns >= 0 ? 'cc-returns-pos' : 'cc-returns-neg'}>
        {data.returns >= 0 ? '+' : ''}{fmtINR(data.returns)}
      </span>
    </div>
    <div className="cc-row">
      <span>Return %</span>
      <span className={data.returnPct >= 0 ? 'cc-returns-pos' : 'cc-returns-neg'}>
        {fmtPct(data.returnPct)}
      </span>
    </div>
  </div>
)

const inputDefs = [
  { key: 'years', label: 'Investment Period (Years)', icon: faCalendarDays, type: 'number', min: 1, max: 40, step: 1 },
  { key: 'sipMonthly', label: 'SIP — Monthly Amount (₹)', icon: faCoins, type: 'number', min: 500, step: 500, prefix: 'SIP' },
  { key: 'sipRate', label: 'SIP — Expected Rate (% p.a.)', icon: faPercent, type: 'number', min: 1, max: 30, step: 0.5, suffix: '%' },
  { key: 'mfLumpsum', label: 'Mutual Fund — Lumpsum (₹)', icon: faSackDollar, type: 'number', min: 0, step: 10000, prefix: 'MF' },
  { key: 'mfRate', label: 'Mutual Fund — Rate (% p.a.)', icon: faPercent, type: 'number', min: 1, max: 40, step: 0.5, suffix: '%' },
  { key: 'rdMonthly', label: 'RD — Monthly Deposit (₹)', icon: faPiggyBank, type: 'number', min: 100, step: 100, prefix: 'RD' },
  { key: 'rdRate', label: 'RD — Interest Rate (%)', icon: faPercent, type: 'number', min: 1, max: 15, step: 0.1, suffix: '%' },
  { key: 'fdPrincipal', label: 'FD — Principal (₹)', icon: faLandmark, type: 'number', min: 0, step: 10000, prefix: 'FD' },
  { key: 'fdRate', label: 'FD — Interest Rate (%)', icon: faPercent, type: 'number', min: 1, max: 15, step: 0.1, suffix: '%' },
  { key: 'ppfYearly', label: 'PPF — Yearly Contribution (₹)', icon: faSeedling, type: 'number', min: 0, max: 150000, step: 1000, prefix: 'PPF' }
]

export default function Compare() {
  const [inputs, setInputs] = useState(defaults)
  const [result, setResult] = useState(() => calcResult(defaults))

  useEffect(() => {
    let cancel = false
    const run = async () => {
      try {
        const res = await api.post('/compare', inputs)
        if (!cancel && res.data) {
          const d = res.data
          if (d.sip && d.mf) setResult(d)
          else setResult(calcResult(inputs))
        }
      } catch (e) {
        if (!cancel) setResult(calcResult(inputs))
      }
    }
    const t = setTimeout(run, 250)
    return () => { cancel = true; clearTimeout(t) }
  }, [inputs])

  const change = (k) => (e) => {
    const v = e.target.value === '' ? '' : Number(e.target.value)
    setInputs({ ...inputs, [k]: v === '' ? 0 : v })
  }

  const chartData = [
    { name: 'SIP', Invested: result.sip.invested, Value: result.sip.value },
    { name: 'MF', Invested: result.mf.invested, Value: result.mf.value },
    { name: 'RD', Invested: result.rd.invested, Value: result.rd.value },
    { name: 'FD', Invested: result.fd.invested, Value: result.fd.value },
    { name: 'PPF', Invested: result.ppf.invested, Value: result.ppf.value }
  ]

  const rows = [result.sip, result.mf, result.rd, result.fd, result.ppf]
  const keyOf = (i) => ['sip', 'mf', 'rd', 'fd', 'ppf'][i]

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Compare Investment Products</h1>
          <p className="text-muted mb-0" style={{ marginTop: 4 }}>
            Model SIP, Mutual Funds, RD, FD, and PPF side-by-side. All values are indicative only.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-outline" onClick={() => { setInputs(defaults); setResult(calcResult(defaults)) }}>
            <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: 6 }} /> Reset Defaults
          </button>
        </div>
      </div>

      <div className="card mb-2">
        <h3 style={{ marginBottom: '1.25rem' }}><FontAwesomeIcon icon={faBuildingColumns} style={{ marginRight: 8, color: '#0B1C3B' }} /> Input Parameters</h3>
        <div className="grid-2">
          {inputDefs.map(def => (
            <div key={def.key} className="form-group">
              <label>
                <FontAwesomeIcon icon={def.icon} style={{ marginRight: 6 }} />
                {def.label}
              </label>
              <input
                type={def.type}
                min={def.min}
                max={def.max}
                step={def.step}
                value={inputs[def.key]}
                onChange={change(def.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2 grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <ProductCard cls="sip" label="SIP — Systematic" data={result.sip} />
        <ProductCard cls="mf" label="Mutual Fund Lumpsum" data={result.mf} />
        <ProductCard cls="rd" label="Recurring Deposit" data={result.rd} />
        <ProductCard cls="fd" label="Fixed Deposit" data={result.fd} />
        <ProductCard cls="ppf" label="PPF — Public" data={result.ppf} />
      </div>

      <div className="card mb-2">
        <h3>Maturity Value Comparison (₹)</h3>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 100000).toFixed(0) + 'L'} />
              <Tooltip formatter={(v) => fmtINR(v)} />
              <Legend />
              <Bar dataKey="Invested" fill="#14305C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Value" fill="#D12020" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Detailed Comparison Table</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Total Invested</th>
                <th>Maturity Value</th>
                <th>Net Returns</th>
                <th>Return %</th>
                <th>Risk Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={keyOf(i)}>
                  <td style={{ fontWeight: 700, color: '#0B1C3B', fontFamily: 'Montserrat' }}>
                    {['SIP', 'Mutual Fund (Lumpsum)', 'Recurring Deposit', 'Fixed Deposit', 'Public Provident Fund'][i]}
                  </td>
                  <td>{fmtINR(r.invested)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtINR(r.value)}</td>
                  <td className={r.returns >= 0 ? 'text-up' : 'text-down'}>
                    {r.returns >= 0 ? '+' : ''}{fmtINR(r.returns)}
                  </td>
                  <td className={r.returnPct >= 0 ? 'text-up' : 'text-down'}>{fmtPct(r.returnPct)}</td>
                  <td>
                    <span className={`badge badge-${r.risk === 'Low' ? 'low' : r.risk === 'Med' ? 'med' : 'high'}`}>
                      {r.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="warning-callout">
          <FontAwesomeIcon icon={faCircleInfo} />
          <div>
            <strong>Illustrative Calculations — Not Investment Advice</strong>
            <p>
              Returns shown are mathematical projections based on the rates you enter. Actual mutual fund, SIP, and market-linked returns are subject to market risks.
              RD, FD, and PPF rates are illustrative; check with your bank or post office for current rates. PPF has a 15-year lock-in with 7.1% (FY25-26) government-declared rate.
              Please consult a SEBI-registered investment advisor before making decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

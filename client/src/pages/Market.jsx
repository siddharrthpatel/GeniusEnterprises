import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRotateRight,
  faPause,
  faPlay,
  faArrowUp,
  faArrowDown,
  faTriangleExclamation,
  faBullseye,
  faBuilding,
  faLandmarkFlag,
  faMicrochip,
  faCar,
  faPills,
  faCartShopping,
  faIndustry,
  faTrophy,
  faCircleDown
} from '@fortawesome/free-solid-svg-icons'
import api from '../api'
import { fmtNum, fmtPct } from '../utils/format'

const defaultIndices = [
  { symbol: 'SENSEX', name: 'BSE Sensex', price: 74230.55, change: 0.42, changePts: 310.8, icon: faBullseye },
  { symbol: 'NIFTY50', name: 'Nifty 50', price: 22520.3, change: 0.38, changePts: 85.2, icon: faBuilding },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', price: 48120.7, change: -0.21, changePts: -101.3, icon: faLandmarkFlag },
  { symbol: 'NIFTYIT', name: 'Nifty IT', price: 36240.1, change: 0.88, changePts: 316.5, icon: faMicrochip },
  { symbol: 'NIFTYAUTO', name: 'Nifty Auto', price: 21450.9, change: -0.45, changePts: -96.7, icon: faCar },
  { symbol: 'NIFTYPHARMA', name: 'Nifty Pharma', price: 19820.4, change: 0.67, changePts: 132.1, icon: faPills },
  { symbol: 'NIFTYFMCG', name: 'Nifty FMCG', price: 52130.8, change: 0.12, changePts: 62.5, icon: faCartShopping },
  { symbol: 'NIFTYMETAL', name: 'Nifty Metal', price: 8920.2, change: -1.03, changePts: -92.8, icon: faIndustry }
]

const defaultGainers = [
  { symbol: 'TCS', price: 3820.4, change: 2.84 },
  { symbol: 'INFY', price: 1624.5, change: 2.31 },
  { symbol: 'HCLTECH', price: 1485.2, change: 1.98 },
  { symbol: 'WIPRO', price: 478.6, change: 1.76 },
  { symbol: 'TECHM', price: 1248.9, change: 1.52 }
]
const defaultLosers = [
  { symbol: 'TATASTEEL', price: 142.3, change: -2.12 },
  { symbol: 'JSWSTEEL', price: 842.1, change: -1.88 },
  { symbol: 'HINDALCO', price: 612.5, change: -1.65 },
  { symbol: 'COALINDIA', price: 448.2, change: -1.42 },
  { symbol: 'ONGC', price: 268.7, change: -1.18 }
]

const REFRESH_INTERVAL = 30

export default function Market() {
  const [indices, setIndices] = useState([])
  const [gainers, setGainers] = useState([])
  const [losers, setLosers] = useState([])
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [paused, setPaused] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef(null)

  const doRefresh = async () => {
    setRefreshing(true)
    setCountdown(REFRESH_INTERVAL)
    try {
      const res = await api.get('/market/indices')
      if (res.data) {
        if (Array.isArray(res.data.indices)) {
          setIndices(res.data.indices.map((i, k) => ({ ...i, icon: defaultIndices[k]?.icon || faBuilding })))
        }
        if (Array.isArray(res.data.gainers)) setGainers(res.data.gainers)
        if (Array.isArray(res.data.losers)) setLosers(res.data.losers)
      } else {
        setIndices([]); setGainers([]); setLosers([])
      }
    } catch (e) {
      setIndices([]); setGainers([]); setLosers([])
    }
    setTimeout(() => setRefreshing(false), 500)
  }

  const simulate = () => {
    setIndices(prev => prev.map(idx => {
      const delta = (Math.random() - 0.5) * 0.008
      const newPrice = idx.price * (1 + delta)
      const newChange = (delta * 100) + (idx.change || 0) * 0.5
      return { ...idx, price: newPrice, change: newChange, changePts: newPrice * newChange / 100 }
    }))
    setGainers(prev => prev.map(s => ({ ...s, price: s.price * (1 + (Math.random() * 0.015)), change: s.change * (0.9 + Math.random() * 0.2) })))
    setLosers(prev => prev.map(s => ({ ...s, price: s.price * (1 + (Math.random() - 0.6) * 0.01), change: s.change * (0.9 + Math.random() * 0.2) })))
  }

  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          doRefresh()
          return REFRESH_INTERVAL
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [paused])

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Live Market Overview</h1>
          <p className="text-muted mb-0" style={{ marginTop: 4 }}>
            Track major indices, top gainers, and top losers in real time
          </p>
        </div>
      </div>

      <div className="market-countdown-banner" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="cb-left">
          <div className="cb-icon">
            <FontAwesomeIcon icon={faBullseye} />
          </div>
          <div>
            <div className="cb-title">Live Market Data</div>
            <div className="cb-sub">
              {paused ? 'Auto refresh paused' : 'Auto refresh every 30 seconds'}
              {' • '}Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="cb-count">
          {paused ? 'PAUSED' : `${countdown}s`}
        </div>

        <div className="cb-actions">
          <button onClick={doRefresh} disabled={refreshing} className={refreshing ? '' : ''} style={{ opacity: refreshing ? 0.7 : 1 }}>
            <FontAwesomeIcon icon={faRotateRight} spin={refreshing} style={{ marginRight: 6 }} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <button
            className={paused ? 'paused' : ''}
            onClick={() => { setPaused(p => !p); if (paused) setCountdown(REFRESH_INTERVAL) }}
          >
            <FontAwesomeIcon icon={paused ? faPlay : faPause} style={{ marginRight: 6 }} />
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="index-grid">
        {indices.map(idx => (
          <div key={idx.symbol} className="index-card">
            <div className="ic-head">
              <div className="ic-name">
                <div className="ic-icon"><FontAwesomeIcon icon={idx.icon} /></div>
                <div>
                  <div>{idx.symbol}</div>
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>{idx.name}</div>
                </div>
              </div>
              <div className={`ic-change ${idx.change >= 0 ? 'ic-up' : 'ic-down'}`}>
                <FontAwesomeIcon icon={idx.change >= 0 ? faArrowUp : faArrowDown} size="xs" />
                {fmtPct(Math.abs(idx.change))}
              </div>
            </div>
            <div className="ic-price">{fmtNum(idx.price)}</div>
            <div className="ic-change-pts">
              {idx.changePts >= 0 ? '+' : ''}{fmtNum(idx.changePts)} pts
              <span className={idx.change >= 0 ? 'text-up' : 'text-down'} style={{ marginLeft: 8, fontWeight: 600 }}>
                ({idx.change >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(idx.change))})
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="gainers-losers">
        <div className="card gl-card">
          <h3>
            <span className="gain"><FontAwesomeIcon icon={faTrophy} /> Top Gainers</span>
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price (₹)</th>
                  <th>Change %</th>
                </tr>
              </thead>
              <tbody>
                {gainers.map(g => (
                  <tr key={g.symbol}>
                    <td style={{ fontWeight: 700, fontFamily: 'Montserrat', color: '#0B1C3B' }}>{g.symbol}</td>
                    <td>{fmtNum(g.price)}</td>
                    <td className="text-up" style={{ fontWeight: 700 }}>
                      <FontAwesomeIcon icon={faArrowUp} size="xs" style={{ marginRight: 4 }} />
                      +{fmtPct(g.change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card gl-card">
          <h3>
            <span className="loss"><FontAwesomeIcon icon={faCircleDown} /> Top Losers</span>
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price (₹)</th>
                  <th>Change %</th>
                </tr>
              </thead>
              <tbody>
                {losers.map(l => (
                  <tr key={l.symbol}>
                    <td style={{ fontWeight: 700, fontFamily: 'Montserrat', color: '#0B1C3B' }}>{l.symbol}</td>
                    <td>{fmtNum(l.price)}</td>
                    <td className="text-down" style={{ fontWeight: 700 }}>
                      <FontAwesomeIcon icon={faArrowDown} size="xs" style={{ marginRight: 4 }} />
                      {fmtPct(l.change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="warning-callout">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <div>
          <strong>⚠ Why this data is simulated</strong>
          <p>
            Displaying real live stock market data requires licenses from NSE / BSE and paid data providers.
            For this demo portal, index prices, gainers, and losers are algorithmically generated with realistic
            volatility patterns and updated every 30 seconds. They will not match actual exchange prices.
            In production, integrate with approved vendors like NSE Datafeed, BSE StAR, or financial APIs
            (Kite Connect, Upstox, Alpha Vantage, etc.) and ensure compliance with SEBI data redistribution rules.
          </p>
        </div>
      </div>
    </div>
  )
}

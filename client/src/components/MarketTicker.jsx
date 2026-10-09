import { useEffect, useState } from 'react'

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const DEFAULT_ITEMS = [
  { code: 'SENSEX', symbol: 'SENSEX', name: 'BSE SENSEX', price: 72443.71, change: -194.99, changePct: -0.27 },
  { code: 'NIFTY50', symbol: 'NIFTY 50', name: 'NIFTY 50', price: 22516.90, change: -86.20, changePct: -0.38 },
  { code: 'BANKNIFTY', symbol: 'BANK NIFTY', name: 'BANK NIFTY', price: 47924.50, change: 71.85, changePct: 0.15 },
  { code: 'RELIANCE', symbol: 'RELIANCE', name: 'Reliance Industries', price: 2980.45, change: 19.30, changePct: 0.65 },
  { code: 'TCS', symbol: 'TCS', name: 'Tata Consultancy', price: 3840.10, change: -6.90, changePct: -0.18 },
  { code: 'HDFCBANK', symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1530.25, change: 6.40, changePct: 0.42 },
  { code: 'INFY', symbol: 'INFY', name: 'Infosys', price: 1495.80, change: -8.25, changePct: -0.55 },
  { code: 'ICICIBANK', symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1085.60, change: 9.45, changePct: 0.88 }
]

export default function MarketTicker() {
  const [items, setItems] = useState(DEFAULT_ITEMS)
  const [source, setSource] = useState('yahoo')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/market/ticker')
        if (!res.ok) throw new Error('Ticker fetch error')
        const data = await res.json()
        if (cancelled) return
        const next = Array.isArray(data.items) && data.items.length ? data.items : DEFAULT_ITEMS
        setItems(next)
        setSource(data.source || 'yahoo')
      } catch {
        if (!cancelled) {
          // Keep current/default items on error so the bar is never removed or blank
          setItems((prev) => (prev.length ? prev : DEFAULT_ITEMS))
          setSource((s) => s || 'yahoo')
        }
      }
    }
    load()
    const t = setInterval(load, 30 * 1000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const displayItems = items.length ? items : DEFAULT_ITEMS
  const doubled = [...displayItems, ...displayItems, ...displayItems, ...displayItems]

  return (
    <div className="ticker-wrap live-ticker">
      <div className="ticker">
        {doubled.map((it, i) => {
          const pct = Number(it.changePct || 0)
          const up = pct >= 0
          const label = it.name || it.symbol || it.code
          return (
            <span className="ticker-item" key={i + '-' + (it.code || label)}>
              <strong>{label}</strong>
              {' '}{fmt(it.price)}{' '}
              <span className={up ? 'up' : 'down'}>
                <i className={`fas fa-caret-${up ? 'up' : 'down'}`} /> {Math.abs(pct).toFixed(2)}%
              </span>
            </span>
          )
        })}
      </div>
      {source ? (
        <span className="ticker-source">
          {source === 'yahoo' ? 'Yahoo Live' : source === 'gemini' ? 'Gemini AI' : source}
        </span>
      ) : null}
    </div>
  )
}

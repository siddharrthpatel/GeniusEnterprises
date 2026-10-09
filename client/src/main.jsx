import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fab, fas)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Crash ErrorBoundary:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'Montserrat, sans-serif', maxWidth: 800, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <h2 style={{ color: '#D12020', margin: '0 0 1rem 0' }}>Something went wrong loading Genius Enterprises</h2>
          <p style={{ color: '#555' }}>An unexpected error occurred while rendering the page:</p>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 6, overflowX: 'auto', color: '#c0392b', fontSize: '0.85rem' }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 20px', background: '#0B1C3B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Clear Cache &amp; Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)


import React, { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import { useAuthStore } from './store/auth'
import RequireAuth from './components/RequireAuth'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import ClientSignup from './pages/ClientSignup'
import DashboardRole from './pages/DashboardRole'
import AdminUsers from './pages/AdminUsers'
import ClientReports from './pages/ClientReports'
import ClientProfile from './pages/ClientProfile'
import ClientsList from './pages/ClientsList'
import Compare from './pages/Compare'
import Market from './pages/Market'
import LandingPage from './pages/LandingPage'
import MasterAdmin from './pages/MasterAdmin'

function PortalRedirect() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/app/dashboard" replace />
  return <Navigate to="/portal/login" replace />
}

export default function App() {
  const loadMe = useAuthStore((s) => s.loadMe)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const doLoad = async () => {
      await loadMe()
      setLoaded(true)
    }
    doLoad()
  }, [loadMe])

  if (!loaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0B1C3B 0%, #14305C 60%, #1e3a72 100%)',
        gap: '1.5rem'
      }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #D12020, #e74c3c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 800,
          fontSize: '1.6rem',
          color: '#fff',
          boxShadow: '0 8px 32px rgba(209,32,32,0.4)'
        }}>GE</div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#fff', letterSpacing: 1 }}>
          Genius Enterprises
        </div>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.15)',
          borderTop: '3px solid #D12020',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Loading your portal…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<PortalRedirect />} />
        <Route path="/portal/login" element={<Login />} />
        <Route path="/portal/signup" element={<ClientSignup />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRole />} />
          <Route
            path="platform"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <MasterAdmin />
              </RequireAuth>
            }
          />
          <Route path="master" element={<Navigate to="/app/platform" replace />} />
          <Route
            path="users"
            element={
              <RequireAuth allowedRoles={['admin', 'branch_manager']}>
                <AdminUsers />
              </RequireAuth>
            }
          />
          <Route
            path="clients"
            element={
              <RequireAuth allowedRoles={['admin', 'branch_manager', 'arm', 'rm', 'advisor', 'sub_broker', 'employee']}>
                <ClientsList />
              </RequireAuth>
            }
          />
          <Route
            path="portfolio"
            element={
              <RequireAuth allowedRoles={['admin', 'branch_manager', 'arm', 'rm', 'advisor', 'employee', 'client']}>
                <DashboardRole />
              </RequireAuth>
            }
          />
          <Route path="reports" element={<ClientReports />} />
          <Route path="profile" element={<ClientProfile />} />
          <Route path="compare" element={<Compare />} />
          <Route path="market" element={<Market />} />
        </Route>

        <Route path="*" element={<PortalRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

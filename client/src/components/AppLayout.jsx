/** (developed by @neelotpal.dey) **/
import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGaugeHigh,
  faUsers,
  faUserGroup,
  faScaleBalanced,
  faFileLines,
  faUser,
  faRightFromBracket,
  faChevronDown,
  faBars,
  faXmark,
  faGripLines,
  faChevronLeft,
  faChevronRight,
  faShieldHalved,
  faUserShield
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore } from '../store/auth'
import { initials } from '../utils/format'
import api from '../api'
import MarketTicker from './MarketTicker'

const DRAWER_BREAKPOINT = 1200

function isDrawerViewport() {
  return typeof window !== 'undefined' && window.innerWidth < DRAWER_BREAKPOINT
}

const roleLinks = {
  admin: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/platform', label: 'Platform Controls', icon: faShieldHalved },
    { to: '/app/users', label: 'Manage Users', icon: faUsers },
    { to: '/app/clients', label: 'Clients & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  branch_manager: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/users', label: 'Team & Staff', icon: faUsers },
    { to: '/app/clients', label: 'Clients & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  arm: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/clients', label: 'Clients & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  rm: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/clients', label: 'Clients & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  advisor: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/clients', label: 'Advisees & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  sub_broker: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/clients', label: 'My Clients & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  employee: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/clients', label: 'Clients & Customers', icon: faUserGroup },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced }
  ],
  client: [
    { to: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
    { to: '/app/reports', label: 'Reports', icon: faFileLines },
    { to: '/app/compare', label: 'Compare Market', icon: faScaleBalanced },
    { to: '/app/profile', label: 'Profile', icon: faUser }
  ]
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(() => !isDrawerViewport())
  const [ddOpen, setDdOpen] = useState(false)
  const ddRef = useRef(null)
  const lastWidth = useRef(typeof window !== 'undefined' ? window.innerWidth : DRAWER_BREAKPOINT)

  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      const wasDrawer = lastWidth.current < DRAWER_BREAKPOINT
      const nowDrawer = w < DRAWER_BREAKPOINT
      lastWidth.current = w
      if (wasDrawer === nowDrawer) return
      setSidebarOpen(!nowDrawer)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isDrawerViewport()) setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const open = sidebarOpen && isDrawerViewport()
    document.documentElement.classList.toggle('ge-drawer-open', open)
    document.body.classList.toggle('ge-drawer-open', open)
    return () => {
      document.documentElement.classList.remove('ge-drawer-open')
      document.body.classList.remove('ge-drawer-open')
    }
  }, [sidebarOpen])

  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setDdOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) { }
    logout()
    navigate('/portal/login')
  }

  const links = roleLinks[user?.role] || roleLinks.client

  const closeSidebarMobile = () => {
    if (isDrawerViewport()) setSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open)
  }

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      {sidebarOpen && (
        <div
          className="backdrop"
          onClick={closeSidebarMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">GE</div>
          <div className="sidebar-brand-text">
            Genius<small>ENTERPRISES PORTAL</small>
          </div>
          <button
            type="button"
            className="sidebar-toggle-btn hide-mobile"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Hide side panel' : 'Unhide side panel'}
            aria-label={sidebarOpen ? 'Hide side panel' : 'Unhide side panel'}
          >
            <span className="three-line">
              <i></i><i></i><i></i>
            </span>
          </button>
          <button
            type="button"
            className="sidebar-close-btn show-mobile"
            onClick={closeSidebarMobile}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className="nav-links">
          {links.map((l, i) => (
            <NavLink
              key={i}
              to={l.to}
              end={l.to === '/app/dashboard'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={closeSidebarMobile}
            >
              <FontAwesomeIcon icon={l.icon} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          &copy; 2026 Genius Enterprises
        </div>
      </aside>

      {/* Desktop-only floating unhide button when sidebar is collapsed */}
      <button
        type="button"
        className="sidebar-unhide-fab hide-mobile"
        onClick={() => setSidebarOpen(true)}
        title="Unhide side panel"
        aria-label="Unhide side panel"
        style={{ display: sidebarOpen ? 'none' : 'inline-flex' }}
      >
        <span className="three-line light">
          <i></i><i></i><i></i>
        </span>
      </button>

      <div className="main-wrapper">
        <header className="header-bar">
          <button
            type="button"
            className="hamburger"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
          </button>

          <MarketTicker />

          <div className="header-right">
            <div className="user-dropdown" ref={ddRef}>
              <div
                className="user-dd-trigger"
                onClick={() => setDdOpen(!ddOpen)}
              >
                <div className="avatar avatar-sm">
                  {initials(user?.name)}
                </div>
                <div>
                  <div className="user-dd-name">{user?.name}</div>
                  <div className="user-dd-role">{user?.role}</div>
                </div>
                <FontAwesomeIcon icon={faChevronDown} size="xs" style={{ color: '#888' }} />
              </div>

              {ddOpen && (
                <div className="user-dd-menu">
                  <div className="dd-head">
                    <div className="dd-head-name">{user?.name}</div>
                    <div className="dd-head-email">{user?.email}</div>
                  </div>
                  <Link
                    to="/app/profile"
                    className="dd-item"
                    onClick={() => setDdOpen(false)}
                  >
                    <FontAwesomeIcon icon={faUser} /> Profile
                  </Link>
                  <div className="dd-item danger" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

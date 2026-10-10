/** (developed by @neelotpal.dey) **/
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function RequireAuth({ allowedRoles, children }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/portal/login" replace state={{ from: location }} />
  }

  if (user.role === 'admin') {
    return children
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}

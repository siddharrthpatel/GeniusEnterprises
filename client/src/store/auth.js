import { create } from 'zustand'
import api from '../api'

const LOCAL_USERS_KEY = 'ge_local_users'

export const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)) || {}
  } catch {
    return {}
  }
}

export const saveLocalUser = (user) => {
  const all = getLocalUsers()
  all[user.email.toLowerCase()] = { ...user, password: user.password || undefined }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(all))
}

export const findLocalUser = (email, password) => {
  const all = getLocalUsers()
  const u = all[email.toLowerCase()]
  if (!u) return null
  if (password && u.password && u.password !== password) return null
  const { password: _p, ...rest } = u
  return rest
}

const safeGetDemoUser = () => {
  try {
    const raw = localStorage.getItem('demo_user')
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const useAuthStore = create((set, get) => ({
  user: safeGetDemoUser(),
  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem('demo_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('demo_user')
      }
    } catch {}
    set({ user: user || null })
  },
  logout: () => {
    try {
      localStorage.removeItem('demo_user')
    } catch {}
    set({ user: null })
  },
  isAuthenticated: () => !!get().user,
  isLocalUser: () => {
    const u = get().user
    return !!(u && (u.authSource === 'local' || String(u.id || '').startsWith('local-')))
  },
  loadMe: async () => {
    const user = safeGetDemoUser()
    set({ user })
    return user
  }
}))

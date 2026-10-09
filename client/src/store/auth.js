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

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('demo_user')) || null,
  setUser: (user) => {
    localStorage.setItem('demo_user', JSON.stringify(user))
    set({ user })
  },
  logout: () => {
    localStorage.removeItem('demo_user')
    set({ user: null })
  },
  isAuthenticated: () => !!get().user,
  isLocalUser: () => {
    const u = get().user
    return !!(u && (u.authSource === 'local' || String(u.id || '').startsWith('local-')))
  },
  loadMe: async () => {
    const user = JSON.parse(localStorage.getItem('demo_user'))
    if (user) set({ user })
    return user
  }
}))

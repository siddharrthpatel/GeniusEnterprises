/** (developed by @neelotpal.dey) **/
import axios from 'axios'
import { useAuthStore } from '../store/auth'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (typeof window !== 'undefined') {
    const port = window.location.port
    const host = window.location.hostname || 'localhost'
    if (port === '5173') {
      return `http://${host}:5000/api`
    }
  }
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ge_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore.getState()
      if (!authStore.isLocalUser()) {
        authStore.logout()
      }
    }
    return Promise.reject(error)
  }
)

export default api

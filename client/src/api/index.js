import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: '/api',
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

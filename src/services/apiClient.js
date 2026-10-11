import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aenko_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let redirecting = false

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''
    const isAuthCall = url.includes('/api/auth/')
    // 401: session invalid/expired -> clear and send to login (except auth calls themselves)
    if (status === 401 && !isAuthCall && !redirecting) {
      localStorage.removeItem('aenko_token')
      localStorage.removeItem('aenko_user')
      redirecting = true
      if (window.location.pathname !== '/login') {
        window.location.assign('/login?expired=1')
      }
      setTimeout(() => { redirecting = false }, 2000)
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') return 'Request timed out. Please retry.'
    return 'Cannot reach the AENKO backend. Is it running at ' + baseURL + '?'
  }
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0]
    if (first) return String(first)
  }
  if (data?.message) return String(data.message)
  if (typeof data === 'string' && data.length < 300) return data
  const status = error.response.status
  if (status === 401) return 'Your session expired. Please log in again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 404) return 'Not found.'
  if (status === 409) return 'That already exists.'
  if (status === 502) return 'Anime provider is unavailable. Please try again later.'
  return fallback
}

export function isProviderConfigError(error) {
  return error?.response?.status === 502
}

export { baseURL }
export default apiClient

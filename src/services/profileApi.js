import apiClient from './apiClient.js'

// GET /api/profile -> {user, stats}
// GET /api/profile/stats -> StatsDto
// GET /api/activity -> Spring Page<ActivityDto>
// GET+POST /api/ai/insight -> {type, content, personalized}
// GET /api/franchises, /api/franchises/{id}, /api/franchises/{id}/watch-order

export async function fetchProfile() {
  const { data } = await apiClient.get('/api/profile')
  return data
}

export async function fetchStats() {
  const { data } = await apiClient.get('/api/profile/stats')
  return data
}

export async function fetchActivity(page = 0, size = 20) {
  const { data } = await apiClient.get('/api/activity', { params: { page, size } })
  return data
}

export async function fetchInsight() {
  const { data } = await apiClient.get('/api/ai/insight')
  return data
}

export async function refreshInsight() {
  const { data } = await apiClient.post('/api/ai/insight')
  return data
}

export async function listFranchises() {
  const { data } = await apiClient.get('/api/franchises')
  return data
}

export async function franchiseDetail(id) {
  const { data } = await apiClient.get(`/api/franchises/${id}`)
  return data
}

export async function franchiseWatchOrders(id) {
  const { data } = await apiClient.get(`/api/franchises/${id}/watch-order`)
  return data
}

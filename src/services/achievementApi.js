import apiClient from './apiClient.js'

// GET /api/achievements -> all (unlocked flags when logged in)
// GET /api/achievements/my -> unlocked only
export async function listAchievements() {
  const { data } = await apiClient.get('/api/achievements')
  return data
}

export async function myAchievements() {
  const { data } = await apiClient.get('/api/achievements/my')
  return data
}

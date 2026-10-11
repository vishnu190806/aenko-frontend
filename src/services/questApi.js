import apiClient from './apiClient.js'

// GET  /api/quests -> [QuestDto]
// GET  /api/quests/my -> started quests + progress
// POST /api/quests/{id}/start
// POST /api/quests/{id}/complete (backend-verified, awards XP)
export async function listQuests() {
  const { data } = await apiClient.get('/api/quests')
  return data
}

export async function myQuests() {
  const { data } = await apiClient.get('/api/quests/my')
  return data
}

export async function startQuest(id) {
  const { data } = await apiClient.post(`/api/quests/${id}/start`)
  return data
}

export async function completeQuest(id) {
  const { data } = await apiClient.post(`/api/quests/${id}/complete`)
  return data
}

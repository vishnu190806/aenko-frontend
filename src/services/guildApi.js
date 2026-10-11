import apiClient from './apiClient.js'

// POST /api/guilds {name,tag,description,privacy}
// GET  /api/guilds -> public list
// GET  /api/guilds/{id}
// POST /api/guilds/{id}/join | POST /api/guilds/{id}/leave
// GET  /api/guilds/{id}/members -> [{userId,username,role,joinedAt}]
// GET  /api/guilds/{id}/leaderboard -> [{userId,username,xp}]
// GET  /api/guilds/{id}/quests | POST /api/guilds/{id}/quests {name,description,targetValue,xpReward}
export async function listGuilds() {
  const { data } = await apiClient.get('/api/guilds')
  return data
}

export async function guildDetail(id) {
  const { data } = await apiClient.get(`/api/guilds/${id}`)
  return data
}

export async function createGuild(payload) {
  const { data } = await apiClient.post('/api/guilds', payload)
  return data
}

export async function joinGuild(id) {
  await apiClient.post(`/api/guilds/${id}/join`)
}

export async function leaveGuild(id) {
  await apiClient.post(`/api/guilds/${id}/leave`)
}

export async function guildMembers(id) {
  const { data } = await apiClient.get(`/api/guilds/${id}/members`)
  return data
}

export async function guildLeaderboard(id) {
  const { data } = await apiClient.get(`/api/guilds/${id}/leaderboard`)
  return data
}

export async function guildQuests(id) {
  const { data } = await apiClient.get(`/api/guilds/${id}/quests`)
  return data
}

export async function createGuildQuest(id, payload) {
  const { data } = await apiClient.post(`/api/guilds/${id}/quests`, payload)
  return data
}

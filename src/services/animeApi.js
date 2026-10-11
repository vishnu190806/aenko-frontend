import apiClient from './apiClient.js'

// GET /api/anime/search?q=&page=&size= -> {content,page,size,hasNext}
// GET /api/anime/ranking?type=&page=&size=
// GET /api/anime/{externalId} -> AnimeDto
// GET /api/anime/{externalId}/relations -> [{anime, relationType}]
export async function searchAnime(q, page = 0, size = 12) {
  const { data } = await apiClient.get('/api/anime/search', { params: { q, page, size } })
  return data
}

export async function rankingAnime(type = 'all', page = 0, size = 12) {
  const { data } = await apiClient.get('/api/anime/ranking', { params: { type, page, size } })
  return data
}

export async function animeDetail(externalId) {
  const { data } = await apiClient.get(`/api/anime/${encodeURIComponent(externalId)}`)
  return data
}

export async function animeRelations(externalId) {
  const { data } = await apiClient.get(`/api/anime/${encodeURIComponent(externalId)}/relations`)
  return data
}

// Provider search results carry id=null + externalId=MAL id + provider="MAL".
// Library endpoints need the INTERNAL mediaId, so adding from discovery must
// send {provider, externalId} and let the backend import.
export function externalKey(anime) {
  if (!anime) return null
  if (anime.externalId) return String(anime.externalId)
  return null
}

export function libraryAddPayload(anime, extra = {}) {
  if (anime?.id != null) return { mediaId: anime.id, ...extra }
  return { provider: anime?.provider || 'MAL', externalId: String(anime?.externalId ?? ''), ...extra }
}

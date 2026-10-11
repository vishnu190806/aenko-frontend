import apiClient from './apiClient.js'

// POST   /api/progress/{mediaId}/episode/{n} -> ProgressResponse
// GET    /api/progress/{mediaId} -> ProgressResponse {mediaId,watchedEpisodes,totalEpisodes,episodes[]}
// DELETE /api/progress/{mediaId}/episode/{n}
export async function fetchProgress(mediaId) {
  const { data } = await apiClient.get(`/api/progress/${mediaId}`)
  return data
}

export async function markEpisodeWatched(mediaId, episodeNumber) {
  const { data } = await apiClient.post(`/api/progress/${mediaId}/episode/${episodeNumber}`)
  return data
}

export async function unmarkEpisode(mediaId, episodeNumber) {
  await apiClient.delete(`/api/progress/${mediaId}/episode/${episodeNumber}`)
}

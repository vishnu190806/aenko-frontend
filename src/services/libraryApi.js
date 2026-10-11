import apiClient from './apiClient.js'

// GET  /api/library?status=&page=&size= -> Spring Page<LibraryResponse>
// POST /api/library {mediaId|provider+externalId, status, rating, notes}
// PUT  /api/library/{mediaId} {status, rating, notes}
// DELETE /api/library/{mediaId}
export const LIBRARY_STATUSES = ['PLANNED', 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED']

export async function listLibrary({ status, page = 0, size = 20 } = {}) {
  const params = { page, size }
  if (status) params.status = status
  const { data } = await apiClient.get('/api/library', { params })
  return data
}

export async function addToLibrary(payload) {
  const { data } = await apiClient.post('/api/library', payload)
  return data
}

export async function updateLibraryEntry(mediaId, payload) {
  const { data } = await apiClient.put(`/api/library/${mediaId}`, payload)
  return data
}

export async function removeLibraryEntry(mediaId) {
  await apiClient.delete(`/api/library/${mediaId}`)
}

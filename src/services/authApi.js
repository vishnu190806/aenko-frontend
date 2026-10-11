import apiClient from './apiClient.js'

// POST /api/auth/register {username,email,password} -> 201 {token, user}
// POST /api/auth/login {email,password} -> 200 {token, user}
// GET  /api/auth/me -> UserDto {id,username,email,role,createdAt}
export async function register(payload) {
  const { data } = await apiClient.post('/api/auth/register', payload)
  return data
}

export async function login(payload) {
  const { data } = await apiClient.post('/api/auth/login', payload)
  return data
}

export async function fetchMe() {
  const { data } = await apiClient.get('/api/auth/me')
  return data
}

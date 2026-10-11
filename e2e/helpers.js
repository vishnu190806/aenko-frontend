import { expect } from '@playwright/test'

let counter = 0

export function uniqueUser(prefix = 'e2e') {
  counter += 1
  const stamp = `${Date.now()}${counter}`
  return {
    username: `${prefix}${stamp}`.slice(0, 20),
    email: `${prefix}-${stamp}@example.com`,
    password: 'password123',
  }
}

export async function registerViaApi(request, user) {
  const res = await request.post('http://localhost:8080/api/auth/register', { data: user })
  expect([200, 201], `register ${user.email}`).toContain(res.status())
  return res.json()
}

export async function loginViaUi(page, user) {
  // Drop any previous session first: an authenticated visit to /login
  // redirects to the dashboard instead of rendering the form.
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
}

export function navLink(page, name) {
  // Sidebar navigation only: dashboard cards may link to the same pages.
  return page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name })
}

export async function seedSession(page, session) {
  await page.goto('/login')
  await page.evaluate(
    ({ token, u }) => {
      localStorage.setItem('aenko_token', token)
      localStorage.setItem('aenko_user', JSON.stringify(u))
    },
    { token: session.token, u: session.user },
  )
}

export async function apiAuthed(request, token, method, path, data) {
  const res = await request.fetch(`http://localhost:8080${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
  return res
}

export function collectPageProblems(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  return errors
}

export function expectNoCriticalProblems(errors, allowed = []) {
  const ignored = ['favicon', 'Failed to load resource', ...allowed]
  const critical = errors.filter((e) => !ignored.some((a) => e.includes(a)))
  expect(critical, 'unexpected browser errors').toEqual([])
}

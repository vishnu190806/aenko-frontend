import { expect, test } from '@playwright/test'
import {
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  uniqueUser,
} from './helpers.js'

test.describe('registration, authentication and routing', () => {
  test('register validation blocks bad input before any network call', async ({ page }) => {
    const problems = collectPageProblems(page)
    let registerCalls = 0
    await page.route('**/api/auth/register', (route) => {
      registerCalls += 1
      route.continue()
    })
    await page.goto('/register')
    // Too-short username: native minLength validation blocks submit,
    // so the app must stay put and never call the API.
    await page.getByLabel('Username').fill('ab')
    await page.getByLabel('Email').fill('x@y.z')
    await page.getByLabel('Password').fill('12345')
    await page.getByRole('button', { name: 'Register' }).click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/register/)
    expect(registerCalls).toBe(0)
    // Valid input submits normally (covered end-to-end by the journey test).
    expectNoCriticalProblems(problems)
  })

  test('duplicate email is rejected', async ({ page, request }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('dup')
    await registerViaApi(request, user)
    await page.goto('/register')
    await page.getByLabel('Username').fill(`other${Date.now() % 100000}`)
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByRole('alert')).not.toBeEmpty()
    expectNoCriticalProblems(problems)
  })

  test('register → dashboard → reload keeps session → logout clears it', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('journey')
    await page.goto('/register')
    await page.getByLabel('Username').fill(user.username)
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText(`Welcome back, ${user.username}`, { exact: false })).toBeVisible()

    await page.reload()
    await expect(page.getByText(`Welcome back, ${user.username}`, { exact: false })).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/login/)
    expectNoCriticalProblems(problems)
  })

  test('protected route redirects logged-out visitors to login', async ({ page }) => {
    const problems = collectPageProblems(page)
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login/)
    expectNoCriticalProblems(problems)
  })

  test('invalid JWT settles on login without redirect loops', async ({ page }) => {
    const problems = collectPageProblems(page)
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('aenko_token', 'bogus.invalid.token')
      localStorage.setItem('aenko_user', JSON.stringify({ username: 'ghost' }))
    })
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/login/)
    const token = await page.evaluate(() => localStorage.getItem('aenko_token'))
    expect(token).toBeNull()
    expectNoCriticalProblems(problems)
  })

  test('login sends the session and protected APIs carry the auth header', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('hdr')
    const created = await registerViaApi(page.request, user)
    expect(created.token).toBeTruthy()

    const authed = page.waitForRequest(
      (req) => req.url().includes('/api/library') && (req.headers().authorization || '').startsWith('Bearer '),
      { timeout: 15000 },
    )
    await loginViaUi(page, user)
    await navLink(page, 'My Library').click()
    await authed
    expectNoCriticalProblems(problems)
  })
})



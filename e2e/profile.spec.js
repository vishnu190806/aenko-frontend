import { expect, test } from '@playwright/test'
import {
  apiAuthed,
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  uniqueUser,
} from './helpers.js'

test.describe('profile, activity, achievements and dashboard', () => {
  test('new account shows honest empty states', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('fresh')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)

    await navLink(page, 'My Library').click()
    await expect(page.getByText('Your library is empty')).toBeVisible({ timeout: 15000 })

    await navLink(page, 'AnimeVerse Profile').click()
    await expect(page.getByText('No genre stats')).toBeVisible({ timeout: 15000 })

    await navLink(page, 'Activity').click()
    // Registration itself is logged, so a new account sees its REGISTERED entry.
    await expect(page.getByText('REGISTERED')).toBeVisible({ timeout: 15000 })
    expectNoCriticalProblems(problems)
  })

  test('dashboard statistics match backend responses', async ({ page, request }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('stats')
    const session = await registerViaApi(request, user)
    await loginViaUi(page, user)

    const statsRes = await apiAuthed(request, session.token, 'GET', '/api/profile/stats')
    expect(statsRes.status()).toBe(200)
    const stats = await statsRes.json()

    await page.goto('/')
    const xpLabel = page.locator('.stat', { hasText: 'Total XP' }).locator('.value')
    await expect(xpLabel).toHaveText(String(stats.totalXp), { timeout: 15000 })
    await expect(page.locator('.stat', { hasText: 'Level' }).locator('.value')).toHaveText(String(stats.level))
    await expect(page.getByText(`Level ${stats.level} · ${stats.totalXp} XP`)).toBeVisible()
    expectNoCriticalProblems(problems)
  })

  test('achievements unlock after episode progress and profile reflects it', async ({ page, request }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('achv')
    const session = await registerViaApi(request, user)

    const fr = await apiAuthed(request, session.token, 'GET', '/api/franchises')
    const naruto = (await fr.json()).find((f) => f.name === 'Naruto')
    const mediaId = naruto.media.find((m) => m.externalId === '20').mediaId
    await apiAuthed(request, session.token, 'POST', '/api/library', { mediaId, status: 'WATCHING' })
    await apiAuthed(request, session.token, 'POST', `/api/progress/${mediaId}/episode/1`)

    await loginViaUi(page, user)
    await navLink(page, 'Achievements').click()
    await expect(page.getByRole('heading', { name: 'First Episode' })).toBeVisible({ timeout: 15000 })
    const unlocked = page.locator('.badge-card:not(.locked)', { hasText: 'First Episode' })
    await expect(unlocked).toBeVisible()

    await navLink(page, 'Activity').click()
    await expect(page.locator('.list-item').first()).toBeVisible({ timeout: 15000 })
    expectNoCriticalProblems(problems)
  })
})



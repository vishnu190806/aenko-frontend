import { expect, test } from '@playwright/test'
import {
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  uniqueUser,
} from './helpers.js'

// Live-MAL specs: require backend MAL_CLIENT_ID. They exercise the real
// provider integration; the no-credential failure paths are covered by
// backend unit tests plus the earlier verified UI run (see report).

test.describe('MAL-powered discovery (live)', () => {
  test('search finds real anime with artwork and metadata', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('live')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await navLink(page, 'Discover Anime').click()
    await page.getByLabel('Anime title').fill('Bleach')
    await page.getByRole('button', { name: 'Search' }).click()
    const card = page.locator('.anime-card', { hasText: 'Bleach' }).first()
    await expect(card).toBeVisible({ timeout: 30000 })
    await expect(card.locator('img')).toBeVisible()
    await expect(page.locator('.anime-card')).not.toHaveCount(0)
    expectNoCriticalProblems(problems)
  })

  test('detail page renders real metadata and artwork', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('livedet')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await page.goto('/anime/269')
    await expect(page.getByRole('heading', { name: 'Bleach' })).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.detail-hero img')).toBeVisible()
    await expect(page.getByText(/episodes/i).first()).toBeVisible()
    expectNoCriticalProblems(problems)
  })

  test('add to library from detail, appears in library, then removed', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('livelib')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await page.goto('/anime/269')
    await expect(page.getByRole('heading', { name: 'Bleach' })).toBeVisible({ timeout: 30000 })
    await page.getByRole('button', { name: '+ Plan to Watch' }).click()
    await expect(page.getByText(/added to your library/i)).toBeVisible({ timeout: 15000 })

    await navLink(page, 'My Library').click()
    await expect(page.getByRole('heading', { name: 'Bleach' })).toBeVisible({ timeout: 15000 })

    page.on('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Remove' }).click()
    await expect(page.getByText('Your library is empty')).toBeVisible({ timeout: 15000 })
    expectNoCriticalProblems(problems)
  })

  test('gibberish search shows an honest empty state', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('liveempty')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await navLink(page, 'Discover Anime').click()
    await page.getByLabel('Anime title').fill('zzzqqqnonexistenttitle')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No anime found')).toBeVisible({ timeout: 30000 })
    expectNoCriticalProblems(problems)
  })
})

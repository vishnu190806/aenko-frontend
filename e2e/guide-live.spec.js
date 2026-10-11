import { expect, test } from '@playwright/test'
import {
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  uniqueUser,
} from './helpers.js'

// Live-MAL guide specs: real related-anime navigation plus curated matching.

test.describe('anime guide with live MAL relationships', () => {
  test('Naruto guide shows real relations and its curated match', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('gnaruto')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await navLink(page, 'Anime Guide').click()
    await expect(page.getByRole('heading', { name: /anime guide/i })).toBeVisible()

    await page.getByPlaceholder('Search anime by title…').fill('Naruto')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.locator('.anime-card', { hasText: 'Naruto' }).first()
      .getByRole('button', { name: 'Open guide' }).click()

    // Selected anime detail + live MAL relationships.
    await expect(page.getByRole('heading', { name: 'Related Anime' })).toBeVisible({ timeout: 30000 })
    const sequel = page.locator('.anime-card', { hasText: 'Naruto: Shippuuden' })
    await expect(sequel).toBeVisible({ timeout: 30000 })
    await expect(sequel.getByText('Sequel', { exact: true })).toBeVisible()

    // Curated match by external id: Naruto banner + auto-selected order.
    await expect(page.getByText(/belongs to the curated guide/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Naruto: Shippuuden', { exact: true }).first()).toBeVisible()

    // Explore the related title, then go back.
    await sequel.getByRole('button', { name: /explore/i }).click()
    await expect(page.getByText(/belongs to the curated guide/)).toBeVisible({ timeout: 30000 })
    await page.getByRole('button', { name: /back/i }).click()
    await expect(sequel).toBeVisible({ timeout: 30000 })

    // Select-different-anime resets to search.
    await page.getByRole('button', { name: 'Select different anime' }).click()
    await expect(page.getByPlaceholder('Search anime by title…')).toBeVisible()
    expectNoCriticalProblems(problems)
  })

  test('Bleach guide renders relations with honest no-curated-match state', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('gbleach')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await navLink(page, 'Anime Guide').click()

    await page.getByPlaceholder('Search anime by title…').fill('Bleach')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.locator('.anime-card', { hasText: 'Bleach' }).first()
      .getByRole('button', { name: 'Open guide' }).click()

    await expect(page.getByRole('heading', { name: 'Related Anime' })).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.grid.cards .anime-card').first()).toBeVisible({ timeout: 30000 })

    // No curated franchise contains Bleach: honest per-title note,
    // catalogue stays browsable.
    await expect(page.getByText(/no curated order for/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByLabel('Select franchise')).toBeVisible()
    expectNoCriticalProblems(problems)
  })
})

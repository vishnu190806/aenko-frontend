import { expect, test } from '@playwright/test'
import {
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  uniqueUser,
} from './helpers.js'

test.describe('anime guide: curated catalogue and honest states', () => {
  test('catalogue renders both verified guides, no Example Saga', async ({ page }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('guide')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)
    await navLink(page, 'Anime Guide').click()
    await expect(page.getByRole('heading', { name: /anime guide/i })).toBeVisible()

    // No fictional content anywhere on the page.
    await expect(page.getByText('Example Saga')).toHaveCount(0)

    // Both curated franchises selectable with verified ordering.
    const select = page.getByLabel('Select franchise')
    await expect(select).toBeVisible({ timeout: 15000 })
    await expect(select.locator('option')).toHaveCount(2)
    await expect(select).toContainText('Naruto')
    await expect(select).toContainText('Steins;Gate')

    await expect(page.getByText('Main Series — Release Order')).toBeVisible()
    const stepOne = page.locator('.step-num', { hasText: '1' }).first()
    const stepTwo = page.locator('.step-num', { hasText: '2' }).first()
    await expect(stepOne).toBeVisible()
    await expect(stepTwo).toBeVisible()
    await expect(page.getByText('Naruto: Shippuuden', { exact: true })).toBeVisible()
    await expect(page.getByText('Original TV series: 220 episodes')).toBeVisible()

    // MAL links use external ids, and steps are labelled required/optional.
    const malLink = page.getByRole('link', { name: 'MAL page' }).first()
    await expect(malLink).toHaveAttribute('href', 'https://myanimelist.net/anime/20')
    await expect(page.getByText('Required', { exact: true }).first()).toBeVisible()

    // Switch franchise: Steins;Gate steps with the verified continuation.
    await select.selectOption({ label: 'Steins;Gate' })
    await expect(page.getByText('Steins;Gate 0', { exact: true })).toBeVisible({ timeout: 15000 })
    const sgLink = page.getByRole('link', { name: 'MAL page' }).last()
    await expect(sgLink).toHaveAttribute('href', 'https://myanimelist.net/anime/30484')
    expectNoCriticalProblems(problems)
  })
})





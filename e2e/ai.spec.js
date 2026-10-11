import { expect, test } from '@playwright/test'
import {
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  uniqueUser,
} from './helpers.js'

async function dashboardXp(page) {
  await page.goto('/')
  const label = page.locator('.stat', { hasText: 'Total XP' }).locator('.value')
  await expect(label).toBeVisible({ timeout: 15000 })
  return Number(await label.innerText())
}

test.describe('AI anime intelligence with live Ollama', () => {
  test('generates a labelled personalized insight without touching XP', async ({ page }) => {
    // Cold local models can exceed the backend's 30s read timeout on the
    // first call; allow a warm-up generation plus a live one.
    test.setTimeout(300000)
    const problems = collectPageProblems(page)
    const user = uniqueUser('ai')
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)

    const xpBefore = await dashboardXp(page)
    await navLink(page, 'AI Insight').click()
    await expect(page.getByRole('heading', { name: /ai anime intelligence/i })).toBeVisible()

    async function tryGenerate(timeoutMs) {
      await page.getByRole('button', { name: /generate new insight/i }).click()
      return page.getByText('AI-generated').waitFor({ timeout: timeoutMs }).then(
        () => true,
        () => false,
      )
    }

    let live = await tryGenerate(90000)
    if (!live) {
      // A fallback here must be honestly labelled, then a warmed retry must go live.
      await expect(page.getByText('Local fallback')).toBeVisible({ timeout: 15000 })
      live = await tryGenerate(180000)
    }
    expect(live, 'live model responded after warm-up').toBe(true)

    const body = page.locator('.card p').first()
    await expect(body).not.toBeEmpty({ timeout: 15000 })

    // Generating insights must never change XP.
    expect(await dashboardXp(page)).toBe(xpBefore)
    expectNoCriticalProblems(problems)
  })
})

import { expect, test } from '@playwright/test'
import { collectPageProblems, loginViaUi, navLink, registerViaApi, uniqueUser } from './helpers.js'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const vp of VIEWPORTS) {
  test(`responsive layout holds at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    const problems = collectPageProblems(page)
    await page.setViewportSize({ width: vp.width, height: vp.height })
    const user = uniqueUser(`rx${vp.name}`)
    await registerViaApi(page.request, user)
    await loginViaUi(page, user)

    for (const route of ['/', '/guide', '/quests', '/guilds', '/profile']) {
      await page.goto(route)
      await page.locator('.content').first().waitFor({ timeout: 15000 })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `horizontal overflow on ${route} at ${vp.name}`).toBeLessThanOrEqual(1)
    }

    if (vp.width < 900) {
      // Mobile navigation collapses behind the menu button.
      await expect(page.getByRole('button', { name: 'Toggle navigation' })).toBeVisible()
    } else {
      await expect(navLink(page, 'Anime Guide')).toBeVisible()
    }

    // Keyboard focus must be visible on interactive controls.
    await page.goto('/quests')
    await page.getByRole('button', { name: 'Available' }).focus()
    await expect(page.getByRole('button', { name: 'Available' })).toBeFocused()

    // Every icon-only button keeps an accessible name.
    const unnamed = await page.locator('button:not([aria-label]):empty').count()
    expect(unnamed).toBe(0)

    const consoleErrors = problems.filter((e) => !e.includes('favicon'))
    expect(consoleErrors).toEqual([])
  })
}



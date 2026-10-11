import { expect, test } from '@playwright/test'
import {
  apiAuthed,
  collectPageProblems,
  expectNoCriticalProblems,
  loginViaUi,
  navLink,
  registerViaApi,
  seedSession,
  uniqueUser,
} from './helpers.js'

async function narutoMediaId(request, token) {
  const res = await apiAuthed(request, token, 'GET', '/api/franchises')
  expect(res.status()).toBe(200)
  const franchises = await res.json()
  const naruto = franchises.find((f) => f.name === 'Naruto')
  expect(naruto, 'Naruto curated franchise exists').toBeTruthy()
  const media = naruto.media.find((m) => m.externalId === '20')
  expect(media, 'Naruto MAL 20 linked with external id, not internal guess').toBeTruthy()
  return media.mediaId
}

async function dashboardXp(page) {
  await page.goto('/')
  const label = page.locator('.stat', { hasText: 'Total XP' }).locator('.value')
  await expect(label).toBeVisible({ timeout: 15000 })
  return Number(await label.innerText())
}

test.describe('library, progress, XP and quests', () => {
  test('episode tracking awards XP, persists, and never double-pays', async ({ page, request }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('xp')
    const session = await registerViaApi(request, user)

    const mediaId = await narutoMediaId(request, session.token)
    const add = await apiAuthed(request, session.token, 'POST', '/api/library', { mediaId, status: 'WATCHING' })
    expect(add.status()).toBe(201)

    await seedSession(page, session)
    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'Naruto' })).toBeVisible({ timeout: 15000 })

    const xpBefore = await dashboardXp(page)
    await navLink(page, 'My Library').click()
    await page.getByRole('button', { name: 'Track episodes' }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await expect(page.getByText('1 / 220 episodes watched')).toBeVisible({ timeout: 15000 })

    // Episode (+20 XP) plus any backend-awarded first-episode achievements.
    const xpAfterFirst = await dashboardXp(page)
    expect(xpAfterFirst).toBeGreaterThanOrEqual(xpBefore + 20)

    // Refresh: progress must persist.
    await page.goto('/library')
    await page.getByRole('button', { name: 'Track episodes' }).click()
    await expect(page.getByText('1 / 220 episodes watched')).toBeVisible({ timeout: 15000 })

    // Unmarking never refunds XP and rewatching never double-pays:
    // the XP transaction row is the idempotency record and survives deletion.
    await page.getByRole('button', { name: '1', exact: true }).click()
    await expect(page.getByText('0 / 220 episodes watched')).toBeVisible({ timeout: 15000 })
    expect(await dashboardXp(page)).toBe(xpAfterFirst)
    await navLink(page, 'My Library').click()
    await page.getByRole('button', { name: 'Track episodes' }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await expect(page.getByText('1 / 220 episodes watched')).toBeVisible({ timeout: 15000 })
    expect(await dashboardXp(page)).toBe(xpAfterFirst)
    expectNoCriticalProblems(problems)
  })

  test('quest claim flow pays the configured reward exactly once', async ({ page, request }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('claim')
    const session = await registerViaApi(request, user)

    const questsRes = await apiAuthed(request, session.token, 'GET', '/api/quests')
    const animeQuest = (await questsRes.json()).find((q) => q.name === 'Complete Your First Anime')

    const mediaId = await narutoMediaId(request, session.token)
    await apiAuthed(request, session.token, 'POST', '/api/library', { mediaId, status: 'WATCHING' })

    await loginViaUi(page, user)
    await navLink(page, 'Quests').click()
    await expect(page.getByRole('heading', { name: /quests/i })).toBeVisible()
    // Library COMPLETED does not auto-complete quests, so the claim path stays available.
    await page.locator('.card', { hasText: 'Complete Your First Anime' }).getByRole('button', { name: 'Start quest' }).click()
    await expect(page.locator('.form-ok', { hasText: /started/i })).toBeVisible({ timeout: 15000 })

    // Complete the anime through the library edit UI.
    await navLink(page, 'My Library').click()
    await expect(page.getByRole('heading', { name: 'Naruto' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Edit' }).click()
    const entryCard = page.locator('.card', { hasText: 'Naruto' })
    await entryCard.getByLabel('Status').selectOption('COMPLETED')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Saved.')).toBeVisible({ timeout: 15000 })

    const xpBefore = await dashboardXp(page)
    await page.goto('/quests')
    await expect(page.getByRole('heading', { name: /quests/i })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'My quests' }).click()
    await page.locator('.card', { hasText: 'Complete Your First Anime' }).getByRole('button', { name: 'Claim completion' }).click()
    await expect(page.getByText(/backend verified/i)).toBeVisible({ timeout: 15000 })

    const xpAfter = await dashboardXp(page)
    expect(xpAfter).toBe(xpBefore + animeQuest.xpReward)

    // Repeating the claim succeeds idempotently but must not pay again.
    const dup = await apiAuthed(request, session.token, 'POST', `/api/quests/${animeQuest.id}/complete`)
    expect(dup.status()).toBe(200)
    expect(await dashboardXp(page)).toBe(xpAfter)
    expectNoCriticalProblems(problems)
  })

  test('episode quests auto-complete on reaching the target, paying once', async ({ page, request }) => {
    const problems = collectPageProblems(page)
    const user = uniqueUser('autoq')
    const session = await registerViaApi(request, user)

    const questsRes = await apiAuthed(request, session.token, 'GET', '/api/quests')
    const fiveEp = (await questsRes.json()).find((q) => q.name === 'Watch 5 Episodes')

    const mediaId = await narutoMediaId(request, session.token)
    await apiAuthed(request, session.token, 'POST', '/api/library', { mediaId, status: 'WATCHING' })

    await loginViaUi(page, user)
    await navLink(page, 'Quests').click()
    await expect(page.getByRole('heading', { name: /quests/i })).toBeVisible()
    await page.locator('.card', { hasText: 'Watch 5 Episodes' }).getByRole('button', { name: 'Start quest' }).click()
    await expect(page.locator('.form-ok', { hasText: /started/i })).toBeVisible({ timeout: 15000 })
    const xpBefore = await dashboardXp(page)

    await navLink(page, 'My Library').click()
    await expect(page.getByRole('heading', { name: 'Naruto' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Track episodes' }).click()
    for (let ep = 1; ep <= 5; ep += 1) {
      await page.getByRole('button', { name: String(ep), exact: true }).click()
      await expect(page.getByText(`${ep} / 220 episodes watched`)).toBeVisible({ timeout: 15000 })
    }

    // The backend auto-completes on the 5th episode: no claim click needed.
    await page.goto('/quests')
    await page.getByRole('button', { name: 'My quests' }).click()
    const card = page.locator('.card', { hasText: 'Watch 5 Episodes' })
    await expect(card.getByText('Completed', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(card.getByRole('button', { name: 'Claim completion' })).toHaveCount(0)

    // 5×20 episode XP + achievements + the 50 XP quest reward, each paid once.
    const xpAfter = await dashboardXp(page)
    expect(xpAfter).toBeGreaterThanOrEqual(xpBefore + 100 + fiveEp.xpReward)
    const myRes = await apiAuthed(request, session.token, 'GET', '/api/quests/my')
    const mine = await myRes.json()
    expect(mine.find((q) => q.name === 'Watch 5 Episodes').status).toBe('COMPLETED')
    expectNoCriticalProblems(problems)
  })
})



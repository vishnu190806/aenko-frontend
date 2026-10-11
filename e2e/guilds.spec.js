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

test.describe('guilds with isolated test users', () => {
  test('create → list → detail → join → leave → owner restrictions → manager-only quest', async ({
    page,
    request,
  }) => {
    const problems = collectPageProblems(page)
    const owner = uniqueUser('gowner')
    const member = uniqueUser('gmember')
    const ownerSession = await registerViaApi(request, owner)
    await registerViaApi(request, member)

    const gname = `E2E Guild ${Date.now() % 1000000}`
    await loginViaUi(page, owner)
    await navLink(page, 'Guilds').click()
    await page.getByRole('button', { name: '+ Create guild' }).click()
    await page.getByLabel('Guild name').fill(gname)
    await page.getByLabel('Tag (max 10)').fill('E2E')
    await page.getByRole('button', { name: 'Create guild', exact: true }).click()
    await expect(page.getByText('you are its OWNER', { exact: false })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: gname })).toBeVisible()

    // Detail page as owner: owner cannot leave, manager quest form visible.
    await page.getByRole('heading', { name: gname }).click()
    await expect(page.getByText('Owners cannot leave their own guild')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('You: OWNER')).toBeVisible()
    await expect(page.getByText('Create guild quest (owner/admin)')).toBeVisible()

    const guildId = page.url().match(/\/guilds\/(\d+)/)[1]
    expect(Number(guildId)).toBeGreaterThan(0)

    // Owner creates a guild quest (manager-only action).
    await page.getByLabel('Quest name').fill('E2E Guild Quest')
    await page.getByRole('button', { name: 'Create quest' }).click()
    await expect(page.getByText('Guild quest created')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('E2E Guild Quest', { exact: true })).toBeVisible()

    // Second user joins; membership and roles visible.
    await loginViaUi(page, member)
    await page.goto(`/guilds/${guildId}`)
    await expect(page.getByText('Not a member')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Join guild' }).click()
    await expect(page.getByText('You: MEMBER')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.list-item', { hasText: member.username })).toBeVisible()

    // Non-manager must not see the quest creation form…
    await expect(page.getByText('Create guild quest (owner/admin)')).toHaveCount(0)
    // …and the backend must reject a direct creation attempt.
    const memberSession = await request
      .post('http://localhost:8080/api/auth/login', { data: { email: member.email, password: member.password } })
      .then((r) => r.json())
    const forbidden = await apiAuthed(request, memberSession.token, 'POST', `/api/guilds/${guildId}/quests`, {
      name: 'Sneaky Quest',
      targetValue: 5,
      xpReward: 10,
    })
    expect([401, 403]).toContain(forbidden.status())

    // Non-owner member can leave; owner cannot.
    await page.getByRole('button', { name: 'Leave guild' }).click()
    await expect(page.getByText('Not a member')).toBeVisible({ timeout: 15000 })
    const ownerLeave = await apiAuthed(request, ownerSession.token, 'POST', `/api/guilds/${guildId}/leave`)
    expect([400, 403, 409]).toContain(ownerLeave.status())
    expectNoCriticalProblems(problems)
  })
})



import { expect, test, type Page } from '@playwright/test'
import fixture from './fixtures/github.json' with { type: 'json' }

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const LONG_REPO = 'abcdefghijklmnopqrstuvwxyz1234'

const wideFixture = {
  user: {
    login: 'wideuser',
    name: 'Wide User',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    bio: 'Long labels',
    created_at: '2018-01-01T00:00:00Z',
    public_repos: 1,
    html_url: 'https://github.com/wideuser',
  },
  repos: [
    {
      id: 1,
      name: LONG_REPO,
      full_name: `wideuser/${LONG_REPO}`,
      description: 'A very long repository name',
      language: 'TypeScript',
      stargazers_count: 12,
      forks_count: 1,
      pushed_at: '2024-06-05T15:00:00Z',
      html_url: `https://github.com/wideuser/${LONG_REPO}`,
      fork: false,
    },
  ],
  events: [
    {
      id: '1',
      type: 'PushEvent',
      created_at: '2024-06-05T15:00:00Z',
      repo: { name: `wideuser/${LONG_REPO}` },
      payload: { size: 2 },
    },
    {
      id: '2',
      type: 'PushEvent',
      created_at: '2024-06-05T16:00:00Z',
      repo: { name: `wideuser/${LONG_REPO}` },
      payload: { size: 1 },
    },
    {
      id: '3',
      type: 'WatchEvent',
      created_at: '2024-06-05T17:00:00Z',
      repo: { name: `wideuser/${LONG_REPO}` },
      payload: {},
    },
  ],
}

function wednesdayWeeks() {
  const weeks = []
  for (let week = 0; week < 53; week += 1) {
    const contributionDays = []
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const start = Date.UTC(2023, 5, 4)
      const ms = start + (week * 7 + weekday) * 24 * 60 * 60 * 1000
      const date = new Date(ms).toISOString().slice(0, 10)
      contributionDays.push({
        date,
        contributionCount: weekday === 3 ? 4 : weekday === 1 ? 1 : 0,
        weekday,
      })
    }
    weeks.push({ contributionDays })
  }
  return weeks
}

function apiPayloadFromRest(payload: typeof fixture | typeof wideFixture) {
  return {
    user: payload.user,
    repos: payload.repos,
    events: payload.events,
    contributions: {
      totalCommitContributions: 40,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 120,
        weeks: wednesdayWeeks(),
      },
    },
  }
}

async function mockRecapApi(
  page: Page,
  payload: typeof fixture | typeof wideFixture,
) {
  const login = payload.user.login

  await page.route('**/api/recap?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
      body: JSON.stringify(apiPayloadFromRest(payload)),
    })
  })
  await page.route('**/api/recap', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
      body: JSON.stringify(apiPayloadFromRest(payload)),
    })
  })

  await page.route('https://avatars.githubusercontent.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG,
    })
  })

  await page.route('https://api.github.com/**', async (route) => {
    const url = route.request().url()
    const headers = {
      'x-ratelimit-remaining': '55',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
    }

    if (url.includes('/repos')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(payload.repos),
      })
      return
    }

    if (url.includes('/events/public')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(payload.events),
      })
      return
    }

    if (url.endsWith(`/users/${login}`) || url.includes(`/users/${login}?`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(payload.user),
      })
      return
    }

    await route.fulfill({ status: 404, body: '{}' })
  })
}

async function goToSlideWithText(page: Page, text: string) {
  for (let step = 0; step < 16; step += 1) {
    if (await page.getByText(text, { exact: false }).first().isVisible()) {
      return
    }
    await page.keyboard.press('ArrowRight')
  }
  await expect(page.getByText(text).first()).toBeVisible()
}

function expectBoxInside(
  inner: { x: number; y: number; width: number; height: number } | null,
  outer: { x: number; y: number; width: number; height: number } | null,
) {
  expect(inner).toBeTruthy()
  expect(outer).toBeTruthy()
  if (!inner || !outer) return
  const pad = 1
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - pad)
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - pad)
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + pad)
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + pad)
}

test('plays a mocked recap through to the downloadable share card', async ({
  page,
  context,
}) => {
  await mockRecapApi(page, fixture)
  await page.goto('/')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.getByLabel('GitHub username').fill('octocat')
  await page.getByRole('button', { name: 'Generate recap' }).click()

  await expect(
    page.getByRole('heading', { name: /your recap is ready/i }),
  ).toBeVisible({
    timeout: 15_000,
  })

  for (let step = 0; step < 14; step += 1) {
    await page.keyboard.press('ArrowRight')
  }

  const preview = page.getByTestId('share-card-preview')
  await expect(preview.getByText('Builder')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /download image|save image/i }),
  ).toBeVisible()

  const share = page.getByRole('button', { name: /share|copy recap link/i })
  await share.click()
  await expect(page.getByRole('button', { name: /share|copy recap link/i })).toBeVisible()
  await expect(page.getByText('Link copied')).toBeVisible()
})

test.describe('long hero values', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  test('keeps Wednesday and a 30-character repo name inside the card', async ({
    page,
  }) => {
    expect(LONG_REPO).toHaveLength(30)
    await mockRecapApi(page, wideFixture)
    await page.goto('/u/wideuser')

    await expect(
      page.getByRole('heading', { name: /your recap is ready/i }),
    ).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => document.fonts.ready)

    await goToSlideWithText(page, 'You light up on')
    await expect(page.getByTestId('hero-stat-value')).toHaveText('Wednesdays')
    await expect
      .poll(async () =>
        page.getByTestId('hero-stat-value').evaluate((el) => {
          const parent = el.parentElement
          return parent ? el.scrollWidth <= parent.clientWidth + 1 : false
        }),
      )
      .toBe(true)

    expectBoxInside(
      await page.getByTestId('hero-stat-value').boundingBox(),
      await page.getByTestId('story-card').boundingBox(),
    )

    await goToSlideWithText(page, 'Most-starred repo')
    await expect(page.getByTestId('starred-repo-name')).toHaveText(LONG_REPO)
    await expect
      .poll(async () =>
        page.getByTestId('starred-repo-name').evaluate((el) => {
          const parent = el.parentElement
          return parent ? el.scrollWidth <= parent.clientWidth + 1 : false
        }),
      )
      .toBe(true)

    expectBoxInside(
      await page.getByTestId('starred-repo-name').boundingBox(),
      await page.getByTestId('story-card').boundingBox(),
    )
  })
})

async function assertMonthlyBarsInsideCard(page: Page) {
  await mockRecapApi(page, fixture)
  await page.goto('/u/octocat')
  await expect(
    page.getByRole('heading', { name: /your recap is ready/i }),
  ).toBeVisible({ timeout: 15_000 })
  await page.evaluate(() => document.fonts.ready)

  await goToSlideWithText(page, 'Your last 12 months')
  const chart = page.getByTestId('monthly-bars')
  await expect(chart).toBeVisible()
  await expect(chart.locator('.monthly-bar')).toHaveCount(12)
  await expect
    .poll(async () => {
      const box = await chart.boundingBox()
      return box && box.width > 40 && box.height > 20
    })
    .toBeTruthy()

  expectBoxInside(
    await chart.boundingBox(),
    await page.getByTestId('story-card').boundingBox(),
  )
}

test.describe('monthly bars', () => {
  test.use({
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  test('fits inside the card at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await assertMonthlyBarsInsideCard(page)
  })

  test('fits inside the card at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await assertMonthlyBarsInsideCard(page)
  })
})

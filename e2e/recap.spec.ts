import { expect, test, type Page } from '@playwright/test'
import fixture from './fixtures/github.json' with { type: 'json' }

declare global {
  interface Window {
    __REPO_RECAP_SLIDE_MOUNTS__?: Record<string, number>
  }
}

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
  await expect(chart.getByTestId('month-initial')).toHaveCount(12)
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

async function assertHeroStatsVisibleOnEverySlide(page: Page) {
  await mockRecapApi(page, fixture)
  await page.goto('/u/octocat')
  await expect(
    page.getByRole('heading', { name: /your recap is ready/i }),
  ).toBeVisible({ timeout: 15_000 })
  await page.evaluate(() => document.fonts.ready)

  for (let step = 0; step < 14; step += 1) {
    const lead = page.getByTestId('hero-stat-lead')
    if (await lead.isVisible()) {
      const card = page.getByTestId('story-card')
      expectBoxInside(await lead.boundingBox(), await card.boundingBox())
      expectBoxInside(
        await page.getByTestId('hero-stat-value').boundingBox(),
        await card.boundingBox(),
      )
      const details = page.getByTestId('hero-stat-details')
      if (await details.count()) {
        await expect(details).toBeVisible()
        expectBoxInside(await details.boundingBox(), await card.boundingBox())
      }
    }
    await page.keyboard.press('ArrowRight')
  }
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

test.describe('short card hero visibility', () => {
  test.use({
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  test('keeps lead, value and details inside the card at 1440x620', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 620 })
    await assertHeroStatsVisibleOnEverySlide(page)
  })

  test('keeps lead, value and details inside the card at 390x700', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await assertHeroStatsVisibleOnEverySlide(page)
  })
})

async function pausePlayback(page: Page) {
  const pause = page.getByRole('button', { name: 'Pause' })
  if (await pause.count()) {
    await pause.click()
  }
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
}

async function slideMountCount(page: Page, slideId: string) {
  return page.evaluate((id) => window.__REPO_RECAP_SLIDE_MOUNTS__?.[id] ?? 0, slideId)
}

async function openMockedRecap(page: Page) {
  await mockRecapApi(page, fixture)
  await page.goto('/u/octocat')
  await expect(
    page.getByRole('heading', { name: /your recap is ready/i }),
  ).toBeVisible({ timeout: 15_000 })
  await page.evaluate(() => document.fonts.ready)
  await pausePlayback(page)
}

async function assertSlideMountedOnce(page: Page, slideId: string) {
  const slide = page.getByTestId(`slide-${slideId}`)
  await expect(slide).toHaveCount(1)
  await expect(slide).toBeVisible()
  const before = await slideMountCount(page, slideId)
  expect(before).toBe(1)
  await page.waitForTimeout(3000)
  expect(await slideMountCount(page, slideId)).toBe(1)
  await expect(page.getByTestId(`slide-${slideId}`)).toHaveCount(1)
}

async function currentSlideId(page: Page) {
  return page.locator('[data-slide-id]').first().getAttribute('data-slide-id')
}

async function assertEverySlideMountedOnce(page: Page) {
  await openMockedRecap(page)

  for (let step = 0; step < 16; step += 1) {
    const summary = page.getByTestId('share-card-preview')
    if (await summary.isVisible()) break

    const slideId = await currentSlideId(page)
    expect(slideId).toBeTruthy()
    if (!slideId) break

    await assertSlideMountedOnce(page, slideId)
    await page.keyboard.press('ArrowRight')
    await Promise.race([
      page
        .waitForFunction(
          (prev) => {
            const summaryVisible = Boolean(
              document.querySelector('[data-testid="share-card-preview"]'),
            )
            if (summaryVisible) return true
            const el = document.querySelector('[data-slide-id]')
            return Boolean(el && el.getAttribute('data-slide-id') !== prev)
          },
          slideId,
          { timeout: 5_000 },
        )
        .catch(() => null),
      page
        .getByTestId('share-card-preview')
        .waitFor({ state: 'visible', timeout: 5_000 })
        .catch(() => null),
    ])
  }
}

async function waitForStableBoundingBox(
  page: Page,
  testId: string,
  settleMs = 400,
) {
  const deadline = Date.now() + 5_000
  let last: { x: number; y: number; width: number; height: number } | null =
    null
  let stableAt = 0

  while (Date.now() < deadline) {
    const box = await page.getByTestId(testId).boundingBox()
    expect(box).toBeTruthy()
    if (
      box &&
      last &&
      Math.abs(box.x - last.x) <= 1 &&
      Math.abs(box.y - last.y) <= 1 &&
      Math.abs(box.width - last.width) <= 1 &&
      Math.abs(box.height - last.height) <= 1
    ) {
      if (Date.now() - stableAt >= settleMs) return box
    } else if (box) {
      last = box
      stableAt = Date.now()
    }
    await page.waitForTimeout(50)
  }

  throw new Error(`bounding box for ${testId} did not settle`)
}

async function assertYearHeroPositionStable(page: Page) {
  await openMockedRecap(page)
  await goToSlideWithText(page, 'Your last 12 months')
  await expect(page.getByTestId('slide-year')).toHaveCount(1)
  await pausePlayback(page)
  await page.evaluate(() => document.fonts.ready)

  const value = page.getByTestId('hero-stat-value')
  await expect(value).toBeVisible()
  await waitForStableBoundingBox(page, 'hero-stat-value')

  const samples: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 20; i += 1) {
    const box = await value.boundingBox()
    expect(box).toBeTruthy()
    if (box) samples.push({ x: box.x, y: box.y })
    await page.waitForTimeout(100)
  }

  const origin = samples[0]
  expect(origin).toBeTruthy()
  for (const sample of samples) {
    expect(Math.abs(sample.x - origin!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(sample.y - origin!.y)).toBeLessThanOrEqual(1)
  }
}

test.describe('slide mount stability', () => {
  test.use({
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  test('year slide mounts once while paused at 1440x620', async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 1440, height: 620 })
    await openMockedRecap(page)
    await goToSlideWithText(page, 'Your last 12 months')
    await pausePlayback(page)
    await assertSlideMountedOnce(page, 'year')
  })

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1440, height: 620 },
    { width: 390, height: 700 },
  ] as const) {
    test(`every slide mounts once at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(180_000)
      await page.setViewportSize(viewport)
      await assertEverySlideMountedOnce(page)
    })
  }
})

test.describe('year hero position stability', () => {
  test.use({
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  test('hero value stays put at 1440x620', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 620 })
    await assertYearHeroPositionStable(page)
  })

  test('hero value stays put at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await assertYearHeroPositionStable(page)
  })
})

import { expect, test, type Page } from '@playwright/test'
import fixture from './fixtures/github.json' with { type: 'json' }

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function expectBoxInside(
  inner: { x: number; y: number; width: number; height: number } | null,
  outer: { x: number; y: number; width: number; height: number } | null,
) {
  expect(inner).toBeTruthy()
  expect(outer).toBeTruthy()
  if (!inner || !outer) return
  const pad = 2
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - pad)
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - pad)
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + pad)
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + pad)
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

function payloadFor(login: string, name: string, starsBoost = 0) {
  return {
    user: {
      ...fixture.user,
      login,
      name,
      html_url: `https://github.com/${login}`,
    },
    repos: fixture.repos.map((repo, index) => ({
      ...repo,
      id: index + 1 + starsBoost,
      full_name: `${login}/${repo.name}`,
      stargazers_count: repo.stargazers_count + starsBoost,
      html_url: `https://github.com/${login}/${repo.name}`,
    })),
    events: fixture.events.map((event, index) => ({
      ...event,
      id: `${login}-${index}`,
      repo: { name: `${login}/${fixture.repos[0]?.name ?? 'repo'}` },
    })),
    contributions: {
      totalCommitContributions: 40 + starsBoost,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 120 + starsBoost,
        weeks: wednesdayWeeks(),
      },
    },
  }
}

function ghostPayload(login: string, name: string) {
  return {
    user: {
      ...fixture.user,
      login,
      name,
      public_repos: 0,
      html_url: `https://github.com/${login}`,
    },
    repos: [],
    events: [],
    contributions: {
      totalCommitContributions: 0,
      totalPullRequestContributions: 0,
      totalIssueContributions: 0,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 0,
        weeks: [],
      },
    },
  }
}

async function mockCompareApis(
  page: Page,
  byLogin: Record<string, ReturnType<typeof payloadFor>>,
) {
  await page.route('**/api/recap?**', async (route) => {
    const url = new URL(route.request().url())
    const login = (url.searchParams.get('u') ?? '').toLowerCase()
    const payload = byLogin[login]
    if (!payload) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not_found' }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })

  await page.route('https://avatars.githubusercontent.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG,
    })
  })

  await page.route('**/api/compare-image?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.concat([PNG, Buffer.alloc(52_000, 0)]),
    })
  })
}

async function assertSlideMountedOnce(page: Page, id: string) {
  const mounts = await page.evaluate((slideId) => {
    return window.__REPO_RECAP_SLIDE_MOUNTS__?.[slideId] ?? 0
  }, id)
  expect(mounts).toBe(1)
}

async function waitForStableBox(page: Page, testId: string) {
  const locator = page.getByTestId(testId)
  await expect(locator).toBeVisible()
  const samples: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 12; i += 1) {
    const box = await locator.boundingBox()
    expect(box).toBeTruthy()
    if (box) samples.push({ x: box.x, y: box.y })
    await page.waitForTimeout(80)
  }
  const origin = samples[0]!
  for (const sample of samples) {
    expect(Math.abs(sample.x - origin.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(sample.y - origin.y)).toBeLessThanOrEqual(1)
  }
}

async function assertCardFitsViewport(page: Page) {
  const card = page.getByTestId('story-card')
  const box = await card.boundingBox()
  const viewport = page.viewportSize()
  expect(box).toBeTruthy()
  expect(viewport).toBeTruthy()
  if (!box || !viewport) return
  expect(box.x).toBeGreaterThanOrEqual(-2)
  expect(box.y).toBeGreaterThanOrEqual(-2)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2)
}

async function assertSlideInsideCard(page: Page, slideId: string) {
  const cardBox = await page.getByTestId('story-card').boundingBox()
  const slideBox = await page.getByTestId(`slide-${slideId}`).boundingBox()
  expectBoxInside(slideBox, cardBox)
  if (slideId === 'compare-score') {
    const download = await page.getByTestId('compare-download').boundingBox()
    const copy = await page.getByTestId('compare-copy-link').boundingBox()
    expectBoxInside(download, cardBox)
    expectBoxInside(copy, cardBox)
    expectBoxInside(download, {
      x: 0,
      y: 0,
      width: page.viewportSize()!.width,
      height: page.viewportSize()!.height,
    })
  }
}

async function playCompare(page: Page, path = '/vs/gaearon/sindresorhus') {
  await page.addInitScript(() => {
    window.__REPO_RECAP_SLIDE_MOUNTS__ = {}
  })
  await page.goto(path)
  await expect(page.getByTestId('story-card')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('compare-intro')).toBeVisible()
  await assertCardFitsViewport(page)

  const slideIds = [
    'compare-intro',
    'compare-contributions',
    'compare-streak',
    'compare-stars',
    'compare-languages',
    'compare-busiest',
    'compare-personalities',
    'compare-score',
  ]

  for (let i = 0; i < slideIds.length; i += 1) {
    const id = slideIds[i]!
    await expect(page.getByTestId(`slide-${id}`)).toBeVisible({ timeout: 10_000 })
    await assertSlideMountedOnce(page, id)
    await assertSlideInsideCard(page, id)
    await assertCardFitsViewport(page)
    if (id === 'compare-contributions') {
      await waitForStableBox(page, 'compare-contributions-hero-a')
    }
    if (id === 'compare-score') break
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(250)
  }

  await expect(page.getByTestId('compare-score')).toBeVisible()
  await expect(page.getByTestId('compare-hero')).toBeVisible()
  await expect(page.getByTestId('compare-download')).toBeVisible()
}

test.describe('compare mode', () => {
  test.use({
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1440, height: 700 },
    { width: 390, height: 844 },
  ]) {
    test(`plays /vs/gaearon/sindresorhus at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(120_000)
      await page.setViewportSize(viewport)
      await mockCompareApis(page, {
        gaearon: payloadFor('gaearon', 'Dan Abramov', 0),
        sindresorhus: payloadFor('sindresorhus', 'Sindre Sorhus', 40),
      })
      await playCompare(page)
    })
  }

  test('ghost compare at 390x844 skips private placeholders and LEADS chips', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await mockCompareApis(page, {
      cabbage07: ghostPayload('cabbage07', 'Cabbage'),
      jorge8017: payloadFor('Jorge8017', 'Jordan Shears', 20),
    })
    await page.addInitScript(() => {
      window.__REPO_RECAP_SLIDE_MOUNTS__ = {}
    })
    await page.goto('/vs/cabbage07/Jorge8017')
    await expect(page.getByTestId('story-card')).toBeVisible({ timeout: 15_000 })

    for (let step = 0; step < 10; step += 1) {
      const bodyText = await page.locator('[data-testid^="slide-"]').first().innerText()
      expect(bodyText).not.toContain('—')
      expect(bodyText).not.toContain('Winner')

      const privateVisible = await page.getByText('Private').count()
      const leadsOnPrivateSlide = await page.evaluate(() => {
        const slide = document.querySelector('[data-testid^="slide-"]')
        if (!slide) return false
        const hasPrivate = /Private/.test(slide.textContent ?? '')
        if (!hasPrivate) return false
        return Boolean(slide.querySelector('[data-testid="compare-leads-chip"]'))
      })
      expect(leadsOnPrivateSlide).toBe(false)
      void privateVisible

      if (await page.getByTestId('compare-score').isVisible()) break
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)
    }

    await expect(page.getByTestId('compare-score')).toBeVisible()
    const hero = await page.getByTestId('compare-hero').innerText()
    expect(
      hero.includes('Not enough public data to score') || /\d+–\d+/.test(hero),
    ).toBe(true)
    if (hero.includes('Not enough public data to score')) {
      await expect(page.getByText('Not comparable').first()).toBeVisible()
    }
    await assertSlideInsideCard(page, 'compare-score')
    await assertCardFitsViewport(page)
  })
})

import { expect, test, type Page } from '@playwright/test'
import fixture from './fixtures/github.json' with { type: 'json' }

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

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

async function mockCompareApis(page: Page) {
  const byLogin: Record<string, ReturnType<typeof payloadFor>> = {
    gaearon: payloadFor('gaearon', 'Dan Abramov', 0),
    sindresorhus: payloadFor('sindresorhus', 'Sindre Sorhus', 40),
  }

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

async function playCompare(page: Page) {
  await mockCompareApis(page)
  await page.addInitScript(() => {
    window.__REPO_RECAP_SLIDE_MOUNTS__ = {}
  })
  await page.goto('/vs/gaearon/sindresorhus')
  await expect(page.getByTestId('story-card')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('compare-intro')).toBeVisible()

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
    if (id === 'compare-contributions') {
      await waitForStableBox(page, 'compare-contributions-hero-a')
    }
    if (id === 'compare-score') break
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(250)
  }

  await expect(page.getByTestId('compare-score')).toBeVisible()
  await expect(page.getByTestId('compare-hero')).toBeVisible()
}

test.describe('compare mode', () => {
  test.use({
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  })

  test('plays /vs/gaearon/sindresorhus at 1440x900', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await playCompare(page)
  })

  test('plays /vs/gaearon/sindresorhus at 390x844', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await playCompare(page)
  })
})

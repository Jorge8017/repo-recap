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

async function mockRecapApi(page: Page) {
  const login = fixture.user.login
  const payload = {
    user: fixture.user,
    repos: fixture.repos,
    events: fixture.events,
    contributions: {
      totalCommitContributions: 40,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 913,
        weeks: wednesdayWeeks(),
      },
    },
  }
  const body = JSON.stringify(payload)

  await page.route('**/api/recap?*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body })
  })
  await page.route('**/api/recap', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body })
  })
  await page.route('https://avatars.githubusercontent.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
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
        body: JSON.stringify(fixture.repos),
      })
      return
    }
    if (url.includes('/events/public')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(fixture.events),
      })
      return
    }
    if (url.endsWith(`/users/${login}`) || url.includes(`/users/${login}?`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(fixture.user),
      })
      return
    }
    await route.fulfill({ status: 404, body: '{}' })
  })
}

async function goToSlide(
  page: Page,
  opts: { marker?: string; testId?: string },
) {
  for (let step = 0; step < 16; step += 1) {
    if (opts.testId && (await page.getByTestId(opts.testId).first().isVisible())) {
      return
    }
    if (
      opts.marker &&
      (await page.getByText(opts.marker, { exact: false }).first().isVisible())
    ) {
      return
    }
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
  }
  if (opts.testId) {
    await expect(page.getByTestId(opts.testId).first()).toBeVisible()
    return
  }
  await expect(page.getByText(opts.marker!, { exact: false }).first()).toBeVisible()
}

type Sample = {
  t: number
  fontSize: string
  box: { x: number; y: number; width: number; height: number } | null
}

async function sampleFittedTarget(
  page: Page,
  testId: string,
  scopeTestId?: string,
): Promise<{ ok: boolean; summary: string[]; samples: Sample[] }> {
  const target = scopeTestId
    ? page.getByTestId(scopeTestId).getByTestId(testId)
    : page.getByTestId(testId).first()
  await expect(target).toBeVisible({ timeout: 10_000 })

  const samples: Sample[] = []
  const started = Date.now()
  while (Date.now() - started < 4000) {
    const snap = await page.evaluate(
      ({ id, scope }) => {
        const root = scope
          ? document.querySelector(`[data-testid="${scope}"]`)
          : document
        const el = root?.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
        if (!el) return { fontSize: '', box: null }
        const r = el.getBoundingClientRect()
        return {
          fontSize: getComputedStyle(el).fontSize,
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
        }
      },
      { id: testId, scope: scopeTestId ?? null },
    )
    samples.push({ t: Date.now() - started, ...snap })
    await page.waitForTimeout(50)
  }

  const stable = samples.filter((s) => s.t >= 50 && s.box)
  const origin = stable[0]
  const summary: string[] = []
  if (!origin?.box) {
    return { ok: false, summary: ['no samples'], samples }
  }

  const fonts = [...new Set(stable.map((s) => s.fontSize))]
  const xs = stable.map((s) => s.box!.x)
  const ys = stable.map((s) => s.box!.y)
  const ws = stable.map((s) => s.box!.width)
  const hs = stable.map((s) => s.box!.height)
  const maxDelta = (vals: number[]) => Math.max(...vals) - Math.min(...vals)

  summary.push(`fontSize: ${fonts.length === 1 ? `constant (${fonts[0]})` : `CHANGES ${fonts.join(' → ')}`}`)
  summary.push(`x Δ=${maxDelta(xs).toFixed(2)} (range ${Math.min(...xs).toFixed(1)}–${Math.max(...xs).toFixed(1)})`)
  summary.push(`y Δ=${maxDelta(ys).toFixed(2)} (range ${Math.min(...ys).toFixed(1)}–${Math.max(...ys).toFixed(1)})`)
  summary.push(`w Δ=${maxDelta(ws).toFixed(2)}`)
  summary.push(`h Δ=${maxDelta(hs).toFixed(2)}`)

  const ok =
    fonts.length === 1 &&
    maxDelta(xs) <= 1 &&
    maxDelta(ys) <= 1 &&
    maxDelta(ws) <= 1 &&
    maxDelta(hs) <= 1

  return { ok, summary, samples }
}

const SLIDES: Array<{
  id: string
  marker?: string
  /** Prefer navigating by the fitted target itself when markers are breakpoint-specific. */
  arriveByTestId?: string
  testId: string
  scopeTestId?: string
  /** Skip when the fitted target is desktop-only. */
  desktopOnly?: boolean
}> = [
  { id: 'age', marker: 'Building in public for', testId: 'hero-stat-value' },
  { id: 'year', marker: 'Your last 12 months', testId: 'hero-stat-value' },
  { id: 'busiest', marker: 'You light up on', testId: 'hero-stat-value' },
  { id: 'streak', marker: 'Longest active streak', testId: 'hero-stat-value' },
  { id: 'starred', marker: 'Most-starred repo', testId: 'starred-repo-name' },
  { id: 'personality', marker: 'If this recap had a name', testId: 'personality-title' },
  {
    id: 'share-card',
    arriveByTestId: 'share-card-preview',
    testId: 'share-card-title',
    scopeTestId: 'share-card-preview',
  },
  {
    id: 'summary-heading',
    arriveByTestId: 'summary-heading-name',
    testId: 'summary-heading-name',
    desktopOnly: true,
  },
]

test.use({ timezoneId: 'UTC' })

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const) {
  test.describe(`fitted hero stability ${viewport.width}x${viewport.height}`, () => {
    test(`samples every fitted slide`, async ({ page }) => {
      test.setTimeout(300_000)
      await page.setViewportSize(viewport)
      await mockRecapApi(page)
      await page.addInitScript(() => {
        try {
          localStorage.clear()
        } catch {
          /* ignore */
        }
      })
      await page.goto('/u/octocat')
      await expect(
        page.getByRole('heading', { name: /your recap is ready/i }),
      ).toBeVisible({ timeout: 15_000 })
      await page.evaluate(() => document.fonts.ready)

      const pause = page.getByRole('button', { name: 'Pause' })
      if (await pause.count()) await pause.click()

      const failures: string[] = []
      const reports: string[] = []

      for (const slide of SLIDES) {
        if (slide.desktopOnly && viewport.width < 1024) {
          reports.push(`${slide.id}: skipped (desktop-only)`)
          continue
        }
        await goToSlide(page, {
          marker: slide.marker,
          testId: slide.arriveByTestId,
        })
        const result = await sampleFittedTarget(
          page,
          slide.testId,
          slide.scopeTestId,
        )
        reports.push(`${slide.id}: ${result.summary.join('; ')}`)
        if (!result.ok) failures.push(slide.id)
        console.log(`[${viewport.width}x${viewport.height}] ${slide.id}: ${result.summary.join('; ')}`)
      }

      expect(failures, `unstable fitted targets: ${failures.join(', ')}\n${reports.join('\n')}`).toEqual(
        [],
      )
    })
  })
}

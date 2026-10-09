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

async function goToYearSlide(page: Page) {
  for (let step = 0; step < 16; step += 1) {
    if (await page.getByText('Your last 12 months').first().isVisible()) return
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(450)
  }
  await expect(page.getByText('Your last 12 months').first()).toBeVisible()
}

type Sample = {
  t: number
  text: string
  fontSize: string
  hero: { x: number; y: number; width: number; height: number } | null
  card: { x: number; y: number; width: number; height: number } | null
  slideCount: number
  barsExist: boolean
  barsBox: { x: number; y: number; width: number; height: number } | null
  slotBox: { x: number; y: number; width: number; height: number } | null
  stackBox: { x: number; y: number; width: number; height: number } | null
}

function summarize(samples: Sample[]) {
  const changes: string[] = []
  const track = <K extends string>(label: string, values: K[]) => {
    const uniq = [...new Set(values)]
    if (uniq.length <= 1) {
      changes.push(`${label}: constant (${uniq[0] ?? 'n/a'})`)
      return
    }
    const firstChange = values.findIndex((v, i) => i > 0 && v !== values[0])
    const t = samples[firstChange]?.t
    changes.push(
      `${label}: CHANGES (${uniq.length} unique). first≠t0 at t=${t}ms. values sample: ${uniq.slice(0, 12).join(' → ')}`,
    )
  }

  track(
    'textContent',
    samples.map((s) => s.text),
  )
  track(
    'fontSize',
    samples.map((s) => s.fontSize),
  )
  track(
    'hero.x',
    samples.map((s) => String(s.hero?.x ?? null)),
  )
  track(
    'hero.y',
    samples.map((s) => String(s.hero?.y ?? null)),
  )
  track(
    'hero.width',
    samples.map((s) => String(s.hero?.width ?? null)),
  )
  track(
    'hero.height',
    samples.map((s) => String(s.hero?.height ?? null)),
  )
  track(
    'card.y',
    samples.map((s) => String(s.card?.y ?? null)),
  )
  track(
    'slideCount',
    samples.map((s) => String(s.slideCount)),
  )
  track(
    'barsExist',
    samples.map((s) => String(s.barsExist)),
  )
  track(
    'bars.height',
    samples.map((s) => String(s.barsBox?.height ?? null)),
  )
  track(
    'slot.height',
    samples.map((s) => String(s.slotBox?.height ?? null)),
  )
  track(
    'stack.height',
    samples.map((s) => String(s.stackBox?.height ?? null)),
  )
  track(
    'stack.y',
    samples.map((s) => String(s.stackBox?.y ?? null)),
  )

  const ys = samples.map((s) => s.hero?.y).filter((y): y is number => y != null)
  if (ys.length > 1) {
    const min = Math.min(...ys)
    const max = Math.max(...ys)
    changes.push(`hero.y range: ${min} → ${max} (Δ=${(max - min).toFixed(2)}px)`)
  }
  const fonts = samples.map((s) => parseFloat(s.fontSize)).filter((n) => !Number.isNaN(n))
  if (fonts.length > 1) {
    changes.push(
      `fontSize range: ${Math.min(...fonts)} → ${Math.max(...fonts)}`,
    )
  }
  const texts = [...new Set(samples.map((s) => s.text))]
  if (texts.length > 1) {
    changes.push(`textContent sequence (first 20): ${samples.slice(0, 20).map((s) => s.text).join(',')}`)
  }

  return changes
}

async function sampleYearSlide(page: Page, label: string) {
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

  // Pause so the autoplay timer does not advance mid-sample; motion still runs.
  const pause = page.getByRole('button', { name: 'Pause' })
  if (await pause.count()) await pause.click()

  await goToYearSlide(page)
  await expect(page.getByTestId('slide-year')).toBeVisible()
  // Wait until fit-text has committed (hero is visibility:hidden until then).
  await expect(page.getByTestId('hero-stat-value')).toBeVisible()

  const samples: Sample[] = []
  const started = Date.now()
  while (Date.now() - started < 4000) {
    const snap = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="hero-stat-value"]') as HTMLElement | null
      const card = document.querySelector('[data-testid="story-card"]') as HTMLElement | null
      const bars = document.querySelector('[data-testid="monthly-bars"]') as HTMLElement | null
      const slot = document.querySelector('[data-testid="chart-slot"]') as HTMLElement | null
      const stack = document.querySelector('.slide-stack') as HTMLElement | null
      const box = (el: HTMLElement | null) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      }
      return {
        text: hero?.textContent ?? '',
        fontSize: hero ? getComputedStyle(hero).fontSize : '',
        hero: box(hero),
        card: box(card),
        slideCount: document.querySelectorAll('[data-slide-id]').length,
        barsExist: Boolean(bars),
        barsBox: box(bars),
        slotBox: box(slot),
        stackBox: box(stack),
      }
    })
    samples.push({ t: Date.now() - started, ...snap })
    await page.waitForTimeout(50)
  }

  const report = {
    label,
    viewport: page.viewportSize(),
    sampleCount: samples.length,
    first: samples[0],
    last: samples[samples.length - 1],
    summary: summarize(samples),
    samples,
  }

  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const outDir = path.join('test-results', 'year-jitter-diagnose')
  await fs.mkdir(outDir, { recursive: true })
  const file = path.join(outDir, `${label}.json`)
  await fs.writeFile(file, JSON.stringify(report, null, 2))
  console.log(`\n=== DIAGNOSE ${label} ===`)
  for (const line of report.summary) console.log(line)
  console.log(`wrote ${file}`)
  return report
}

// Match live site: do NOT force reduced motion. Record video of the 4s window.
test.use({
  timezoneId: 'UTC',
  video: 'on',
})

test.describe('year slide jitter diagnose', () => {
  test('diagnose at 1440x900', async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    const report = await sampleYearSlide(page, 'after-1440x900')
    // After count-up's first frame (~50ms), geometry + font-size must stay put.
    const stable = report.samples.filter((s) => s.t >= 50)
    const origin = stable[0]
    expect(origin?.hero).toBeTruthy()
    for (const sample of stable) {
      expect(Math.abs((sample.hero?.x ?? 0) - (origin!.hero!.x))).toBeLessThanOrEqual(1)
      expect(Math.abs((sample.hero?.y ?? 0) - (origin!.hero!.y))).toBeLessThanOrEqual(1)
      expect(Math.abs((sample.hero?.width ?? 0) - (origin!.hero!.width))).toBeLessThanOrEqual(1)
      expect(Math.abs((sample.hero?.height ?? 0) - (origin!.hero!.height))).toBeLessThanOrEqual(1)
      expect(sample.fontSize).toBe(origin!.fontSize)
    }
  })

  test('diagnose at 390x844', async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 390, height: 844 })
    const report = await sampleYearSlide(page, 'after-390x844')
    const stable = report.samples.filter((s) => s.t >= 50)
    const origin = stable[0]
    expect(origin?.hero).toBeTruthy()
    for (const sample of stable) {
      expect(Math.abs((sample.hero?.x ?? 0) - (origin!.hero!.x))).toBeLessThanOrEqual(1)
      expect(Math.abs((sample.hero?.y ?? 0) - (origin!.hero!.y))).toBeLessThanOrEqual(1)
      expect(Math.abs((sample.hero?.width ?? 0) - (origin!.hero!.width))).toBeLessThanOrEqual(1)
      expect(Math.abs((sample.hero?.height ?? 0) - (origin!.hero!.height))).toBeLessThanOrEqual(1)
      expect(sample.fontSize).toBe(origin!.fontSize)
    }
  })
})

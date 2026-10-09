import { expect, test, type Page } from '@playwright/test'
import fixture from './fixtures/github.json' with { type: 'json' }

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function mockGitHub(page: Page) {
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

    if (/\/users\/octocat$/.test(url) || url.endsWith('/users/octocat')) {
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

test('plays a mocked recap through to the downloadable share card', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await mockGitHub(page)
  await page.goto('/')

  await page.getByLabel('GitHub username').fill('octocat')
  await page.getByRole('button', { name: 'Generate recap' }).click()

  await expect(
    page.getByRole('heading', { name: /your recap is ready/i }),
  ).toBeVisible({
    timeout: 15_000,
  })

  for (let step = 0; step < 12; step += 1) {
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

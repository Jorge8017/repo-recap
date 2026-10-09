import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CachedRecapPayload } from '../src/types.js'
import {
  buildShareCardModel,
  titleFontSize,
} from './_lib/shareCardElement.js'
import { truncateEllipsis } from './_lib/xml.js'

const { TINY_PNG_DATA_URI, fakePngBytes, ImageResponseMock } = vi.hoisted(() => {
  const header = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    ),
    (ch) => ch.charCodeAt(0),
  )
  const fakePngBytes = new Uint8Array(8_192)
  fakePngBytes.set(header)

  class ImageResponseMock extends Response {
    element: unknown
    options: { headers?: Record<string, string> } | undefined

    constructor(element: unknown, options?: { headers?: Record<string, string> }) {
      const headers = new Headers({ 'Content-Type': 'image/png' })
      if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          headers.set(key, value)
        }
      }
      super(fakePngBytes, { status: 200, headers })
      this.element = element
      this.options = options
    }
  }

  return {
    TINY_PNG_DATA_URI: `data:image/png;base64,${btoa(String.fromCharCode(...header))}`,
    fakePngBytes,
    ImageResponseMock,
  }
})

vi.mock('@vercel/og', () => ({
  ImageResponse: ImageResponseMock,
}))

vi.mock('./_lib/github.js', () => ({
  buildAuthenticatedRecap: vi.fn(),
}))

vi.mock('./_lib/avatarDataUri.js', () => ({
  fetchAvatarDataUri: vi.fn(async () => TINY_PNG_DATA_URI),
}))

vi.mock('./_lib/shareFonts.js', () => ({
  loadShareFonts: vi.fn(async () => [
    {
      name: 'Space Grotesk',
      data: new ArrayBuffer(8),
      weight: 700 as const,
      style: 'normal' as const,
    },
  ]),
}))

import { buildAuthenticatedRecap } from './_lib/github.js'
import { fetchAvatarDataUri } from './_lib/avatarDataUri.js'
import handler from './share-image.js'

const TOKEN = 'ghp_share_image_secret_must_never_appear'

function samplePayload(
  overrides: Partial<CachedRecapPayload> = {},
): CachedRecapPayload {
  return {
    user: {
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      bio: null,
      created_at: '2011-01-25T00:00:00Z',
      public_repos: 2,
      html_url: 'https://github.com/octocat',
    },
    repos: [
      {
        id: 1,
        name: 'hello',
        full_name: 'octocat/hello',
        description: null,
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 1,
        pushed_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/octocat/hello',
        fork: false,
      },
      {
        id: 2,
        name: 'world',
        full_name: 'octocat/world',
        description: null,
        language: 'Go',
        stargazers_count: 4,
        forks_count: 0,
        pushed_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/octocat/world',
        fork: false,
      },
    ],
    events: [],
    contributions: {
      totalCommitContributions: 40,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 120,
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-01', contributionCount: 5, weekday: 1 },
              { date: '2024-01-02', contributionCount: 5, weekday: 2 },
            ],
          },
        ],
      },
    },
    ...overrides,
  }
}

function emptyPayload(): CachedRecapPayload {
  return samplePayload({
    user: {
      login: 'quiet-dev',
      name: 'Quiet Dev',
      avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
      bio: null,
      created_at: '2020-06-01T00:00:00Z',
      public_repos: 0,
      html_url: 'https://github.com/quiet-dev',
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
  })
}

function collectText(node: unknown): string[] {
  if (node == null || typeof node === 'boolean') return []
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectText)
  if (typeof node === 'object' && 'props' in node) {
    return collectText((node as { props: { children?: unknown } }).props.children)
  }
  return []
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = TOKEN
  vi.mocked(buildAuthenticatedRecap).mockReset()
  vi.mocked(fetchAvatarDataUri).mockReset()
  vi.mocked(fetchAvatarDataUri).mockResolvedValue(TINY_PNG_DATA_URI)
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GITHUB_TOKEN
})

describe('share card model', () => {
  it('truncates long names with an ellipsis', () => {
    expect(truncateEllipsis('abcdefghijklmnopqrstuvwxyz', 10)).toBe(
      'abcdefghi…',
    )
  })

  it('scales personality title font by length', () => {
    expect(titleFontSize('Builder')).toBe(144)
    expect(titleFontSize('Night Owl Extra Long')).toBe(72)
  })

  it('builds Ghost Mode stats for empty profiles', () => {
    const model = buildShareCardModel(emptyPayload(), null)
    expect(model.ghostMode).toBe(true)
    expect(model.personality.id).toBe('ghost-mode')
    expect(model.statItems.map((item) => item.label)).toEqual([
      'On GitHub',
      'Joined',
      'Public repos',
    ])
    expect(model.statItems[2]?.value).toBe('Private')
  })
})

describe('share-image handler', () => {
  it('returns image/png for a mocked user without leaking the token', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 200,
      body: samplePayload(),
      headers: {},
    })

    const response = await handler(
      new Request('http://localhost/api/share-image?u=octocat'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toContain('s-maxage=21600')
    const png = new Uint8Array(await response.arrayBuffer())
    expect(png[0]).toBe(0x89)
    expect(png[1]).toBe(0x50)
    expect(png[2]).toBe(0x4e)
    expect(png[3]).toBe(0x47)
    expect(Buffer.from(png).toString('utf8')).not.toContain(TOKEN)
    expect(png.byteLength).toBe(fakePngBytes.byteLength)
  })

  it('returns 400 for invalid username with no user data', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 400,
      body: { error: 'invalid_username' },
    })

    const response = await handler(
      new Request('http://localhost/api/share-image?u=-bad'),
    )
    const body = await response.text()

    expect(response.status).toBe(400)
    expect(body).toBe('Bad Request')
    expect(body).not.toContain(TOKEN)
    expect(body).not.toContain('-bad')
  })

  it('returns 404 for unknown user with no user data', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 404,
      body: { error: 'not_found' },
    })

    const response = await handler(
      new Request('http://localhost/api/share-image?u=missing-user'),
    )
    const body = await response.text()

    expect(response.status).toBe(404)
    expect(body).toBe('Not Found')
    expect(body).not.toContain('missing-user')
    expect(body).not.toContain(TOKEN)
  })

  it('returns 429 when rate limited with no user data', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 429,
      body: { error: 'rate_limited', resetAt: '2026-10-09T12:00:00.000Z' },
    })

    const response = await handler(
      new Request('http://localhost/api/share-image?u=octocat'),
    )
    const body = await response.text()

    expect(response.status).toBe(429)
    expect(body).toBe('Too Many Requests')
    expect(body).not.toContain('octocat')
    expect(body).not.toContain(TOKEN)
  })

  it('renders Ghost Mode variant as a PNG', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 200,
      body: emptyPayload(),
      headers: {},
    })
    vi.mocked(fetchAvatarDataUri).mockResolvedValue(null)

    const model = buildShareCardModel(emptyPayload(), null)
    expect(model.ghostMode).toBe(true)

    const response = await handler(
      new Request('http://localhost/api/share-image?u=quiet-dev'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response).toBeInstanceOf(ImageResponseMock)
    const texts = collectText(
      (response as InstanceType<typeof ImageResponseMock>).element,
    )
    expect(texts).toContain('Ghost Mode')
    expect(texts).toContain('On GitHub')
    expect(texts).toContain('REPO RECAP')
    expect(texts).toContain('recap.jordanshears.com')
  })
})

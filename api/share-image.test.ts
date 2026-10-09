import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { CachedRecapPayload } from '../src/types.js'
import {
  buildShareCardModel,
  titleFontSize,
} from './_lib/shareCardElement.js'
import { truncateEllipsis } from './_lib/xml.js'

const { TINY_PNG_DATA_URI, fakePngBuffer, createOgImageResponse } = vi.hoisted(
  () => {
    const header = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    const fakePngBuffer = Buffer.concat([header, Buffer.alloc(8_000, 1)])
    return {
      TINY_PNG_DATA_URI: `data:image/png;base64,${header.toString('base64')}`,
      fakePngBuffer,
      createOgImageResponse: vi.fn(async () => ({
        arrayBuffer: async () =>
          fakePngBuffer.buffer.slice(
            fakePngBuffer.byteOffset,
            fakePngBuffer.byteOffset + fakePngBuffer.byteLength,
          ),
      })),
    }
  },
)

vi.mock('./_lib/github.js', () => ({
  buildAuthenticatedRecap: vi.fn(),
}))

vi.mock('./_lib/cardSvg.js', async () => {
  const actual = await vi.importActual<typeof import('./_lib/cardSvg.js')>(
    './_lib/cardSvg.js',
  )
  return {
    ...actual,
    fetchAvatarDataUri: vi.fn(async () => TINY_PNG_DATA_URI),
  }
})

vi.mock('./_lib/ogImageResponse.js', () => ({
  createOgImageResponse,
}))

import { buildAuthenticatedRecap } from './_lib/github.js'
import { fetchAvatarDataUri } from './_lib/cardSvg.js'
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

function mockRes() {
  const state: {
    statusCode: number
    headers: Record<string, string>
    body: Buffer | string | null
  } = { statusCode: 200, headers: {}, body: null }

  const res = {
    status(code: number) {
      state.statusCode = code
      return res
    },
    setHeader(key: string, value: string) {
      state.headers[key.toLowerCase()] = value
      return res
    },
    send(body: Buffer | string) {
      state.body = body
      return res
    },
  } as unknown as VercelResponse

  return { res, state }
}

function mockReq(query: Record<string, string | string[] | undefined>): VercelRequest {
  return {
    method: 'GET',
    query,
    url: `/api/share-image?u=${String(query.u ?? '')}`,
  } as unknown as VercelRequest
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
  createOgImageResponse.mockClear()
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

    const { res, state } = mockRes()
    await handler(mockReq({ u: 'octocat' }), res)

    expect(state.statusCode).toBe(200)
    expect(state.headers['content-type']).toBe('image/png')
    expect(state.headers['cache-control']).toContain('s-maxage=21600')
    expect(Buffer.isBuffer(state.body)).toBe(true)
    const png = state.body as Buffer
    expect(png.subarray(0, 4).toString('hex')).toBe('89504e47')
    expect(png.equals(fakePngBuffer)).toBe(true)
    expect(png.toString('utf8')).not.toContain(TOKEN)
    expect(createOgImageResponse).toHaveBeenCalledOnce()
  })

  it('returns 400 for invalid username with no user data', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 400,
      body: { error: 'invalid_username' },
    })

    const { res, state } = mockRes()
    await handler(mockReq({ u: '-bad' }), res)

    expect(state.statusCode).toBe(400)
    expect(String(state.body)).toBe('Bad Request')
    expect(String(state.body)).not.toContain(TOKEN)
    expect(String(state.body)).not.toContain('-bad')
  })

  it('returns 404 for unknown user with no user data', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 404,
      body: { error: 'not_found' },
    })

    const { res, state } = mockRes()
    await handler(mockReq({ u: 'missing-user' }), res)

    expect(state.statusCode).toBe(404)
    expect(String(state.body)).toBe('Not Found')
    expect(String(state.body)).not.toContain('missing-user')
    expect(String(state.body)).not.toContain(TOKEN)
  })

  it('returns 429 when rate limited with no user data', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 429,
      body: { error: 'rate_limited', resetAt: '2026-10-09T12:00:00.000Z' },
    })

    const { res, state } = mockRes()
    await handler(mockReq({ u: 'octocat' }), res)

    expect(state.statusCode).toBe(429)
    expect(String(state.body)).toBe('Too Many Requests')
    expect(String(state.body)).not.toContain('octocat')
    expect(String(state.body)).not.toContain(TOKEN)
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

    const { res, state } = mockRes()
    await handler(mockReq({ u: 'quiet-dev' }), res)

    expect(state.statusCode).toBe(200)
    expect(state.headers['content-type']).toBe('image/png')
    const png = state.body as Buffer
    expect(png.subarray(0, 4).toString('hex')).toBe('89504e47')
    expect(createOgImageResponse).toHaveBeenCalledOnce()
    const firstCall = createOgImageResponse.mock.calls.at(0) as
      | [unknown, unknown]
      | undefined
    const texts = collectText(firstCall?.[0])
    expect(texts).toContain('Ghost Mode')
    expect(texts).toContain('On GitHub')
    expect(texts).toContain('REPO RECAP')
    expect(texts).toContain('recap.jordanshears.com')
  })
})

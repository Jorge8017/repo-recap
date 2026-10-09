import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  buildCompareCardElement,
  COMPARE_IMAGE_CONTENT_WIDTH,
  COMPARE_IMAGE_MAX_RIGHT,
  COMPARE_IMAGE_PADDING,
} from './_lib/compareCardElement.js'
import type { CachedRecapPayload } from '../src/types.js'

const { fakePngBuffer, renderSharePng } = vi.hoisted(() => {
  const header = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const fakePngBuffer = Buffer.concat([header, Buffer.alloc(8_000, 1)])
  return {
    fakePngBuffer,
    renderSharePng: vi.fn(async () => fakePngBuffer),
  }
})

vi.mock('./_lib/github.js', () => ({
  buildAuthenticatedRecap: vi.fn(),
}))

vi.mock('./_lib/avatarDataUri.js', () => ({
  fetchAvatarDataUri: vi.fn(async () => null),
}))

vi.mock('./_lib/renderSharePng.js', () => ({
  renderSharePng,
}))

import { buildAuthenticatedRecap } from './_lib/github.js'
import handler from './compare-image.js'

const TOKEN = 'ghp_compare_secret_must_never_appear'

function samplePayload(login: string): CachedRecapPayload {
  return {
    user: {
      login,
      name: login,
      avatar_url: `https://avatars.githubusercontent.com/u/${login}?v=4`,
      bio: null,
      created_at: '2015-01-01T00:00:00Z',
      public_repos: 3,
      html_url: `https://github.com/${login}`,
    },
    repos: [
      {
        id: 1,
        name: 'one',
        full_name: `${login}/one`,
        description: null,
        language: 'TypeScript',
        stargazers_count: 8,
        forks_count: 0,
        pushed_at: '2024-01-01T00:00:00Z',
        html_url: `https://github.com/${login}/one`,
        fork: false,
      },
    ],
    events: [],
    contributions: {
      totalCommitContributions: 20,
      totalPullRequestContributions: 1,
      totalIssueContributions: 0,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 40,
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-01', contributionCount: 4, weekday: 1 },
            ],
          },
        ],
      },
    },
  }
}

function mockRes() {
  const state: {
    statusCode: number
    headers: Record<string, string>
    body: Buffer | string | object | null
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
    json(body: object) {
      state.headers['content-type'] = 'application/json; charset=utf-8'
      state.body = body
      return res
    },
  } as unknown as VercelResponse

  return { res, state }
}

function mockReq(query: Record<string, string>): VercelRequest {
  return {
    method: 'GET',
    query,
    url: `/api/compare-image?a=${query.a ?? ''}&b=${query.b ?? ''}`,
  } as unknown as VercelRequest
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = TOKEN
  vi.mocked(buildAuthenticatedRecap).mockReset()
  renderSharePng.mockClear()
  renderSharePng.mockResolvedValue(fakePngBuffer)
})

afterEach(() => {
  delete process.env.GITHUB_TOKEN
})

describe('compare-image handler', () => {
  it('returns image/png for two mocked users without leaking the token', async () => {
    vi.mocked(buildAuthenticatedRecap).mockImplementation(async (username) => ({
      status: 200 as const,
      body: samplePayload(String(username)),
      headers: {},
    }))

    const { res, state } = mockRes()
    await handler(mockReq({ a: 'gaearon', b: 'sindresorhus' }), res)

    expect(state.statusCode).toBe(200)
    expect(state.headers['content-type']).toBe('image/png')
    expect(state.headers['cache-control']).toContain('s-maxage=21600')
    const png = state.body as Buffer
    expect(png.subarray(0, 4).toString('hex')).toBe('89504e47')
    expect(png.toString('utf8')).not.toContain(TOKEN)
    expect(renderSharePng).toHaveBeenCalledOnce()
  })

  it('returns 400 JSON for invalid or same usernames', async () => {
    vi.mocked(buildAuthenticatedRecap).mockResolvedValue({
      status: 400,
      body: { error: 'invalid_username' },
    })
    const invalid = mockRes()
    await handler(mockReq({ a: '-bad', b: 'gaearon' }), invalid.res)
    expect(invalid.state.statusCode).toBe(400)
    expect(invalid.state.body).toEqual({ error: 'invalid_username' })

    const same = mockRes()
    await handler(mockReq({ a: 'Gaearon', b: 'gaearon' }), same.res)
    expect(same.state.statusCode).toBe(400)
    expect(same.state.body).toEqual({ error: 'invalid_username' })
  })

  it('returns 404 JSON when either user is missing', async () => {
    vi.mocked(buildAuthenticatedRecap)
      .mockResolvedValueOnce({
        status: 200,
        body: samplePayload('gaearon'),
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 404,
        body: { error: 'not_found' },
      })

    const { res, state } = mockRes()
    await handler(mockReq({ a: 'gaearon', b: 'missing-user' }), res)

    expect(state.statusCode).toBe(404)
    expect(state.body).toEqual({ error: 'not_found' })
    expect(JSON.stringify(state.body)).not.toContain(TOKEN)
    expect(JSON.stringify(state.body)).not.toContain('missing-user')
  })

  it('returns 200 for Jorge8017 vs cabbage07 and keeps text inside the image width', async () => {
    const publicUser = samplePayload('Jorge8017')
    publicUser.user.name = 'Jordan Shears'
    const ghostUser: CachedRecapPayload = {
      user: {
        login: 'cabbage07',
        name: 'Cabbage',
        avatar_url: 'https://avatars.githubusercontent.com/u/cabbage07?v=4',
        bio: null,
        created_at: '2020-01-01T00:00:00Z',
        public_repos: 0,
        html_url: 'https://github.com/cabbage07',
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

    vi.mocked(buildAuthenticatedRecap).mockImplementation(async (username) => {
      const login = String(username).toLowerCase()
      if (login === 'jorge8017') {
        return { status: 200 as const, body: publicUser, headers: {} }
      }
      if (login === 'cabbage07') {
        return { status: 200 as const, body: ghostUser, headers: {} }
      }
      return { status: 404 as const, body: { error: 'not_found' as const } }
    })

    const { res, state } = mockRes()
    await handler(mockReq({ a: 'Jorge8017', b: 'cabbage07' }), res)

    expect(state.statusCode).toBe(200)
    expect(state.headers['content-type']).toBe('image/png')

    const element = buildCompareCardElement(publicUser, ghostUser, null, null)
    const nodes = collectLayoutText(element, {
      x: COMPARE_IMAGE_PADDING,
      width: COMPARE_IMAGE_CONTENT_WIDTH,
      fontSize: 32,
    })
    expect(nodes.map((node) => node.text)).toMatchSnapshot()
    for (const node of nodes) {
      const width = estimateTextWidth(node.text, node.fontSize)
      const right = node.x + Math.min(width, node.maxWidth ?? width)
      expect(right).toBeLessThanOrEqual(COMPARE_IMAGE_MAX_RIGHT + 0.5)
    }
  })
})

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62
}

function collectLayoutText(
  node: unknown,
  inherited: { x: number; width: number; fontSize: number; maxWidth?: number },
): Array<{ text: string; fontSize: number; x: number; maxWidth?: number }> {
  if (node == null || typeof node === 'boolean') return []
  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node)
    if (!text.trim()) return []
    return [
      {
        text,
        fontSize: inherited.fontSize,
        x: inherited.x,
        maxWidth: inherited.maxWidth ?? inherited.width,
      },
    ]
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectLayoutText(child, inherited))
  }
  if (typeof node === 'object' && 'props' in node) {
    const props = (
      node as {
        props: {
          style?: Record<string, unknown>
          children?: unknown
        }
      }
    ).props
    const style = props.style ?? {}
    const fontSize =
      typeof style.fontSize === 'number' ? style.fontSize : inherited.fontSize
    const width =
      typeof style.maxWidth === 'number'
        ? style.maxWidth
        : typeof style.width === 'number'
          ? style.width
          : inherited.width
    const justify = style.justifyContent
    let x = inherited.x
    if (justify === 'flex-end' || justify === 'right') {
      x = inherited.x + inherited.width - width
    } else if (justify === 'center') {
      x = inherited.x + (inherited.width - width) / 2
    }
    return collectLayoutText(props.children, {
      x,
      width,
      fontSize,
      maxWidth: width,
    })
  }
  return []
}

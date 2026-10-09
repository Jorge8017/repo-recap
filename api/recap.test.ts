import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildAuthenticatedRecap,
  responseContainsSecret,
} from './githubRecap.js'

const TOKEN = 'ghp_test_token_should_never_leak'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('buildAuthenticatedRecap', () => {
  it('rejects invalid usernames with 400', async () => {
    const result = await buildAuthenticatedRecap('-bad', TOKEN)
    expect(result.status).toBe(400)
    expect(result.body).toEqual({ error: 'invalid_username' })
  })

  it('returns 404 when GitHub has no user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        if (url.includes('graphql')) {
          return jsonResponse({
            data: { user: null },
            errors: [{ type: 'NOT_FOUND', message: 'Could not resolve to a User' }],
          })
        }
        return jsonResponse([], { status: 404 })
      }),
    )

    const result = await buildAuthenticatedRecap('missing-user', TOKEN)
    expect(result.status).toBe(404)
    expect(result.body).toEqual({ error: 'not_found' })
    expect(responseContainsSecret(result.body, TOKEN)).toBe(false)
  })

  it('returns 429 with resetAt when rate limited', async () => {
    const reset = new Date('2026-10-09T12:00:00.000Z')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { message: 'API rate limit exceeded' },
          {
            status: 403,
            headers: {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.floor(reset.getTime() / 1000)),
            },
          },
        ),
      ),
    )

    const result = await buildAuthenticatedRecap('octocat', TOKEN)
    expect(result.status).toBe(429)
    expect(result.body).toMatchObject({
      error: 'rate_limited',
      resetAt: reset.toISOString(),
    })
    expect(JSON.stringify(result.body)).not.toContain(TOKEN)
  })

  it('returns a success payload without leaking the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        if (url.includes('graphql')) {
          return jsonResponse({
            data: {
              user: {
                login: 'octocat',
                name: 'The Octocat',
                avatarUrl: 'https://example.com/a.png',
                createdAt: '2011-01-25T00:00:00Z',
                followers: { totalCount: 100 },
                repositories: {
                  totalCount: 1,
                  nodes: [
                    {
                      name: 'hello-world',
                      description: 'demo',
                      stargazerCount: 42,
                      forkCount: 3,
                      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
                      pushedAt: '2024-06-01T12:00:00Z',
                    },
                  ],
                },
                contributionsCollection: {
                  totalCommitContributions: 10,
                  totalPullRequestContributions: 2,
                  totalIssueContributions: 1,
                  totalPullRequestReviewContributions: 0,
                  restrictedContributionsCount: 5,
                  contributionCalendar: {
                    totalContributions: 12,
                    weeks: [
                      {
                        contributionDays: [
                          {
                            date: '2024-01-01',
                            contributionCount: 2,
                            weekday: 1,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          })
        }
        return jsonResponse(
          [
            {
              id: '1',
              type: 'PushEvent',
              created_at: '2024-06-03T14:00:00Z',
              repo: { name: 'octocat/hello-world' },
              payload: { size: 2 },
            },
          ],
          {
            headers: {
              'X-RateLimit-Remaining': '4999',
              'X-RateLimit-Reset': '1893456000',
            },
          },
        )
      }),
    )

    const result = await buildAuthenticatedRecap('octocat', TOKEN)
    expect(result.status).toBe(200)
    if (result.status !== 200) return
    expect(result.headers['Cache-Control']).toContain('s-maxage=3600')
    expect(result.body.user.login).toBe('octocat')
    expect(result.body.repos[0]?.name).toBe('hello-world')
    expect(result.body.contributions?.restrictedContributionsCount).toBe(5)
    expect(result.body.events).toHaveLength(1)
    expect(JSON.stringify(result.body)).not.toContain(TOKEN)
    expect(responseContainsSecret(result.body, TOKEN)).toBe(false)
  })

  it('returns 502 when the token is missing', async () => {
    const result = await buildAuthenticatedRecap('octocat', undefined)
    expect(result.status).toBe(502)
    expect(result.body).toEqual({ error: 'upstream' })
  })

  it('returns 400 when the username is missing', async () => {
    const result = await buildAuthenticatedRecap(undefined, TOKEN)
    expect(result.status).toBe(400)
    expect(result.body).toEqual({ error: 'invalid_username' })
  })

  it('calls GitHub with each requested username and returns matching logins', async () => {
    const graphqlLogins: string[] = []
    const eventLogins: string[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('graphql')) {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            variables?: { login?: string }
          }
          const login = body.variables?.login ?? ''
          graphqlLogins.push(login)
          return jsonResponse({
            data: {
              user: {
                login,
                name: login,
                avatarUrl: 'https://example.com/a.png',
                createdAt: '2011-01-25T00:00:00Z',
                followers: { totalCount: 1 },
                repositories: { totalCount: 0, nodes: [] },
                contributionsCollection: {
                  totalCommitContributions: 0,
                  totalPullRequestContributions: 0,
                  totalIssueContributions: 0,
                  totalPullRequestReviewContributions: 0,
                  restrictedContributionsCount: 0,
                  contributionCalendar: { totalContributions: 0, weeks: [] },
                },
              },
            },
          })
        }

        const match = url.match(/\/users\/([^/]+)\/events\/public/)
        if (match?.[1]) eventLogins.push(decodeURIComponent(match[1]))
        return jsonResponse([])
      }),
    )

    const first = await buildAuthenticatedRecap('octocat', TOKEN)
    const second = await buildAuthenticatedRecap('torvalds', TOKEN)

    expect(graphqlLogins).toEqual(['octocat', 'torvalds'])
    expect(eventLogins).toEqual(['octocat', 'torvalds'])
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    if (first.status === 200) expect(first.body.user.login).toBe('octocat')
    if (second.status === 200) expect(second.body.user.login).toBe('torvalds')
    expect(first.headers?.Vary).toBe('Accept-Encoding')
  })

  it('returns 502 when GitHub login does not match the requested username', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        if (String(input).includes('graphql')) {
          return jsonResponse({
            data: {
              user: {
                login: 'gaearon',
                name: 'Dan',
                avatarUrl: 'https://example.com/a.png',
                createdAt: '2011-01-25T00:00:00Z',
                followers: { totalCount: 1 },
                repositories: { totalCount: 0, nodes: [] },
                contributionsCollection: {
                  totalCommitContributions: 0,
                  totalPullRequestContributions: 0,
                  totalIssueContributions: 0,
                  totalPullRequestReviewContributions: 0,
                  restrictedContributionsCount: 0,
                  contributionCalendar: { totalContributions: 0, weeks: [] },
                },
              },
            },
          })
        }
        return jsonResponse([])
      }),
    )

    const result = await buildAuthenticatedRecap('jorge8017', TOKEN)
    expect(result.status).toBe(502)
    expect(result.body).toEqual({ error: 'upstream' })
  })
})

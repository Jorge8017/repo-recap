import { isValidGitHubUsername, normalizeUsername } from '../src/lib/username.js'
import type {
  ApiRecapErrorBody,
  CachedRecapPayload,
  ContributionsSummary,
  GitHubEvent,
  GitHubRepo,
  GitHubUser,
} from '../src/types.js'

const GRAPHQL_URL = 'https://api.github.com/graphql'
const REST_ROOT = 'https://api.github.com'

const RECAP_QUERY = `
query Recap($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    name
    avatarUrl
    createdAt
    followers {
      totalCount
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
      privacy: PUBLIC
    ) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        forkCount
        primaryLanguage {
          name
          color
        }
        pushedAt
      }
    }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
          }
        }
      }
    }
  }
}
`

interface GraphqlRepoNode {
  name: string
  description: string | null
  stargazerCount: number
  forkCount: number
  primaryLanguage: { name: string; color: string | null } | null
  pushedAt: string | null
}

interface GraphqlUser {
  login: string
  name: string | null
  avatarUrl: string
  createdAt: string
  followers: { totalCount: number }
  repositories: {
    totalCount: number
    nodes: GraphqlRepoNode[]
  }
  contributionsCollection: ContributionsSummary
}

interface GraphqlResponse {
  data?: { user: GraphqlUser | null }
  errors?: Array<{ type?: string; message?: string }>
}

export type RecapHandlerResult =
  | {
      status: 200
      body: CachedRecapPayload
      headers: Record<string, string>
    }
  | {
      status: 400 | 404 | 429 | 502
      body: ApiRecapErrorBody
      headers?: Record<string, string>
    }

function contributionWindow(now: Date): { from: string; to: string } {
  const to = new Date(now)
  const from = new Date(now)
  from.setUTCFullYear(from.getUTCFullYear() - 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

function mapRepos(login: string, nodes: GraphqlRepoNode[]): GitHubRepo[] {
  return nodes.map((node, index) => ({
    id: index + 1,
    name: node.name,
    full_name: `${login}/${node.name}`,
    description: node.description,
    language: node.primaryLanguage?.name ?? null,
    stargazers_count: node.stargazerCount,
    forks_count: node.forkCount,
    pushed_at: node.pushedAt,
    html_url: `https://github.com/${login}/${node.name}`,
    fork: false,
  }))
}

function mapUser(user: GraphqlUser): GitHubUser {
  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatarUrl,
    bio: null,
    created_at: user.createdAt,
    public_repos: user.repositories.totalCount,
    html_url: `https://github.com/${user.login}`,
  }
}

function parseHeaderInt(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function resetIso(resetAt: Date | null): string | undefined {
  return resetAt ? resetAt.toISOString() : undefined
}

async function fetchGraphqlUser(
  token: string,
  login: string,
  now: Date,
): Promise<
  | { ok: true; user: GraphqlUser; resetAt: Date | null }
  | { ok: false; status: 404 | 429 | 502; resetAt: Date | null }
> {
  const { from, to } = contributionWindow(now)
  let response: Response
  try {
    response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: RECAP_QUERY,
        variables: { login, from, to },
      }),
    })
  } catch {
    return { ok: false, status: 502, resetAt: null }
  }

  const resetEpoch = parseHeaderInt(response.headers.get('X-RateLimit-Reset'))
  const resetAt = resetEpoch !== null ? new Date(resetEpoch * 1000) : null
  const remaining = parseHeaderInt(response.headers.get('X-RateLimit-Remaining'))

  if (response.status === 401 || response.status === 403 || response.status === 429) {
    if (response.status === 429 || remaining === 0 || response.status === 403) {
      return { ok: false, status: 429, resetAt }
    }
    return { ok: false, status: 502, resetAt }
  }

  if (!response.ok) {
    return { ok: false, status: 502, resetAt }
  }

  let payload: GraphqlResponse
  try {
    payload = (await response.json()) as GraphqlResponse
  } catch {
    return { ok: false, status: 502, resetAt }
  }

  const notFound = payload.errors?.some(
    (error) =>
      error.type === 'NOT_FOUND' ||
      /could not resolve to a user/i.test(error.message ?? ''),
  )
  if (notFound || payload.data?.user === null) {
    return { ok: false, status: 404, resetAt }
  }

  if (!payload.data?.user || payload.errors?.length) {
    return { ok: false, status: 502, resetAt }
  }

  return { ok: true, user: payload.data.user, resetAt }
}

async function fetchPublicEvents(
  token: string,
  login: string,
): Promise<
  | { ok: true; events: GitHubEvent[]; resetAt: Date | null }
  | { ok: false; status: 429 | 502; resetAt: Date | null }
> {
  const events: GitHubEvent[] = []
  let resetAt: Date | null = null

  for (let page = 1; page <= 3; page += 1) {
    let response: Response
    try {
      response = await fetch(
        `${REST_ROOT}/users/${encodeURIComponent(login)}/events/public?per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      )
    } catch {
      return { ok: false, status: 502, resetAt }
    }

    const resetEpoch = parseHeaderInt(response.headers.get('X-RateLimit-Reset'))
    resetAt = resetEpoch !== null ? new Date(resetEpoch * 1000) : resetAt
    const remaining = parseHeaderInt(response.headers.get('X-RateLimit-Remaining'))

    if (response.status === 404) {
      return { ok: true, events, resetAt }
    }
    if (response.status === 429 || remaining === 0 || response.status === 403) {
      return { ok: false, status: 429, resetAt }
    }
    if (!response.ok) {
      return { ok: false, status: 502, resetAt }
    }

    let pageEvents: GitHubEvent[]
    try {
      pageEvents = (await response.json()) as GitHubEvent[]
    } catch {
      return { ok: false, status: 502, resetAt }
    }

    events.push(...pageEvents)
    const link = response.headers.get('Link')
    const hasNext = Boolean(link && /rel="next"/i.test(link))
    if (pageEvents.length === 0 || (!hasNext && pageEvents.length < 100)) break
  }

  return { ok: true, events, resetAt }
}

export async function buildAuthenticatedRecap(
  usernameRaw: string | null | undefined,
  token: string | undefined,
  now: Date = new Date(),
): Promise<RecapHandlerResult> {
  const username = normalizeUsername(usernameRaw ?? '')
  if (!isValidGitHubUsername(username)) {
    return { status: 400, body: { error: 'invalid_username' } }
  }

  if (!token) {
    return { status: 502, body: { error: 'upstream' } }
  }

  const graphql = await fetchGraphqlUser(token, username, now)
  if (!graphql.ok) {
    if (graphql.status === 404) {
      return { status: 404, body: { error: 'not_found' } }
    }
    if (graphql.status === 429) {
      return {
        status: 429,
        body: { error: 'rate_limited', resetAt: resetIso(graphql.resetAt) },
      }
    }
    return { status: 502, body: { error: 'upstream' } }
  }

  const eventsResult = await fetchPublicEvents(token, username)
  if (!eventsResult.ok) {
    if (eventsResult.status === 429) {
      return {
        status: 429,
        body: { error: 'rate_limited', resetAt: resetIso(eventsResult.resetAt) },
      }
    }
    return { status: 502, body: { error: 'upstream' } }
  }

  const body: CachedRecapPayload = {
    user: mapUser(graphql.user),
    repos: mapRepos(graphql.user.login, graphql.user.repositories.nodes),
    events: eventsResult.events,
    contributions: graphql.user.contributionsCollection,
  }

  return {
    status: 200,
    body,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    },
  }
}

export function responseContainsSecret(
  body: unknown,
  token: string | undefined,
): boolean {
  if (!token) return false
  return JSON.stringify(body).includes(token)
}

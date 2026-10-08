import type { CachedRecapPayload, GitHubErrorCode, GitHubEvent, GitHubRepo, GitHubUser } from '../types'

const API_ROOT = 'https://api.github.com'

export class GitHubApiError extends Error {
  readonly status: number
  readonly resetAt: Date | null
  readonly code: GitHubErrorCode

  constructor(
    message: string,
    status: number,
    resetAt: Date | null,
    code: GitHubErrorCode,
  ) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
    this.resetAt = resetAt
    this.code = code
  }
}

interface GitHubResponse<T> {
  data: T
  remaining: number | null
  resetAt: Date | null
  link: string | null
}

function parseHeaderInt(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatRateLimitReset(resetAt: Date | null): string {
  if (!resetAt) return 'a little later'
  return resetAt.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function rateLimitMessage(resetAt: Date | null): string {
  return `GitHub's public hourly limit is spent. It resets at ${formatRateLimitReset(resetAt)}.`
}

function throwIfRateLimited(
  status: number,
  remaining: number | null,
  resetAt: Date | null,
): void {
  if (status === 429 || remaining === 0 || status === 403) {
    throw new GitHubApiError(rateLimitMessage(resetAt), status, resetAt, 'rate_limit')
  }
}

async function githubFetch<T>(path: string): Promise<GitHubResponse<T>> {
  let response: Response
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  } catch {
    throw new GitHubApiError(
      'We could not reach GitHub. Check your connection and try again.',
      0,
      null,
      'network',
    )
  }

  const remaining = parseHeaderInt(response.headers.get('X-RateLimit-Remaining'))
  const resetEpoch = parseHeaderInt(response.headers.get('X-RateLimit-Reset'))
  const resetAt = resetEpoch !== null ? new Date(resetEpoch * 1000) : null
  const link = response.headers.get('Link')

  if (response.status === 404) {
    throw new GitHubApiError(
      'We could not find that GitHub user.',
      404,
      resetAt,
      'not_found',
    )
  }

  if (!response.ok) {
    throwIfRateLimited(response.status, remaining, resetAt)
    throw new GitHubApiError(
      `GitHub returned ${response.status}. Try again in a moment.`,
      response.status,
      resetAt,
      'http',
    )
  }

  const data = (await response.json()) as T
  return { data, remaining, resetAt, link }
}

function hasNextPage(link: string | null): boolean {
  return Boolean(link && /rel="next"/i.test(link))
}

function assertBudget(remaining: number | null, resetAt: Date | null): void {
  if (remaining === 0) {
    throw new GitHubApiError(rateLimitMessage(resetAt), 403, resetAt, 'rate_limit')
  }
}

async function fetchPublicEvents(
  username: string,
  remainingAfterRepos: number | null,
  resetAt: Date | null,
): Promise<GitHubEvent[]> {
  const encoded = encodeURIComponent(username)
  const events: GitHubEvent[] = []
  let remaining = remainingAfterRepos

  for (let page = 1; page <= 3; page += 1) {
    assertBudget(remaining, resetAt)
    try {
      const result = await githubFetch<GitHubEvent[]>(
        `/users/${encoded}/events/public?per_page=100&page=${page}`,
      )
      remaining = result.remaining
      resetAt = result.resetAt
      events.push(...result.data)
      const fullPage = result.data.length >= 100
      if (result.data.length === 0) break
      if (!hasNextPage(result.link) && !fullPage) break
    } catch (error) {
      if (error instanceof GitHubApiError && error.code === 'not_found') {
        return events
      }
      throw error
    }
  }

  return events
}

export function shouldRetryGitHubQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (
    error instanceof GitHubApiError &&
    (error.code === 'not_found' || error.code === 'rate_limit')
  ) {
    return false
  }
  return failureCount < 2
}

export async function fetchRecapData(username: string): Promise<CachedRecapPayload> {
  const encoded = encodeURIComponent(username)
  const userResult = await githubFetch<GitHubUser>(`/users/${encoded}`)
  assertBudget(userResult.remaining, userResult.resetAt)

  const reposResult = await githubFetch<GitHubRepo[]>(
    `/users/${encoded}/repos?per_page=100&sort=pushed`,
  )

  const events = await fetchPublicEvents(
    username,
    reposResult.remaining,
    reposResult.resetAt,
  )

  return {
    user: userResult.data,
    repos: reposResult.data,
    events,
  }
}

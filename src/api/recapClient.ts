import type { ApiRecapErrorBody, CachedRecapPayload } from '../types'
import { GitHubApiError } from './github'

export class RecapApiError extends Error {
  readonly status: number
  readonly code: ApiRecapErrorBody['error']
  readonly resetAt: Date | null

  constructor(
    message: string,
    status: number,
    code: ApiRecapErrorBody['error'],
    resetAt: Date | null = null,
  ) {
    super(message)
    this.name = 'RecapApiError'
    this.status = status
    this.code = code
    this.resetAt = resetAt
  }
}

function parseResetAt(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function shouldUseRecapApi(
  env: { PROD?: boolean; VITE_USE_API?: string } = import.meta.env,
): boolean {
  return Boolean(env.PROD) || env.VITE_USE_API === 'true'
}

function isJsonResponse(response: Response): boolean {
  const type = response.headers.get('content-type') ?? ''
  return type.toLowerCase().includes('application/json')
}

export async function fetchRecapFromApi(
  username: string,
): Promise<CachedRecapPayload> {
  let response: Response
  try {
    response = await fetch(`/api/recap?u=${encodeURIComponent(username)}`)
  } catch {
    throw new RecapApiError(
      'We could not reach the recap API.',
      0,
      'upstream',
    )
  }

  if (!isJsonResponse(response)) {
    throw new RecapApiError(
      'Recap API returned a non-JSON response.',
      502,
      'upstream',
    )
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    throw new RecapApiError(
      'Recap API returned invalid JSON.',
      502,
      'upstream',
    )
  }

  if (response.ok) {
    return body as CachedRecapPayload
  }

  const errorBody = (body ?? {}) as ApiRecapErrorBody
  const code = errorBody.error

  if (response.status === 404 || code === 'not_found') {
    throw new GitHubApiError(
      'We could not find that GitHub user.',
      404,
      parseResetAt(errorBody.resetAt),
      'not_found',
    )
  }

  if (response.status === 429 || code === 'rate_limited') {
    const resetAt = parseResetAt(errorBody.resetAt)
    throw new GitHubApiError(
      `GitHub's hourly limit is spent. It resets at ${resetAt ? resetAt.toLocaleTimeString() : 'a little later'}.`,
      429,
      resetAt,
      'rate_limit',
    )
  }

  if (response.status === 400 || code === 'invalid_username') {
    throw new GitHubApiError(
      'We could not find that GitHub user.',
      400,
      null,
      'not_found',
    )
  }

  throw new RecapApiError('Upstream recap API failed.', response.status, 'upstream')
}

export function shouldFallbackToDirectGitHub(error: unknown): boolean {
  if (error instanceof RecapApiError) {
    return error.status === 0 || error.status === 502 || error.code === 'upstream'
  }
  return false
}

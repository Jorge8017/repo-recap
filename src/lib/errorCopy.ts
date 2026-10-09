import { formatRateLimitReset, GitHubApiError } from '../api/github'

export type RecapErrorKind = 'not_found' | 'rate_limit' | 'network'

export type ErrorIconId = 'search' | 'hourglass' | 'satellite'

export interface ErrorCopy {
  kind: RecapErrorKind
  eyebrow: string
  headline: string
  body: string
  icon: ErrorIconId
}

export const NOT_FOUND_COPY: ErrorCopy = {
  kind: 'not_found',
  eyebrow: 'User not found',
  headline: 'Nobody by that name',
  body: "We couldn't find that GitHub user. Check the spelling and try again.",
  icon: 'search',
}

export const NETWORK_COPY: ErrorCopy = {
  kind: 'network',
  eyebrow: 'Something went wrong',
  headline: "Couldn't load the recap",
  body: 'Check your connection and try again in a moment.',
  icon: 'satellite',
}

export const RATE_LIMIT_COPY: ErrorCopy = {
  kind: 'rate_limit',
  eyebrow: 'Taking a breather',
  headline: 'Too many recaps',
  body: "GitHub's public hourly limit is spent. It resets a little later.",
  icon: 'hourglass',
}

export function presentRecapError(error: unknown): ErrorCopy {
  if (error instanceof GitHubApiError) {
    if (error.code === 'not_found') return NOT_FOUND_COPY
    if (error.code === 'rate_limit') {
      return {
        ...RATE_LIMIT_COPY,
        body: `GitHub's public hourly limit is spent. It resets at ${formatRateLimitReset(error.resetAt)}.`,
      }
    }
  }
  return NETWORK_COPY
}

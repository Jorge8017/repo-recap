import { formatRateLimitReset, GitHubApiError } from '../api/github'

export type RecapErrorKind = 'not_found' | 'rate_limit' | 'network'

export interface ErrorCopy {
  kind: RecapErrorKind
  eyebrow: string
  headline: string
  body: string
  emoji: string
}

export const NOT_FOUND_COPY: ErrorCopy = {
  kind: 'not_found',
  eyebrow: 'User not found',
  headline: 'Nobody by that name',
  body: "We couldn't find that GitHub user. Check the spelling and try again.",
  emoji: '🔍',
}

export const NETWORK_COPY: ErrorCopy = {
  kind: 'network',
  eyebrow: 'Something went wrong',
  headline: "Couldn't load the recap",
  body: 'Check your connection and try again in a moment.',
  emoji: '🛰️',
}

export function presentRecapError(error: unknown): ErrorCopy {
  if (error instanceof GitHubApiError) {
    if (error.code === 'not_found') return NOT_FOUND_COPY
    if (error.code === 'rate_limit') {
      return {
        kind: 'rate_limit',
        eyebrow: 'Taking a breather',
        headline: 'Too many recaps',
        body: `GitHub's public hourly limit is spent. It resets at ${formatRateLimitReset(error.resetAt)}.`,
        emoji: '⏳',
      }
    }
  }
  return NETWORK_COPY
}

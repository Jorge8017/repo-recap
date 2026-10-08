import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { formatRateLimitReset, GitHubApiError } from '../api/github'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export type RecapErrorKind = 'not_found' | 'rate_limit' | 'network'

interface ErrorCopy {
  kind: RecapErrorKind
  eyebrow: string
  headline: string
  body: string
  emoji: string
  showRetry: boolean
}

const NOT_FOUND: ErrorCopy = {
  kind: 'not_found',
  eyebrow: 'User not found',
  headline: 'Nobody by that name',
  body: "We couldn't find that GitHub user. Check the spelling and try again.",
  emoji: '🔍',
  showRetry: false,
}

const NETWORK: ErrorCopy = {
  kind: 'network',
  eyebrow: 'Something went wrong',
  headline: "Couldn't load the recap",
  body: 'Check your connection and try again in a moment.',
  emoji: '🛰️',
  showRetry: true,
}

export function presentRecapError(error: unknown): ErrorCopy {
  if (error instanceof GitHubApiError) {
    if (error.code === 'not_found') return NOT_FOUND
    if (error.code === 'rate_limit') {
      return {
        kind: 'rate_limit',
        eyebrow: 'Taking a breather',
        headline: 'Too many recaps',
        body: `GitHub's public hourly limit is spent. It resets at ${formatRateLimitReset(error.resetAt)}.`,
        emoji: '⏳',
        showRetry: false,
      }
    }
  }
  return NETWORK
}

interface ErrorStateProps {
  error?: unknown
  kind?: RecapErrorKind
  onRetry?: () => void
}

export function ErrorState({ error, kind, onRetry }: ErrorStateProps) {
  const reducedMotion = usePrefersReducedMotion()
  const copy =
    kind === 'not_found'
      ? NOT_FOUND
      : kind === 'network'
        ? NETWORK
        : presentRecapError(error)

  return (
    <div className="relative flex h-full min-h-dvh flex-col bg-gradient-to-br from-[#1a1020] via-[#3a1528] to-[#6b2438] px-7 pt-24 pb-16">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <motion.span
          className="block text-[96px] leading-none"
          aria-hidden="true"
          animate={reducedMotion ? undefined : { y: [0, -12, 0] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {copy.emoji}
        </motion.span>
      </div>
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {copy.eyebrow}
        </p>
        <h1 className="text-4xl leading-tight font-bold">{copy.headline}</h1>
        <p className="mt-4 max-w-[28ch] text-lg text-white/80">{copy.body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          {copy.showRetry && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex w-fit rounded-full bg-[#f6efe4] px-5 py-3 font-semibold text-[#1a1020]"
            >
              Retry
            </button>
          ) : null}
          <Link
            to="/"
            className={
              copy.showRetry && onRetry
                ? 'inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white'
                : 'inline-flex w-fit rounded-full bg-[#f6efe4] px-5 py-3 font-semibold text-[#1a1020]'
            }
          >
            Try another username
          </Link>
        </div>
      </div>
    </div>
  )
}

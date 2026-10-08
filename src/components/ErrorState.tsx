import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import {
  NETWORK_COPY,
  NOT_FOUND_COPY,
  presentRecapError,
  type RecapErrorKind,
} from '../lib/errorCopy'
import { UiButton } from './UiButton'

interface ErrorStateProps {
  error?: unknown
  kind?: RecapErrorKind
  onRetry?: () => void
}

export function ErrorState({ error, kind, onRetry }: ErrorStateProps) {
  const reducedMotion = usePrefersReducedMotion()
  const copy =
    kind === 'not_found'
      ? NOT_FOUND_COPY
      : kind === 'network'
        ? NETWORK_COPY
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
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
          {copy.eyebrow}
        </p>
        <h1 className="text-4xl leading-tight font-bold">{copy.headline}</h1>
        <p className="mt-4 max-w-[28ch] text-lg text-white/85">{copy.body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          {onRetry ? (
            <UiButton onClick={onRetry}>Retry</UiButton>
          ) : null}
          <Link
            to="/"
            className={
              onRetry
                ? 'inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white transition-transform duration-150 hover:bg-white/20 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0c27a]'
                : 'inline-flex w-fit rounded-full bg-[#f6efe4] px-5 py-3 font-semibold text-[#1a1020] transition-transform duration-150 hover:bg-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0c27a]'
            }
          >
            Try another username
          </Link>
        </div>
      </div>
    </div>
  )
}

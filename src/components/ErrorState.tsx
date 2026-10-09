import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import {
  NETWORK_COPY,
  NOT_FOUND_COPY,
  RATE_LIMIT_COPY,
  presentRecapError,
  type ErrorIconId,
  type RecapErrorKind,
} from '../lib/errorCopy'
import {
  ErrorHourglassIcon,
  ErrorSatelliteIcon,
  ErrorSearchIcon,
} from './Icons'
import { BrandLink } from './Logo'
import { UiButton } from './UiButton'

interface ErrorStateProps {
  error?: unknown
  kind?: RecapErrorKind
  onRetry?: () => void
  failedUsername?: string
  headlineOverride?: string
  extraActions?: ReactNode
}

function ErrorGlyph({ icon }: { icon: ErrorIconId }) {
  const props = { width: 96, height: 96, className: 'block' }
  if (icon === 'search') return <ErrorSearchIcon {...props} />
  if (icon === 'hourglass') return <ErrorHourglassIcon {...props} />
  return <ErrorSatelliteIcon {...props} />
}

export function ErrorState({
  error,
  kind,
  onRetry,
  failedUsername,
  headlineOverride,
  extraActions,
}: ErrorStateProps) {
  const reducedMotion = usePrefersReducedMotion()
  const copy =
    kind === 'not_found'
      ? NOT_FOUND_COPY
      : kind === 'network'
        ? NETWORK_COPY
        : kind === 'rate_limit'
          ? RATE_LIMIT_COPY
          : presentRecapError(error)

  const headline =
    headlineOverride ??
    (failedUsername && copy.kind === 'not_found'
      ? `We couldn't find @${failedUsername.replace(/^@/, '')}`
      : copy.headline)

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{
        background:
          'radial-gradient(700px 520px at 50% 50%, rgba(196,59,92,0.28), transparent 70%), #0B0812',
      }}
    >
      <header className="flex items-center justify-between px-5 py-5 lg:px-10 lg:py-6">
        <BrandLink />
      </header>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-end px-7 pt-10 pb-16 lg:justify-center">
        <motion.div
          className="mb-8"
          aria-hidden="true"
          animate={reducedMotion ? undefined : { y: [0, -12, 0] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <ErrorGlyph icon={copy.icon} />
        </motion.div>
        <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-[#F2C46D] uppercase">
          {copy.eyebrow}
        </p>
        <h1 className="text-4xl leading-tight font-bold">{headline}</h1>
        <p className="mt-4 max-w-[28ch] text-lg text-[#C9BFD6]">{copy.body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          {onRetry ? <UiButton onClick={onRetry}>Retry</UiButton> : null}
          <Link
            to="/"
            className={
              onRetry
                ? 'inline-flex w-fit items-center rounded-[14px] border border-[rgba(244,237,226,0.22)] bg-white/[0.04] px-5 py-3 font-semibold text-[#F4EDE2] transition-transform duration-150 hover:bg-white/10 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D]'
                : 'inline-flex w-fit items-center rounded-[14px] bg-[#F4EDE2] px-5 py-3 font-semibold text-[#1A0B22] transition-transform duration-150 hover:bg-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D]'
            }
          >
            Try another username
          </Link>
        </div>
        {extraActions}
      </div>
    </div>
  )
}

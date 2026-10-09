import type { ReactNode } from 'react'

interface SlideShellProps {
  announcement: string
  gradient: string
  children: ReactNode
  fill?: boolean
  footer?: ReactNode
  pinBottom?: boolean
}

export function SlideShell({
  announcement,
  gradient,
  children,
  fill = false,
  footer,
  pinBottom = true,
}: SlideShellProps) {
  return (
    <section
      className={`relative flex h-full min-h-0 flex-col overflow-hidden ${fill ? 'px-5 py-4' : 'px-5 pb-5 lg:px-8 lg:pb-6 pt-[var(--story-chrome,5.75rem)]'} ${gradient}`}
      aria-label={announcement}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 80% 12%, rgba(255,170,90,0.18), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(0,0,0,0.22), transparent 50%)',
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden ${fill ? '' : 'justify-center gap-5'}`}
      >
        {children}
      </div>
      {pinBottom && footer ? (
        <div className="relative z-10 flex shrink-0 items-end justify-between gap-4 pt-4 text-[13px] text-[#E9B9A0]">
          <div>{footer}</div>
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#E9B9A0]/80 uppercase lg:hidden">
            Tap → next
          </span>
        </div>
      ) : pinBottom ? (
        <p className="relative z-10 shrink-0 pt-3 text-right font-mono text-[11px] tracking-[0.1em] text-white/45 uppercase lg:hidden">
          Tap → next
        </p>
      ) : null}
    </section>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-white/70 uppercase lg:text-xs">
      {children}
    </p>
  )
}

export function Headline({ children }: { children: ReactNode }) {
  return (
    <h2 className="shrink-0 text-[clamp(1.5rem,4.2vh,2.125rem)] leading-[1.1] font-medium tracking-[-0.02em] text-[#F4EDE2]">
      {children}
    </h2>
  )
}

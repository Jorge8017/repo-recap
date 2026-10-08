import type { ReactNode } from 'react'

interface SlideShellProps {
  announcement: string
  gradient: string
  children: ReactNode
}

export function SlideShell({ announcement, gradient, children }: SlideShellProps) {
  return (
    <section
      className={`relative flex h-full min-h-0 flex-col justify-end overflow-hidden px-7 pb-16 pt-24 ${gradient}`}
      aria-label={announcement}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.16), transparent 42%), radial-gradient(ellipse at 90% 80%, rgba(0,0,0,0.28), transparent 50%)',
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end">
        {children}
      </div>
    </section>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
      {children}
    </p>
  )
}

export function Headline({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[2.65rem] leading-[1.05] font-bold tracking-tight text-[#f6efe4] sm:text-5xl">
      {children}
    </h2>
  )
}

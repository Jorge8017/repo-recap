import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { SLIDE_STAGE_GLOW, slideKicker } from '../lib/slideMeta'
import { planSlides } from '../lib/slidePlan'
import type { RecapResult, SlideId } from '../types'
import { BrandLink } from './Logo'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PauseIcon,
  PlayIcon,
} from './Icons'
import { SLIDE_COMPONENTS, SummarySlide } from './slides'

const SLIDE_MS = 5000
const HOLD_MS = 200

export function StoryPlayer({
  recap,
  avatarSrc,
}: {
  recap: RecapResult
  avatarSrc: string
}) {
  const { stats, personality } = recap
  const slides = useMemo(() => planSlides(stats), [stats])
  const reducedMotion = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const progress = useMotionValue(0)
  const pausedRef = useRef(false)
  const holdTimerRef = useRef<number | null>(null)
  const pausedByHoldRef = useRef(false)
  const pausedByVisibilityRef = useRef(false)
  const chromeRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const currentId: SlideId = slides[index] ?? 'intro'
  const isSummary = currentId === 'summary'
  const slideProps = { stats, personality, reducedMotion, avatarSrc }
  const kicker = slideKicker(index, slides.length, currentId)

  useLayoutEffect(() => {
    if (isSummary) return
    const chrome = chromeRef.current
    const card = cardRef.current
    if (!chrome || !card) return
    const sync = () => {
      card.style.setProperty('--story-chrome', `${chrome.offsetHeight}px`)
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(chrome)
    return () => observer.disconnect()
  }, [kicker, isSummary])

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(slides.length - 1, current + 1))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1))
  }, [])

  const replay = useCallback(() => {
    setIndex(0)
    setPaused(false)
    progress.set(0)
  }, [progress])

  const close = useCallback(() => navigate('/'), [navigate])

  useEffect(() => {
    progress.set(0)
  }, [index, progress])

  useEffect(() => {
    if (isSummary || reducedMotion) {
      progress.set(1)
      return
    }
    if (paused) return

    const remaining = Math.max(0.05, (1 - progress.get()) * (SLIDE_MS / 1000))
    const controls = animate(progress, 1, {
      duration: remaining,
      ease: 'linear',
      onComplete: () => {
        if (index < slides.length - 1) {
          setIndex((current) => current + 1)
        }
      },
    })

    return () => controls.stop()
  }, [index, paused, reducedMotion, slides.length, progress, isSummary])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const inControl = target?.closest('button, a, input, textarea')
      if (event.key === ' ' && inControl) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === ' ') {
        event.preventDefault()
        setPaused((value) => !value)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, close])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (!pausedRef.current) {
          pausedByVisibilityRef.current = true
          setPaused(true)
        }
        return
      }
      if (pausedByVisibilityRef.current) {
        pausedByVisibilityRef.current = false
        setPaused(false)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isSummary) return
    if ((event.target as HTMLElement).closest('button, a')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    holdTimerRef.current = window.setTimeout(() => {
      if (pausedRef.current) return
      pausedByHoldRef.current = true
      setPaused(true)
    }, HOLD_MS)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    clearHoldTimer()
    if (pausedByHoldRef.current) {
      pausedByHoldRef.current = false
      setPaused(false)
      return
    }
    if (isSummary) return
    if ((event.target as HTMLElement).closest('button, a')) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    if (x < bounds.width / 3) {
      goPrev()
    } else if (x > (bounds.width * 2) / 3) {
      goNext()
    }
  }

  const onPointerCancel = () => {
    clearHoldTimer()
    if (pausedByHoldRef.current) {
      pausedByHoldRef.current = false
      setPaused(false)
    }
  }

  const renderSlide = (id: SlideId) => {
    if (id === 'summary') {
      return (
        <SummarySlide
          {...slideProps}
          onReplay={replay}
          slideCount={slides.length}
        />
      )
    }
    const Slide = SLIDE_COMPONENTS[id]
    return <Slide {...slideProps} />
  }

  const userChip = (
    <div className="flex items-center gap-2.5">
      <img
        src={avatarSrc}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover bg-[#5B3A6E]"
      />
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold">{stats.displayName}</span>
        <span className="text-xs text-[#B9AEC9] lg:text-[13px]">@{stats.username}</span>
      </div>
    </div>
  )

  return (
    <div
      className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden touch-manipulation select-none"
      style={{
        background: `${SLIDE_STAGE_GLOW[currentId]}, #0B0812`,
      }}
    >
      <header className="hidden w-full shrink-0 items-center justify-between gap-4 px-6 py-4 lg:flex lg:px-10">
        <BrandLink />
        {isSummary ? <span className="flex-1" /> : userChip}
        <CloseButton onClick={close} />
      </header>

      {isSummary ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {renderSlide('summary')}
        </div>
      ) : (
        <>
          <main className="flex min-h-0 flex-1 items-center justify-center gap-6 overflow-hidden px-0 lg:gap-8 lg:px-6">
            <RoundNav
              className="hidden lg:flex"
              label="Previous slide"
              onClick={goPrev}
              disabled={index === 0}
            >
              <ChevronLeftIcon width={22} height={22} />
            </RoundNav>

            <div
              ref={cardRef}
              data-testid="story-card"
              className="relative flex h-full w-full min-h-0 flex-col overflow-hidden lg:h-[min(746px,100%)] lg:w-[420px] lg:rounded-[32px] lg:shadow-[0_50px_100px_rgba(0,0,0,0.55)]"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${currentId}-${index}`}
                    className="absolute inset-0"
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {renderSlide(currentId)}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div
                ref={chromeRef}
                className="relative z-30 shrink-0 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-8 lg:pt-5"
              >
                <div className="flex gap-1" aria-hidden="true">
                  {slides.map((id, slideIndex) => (
                    <ProgressSegment
                      key={id}
                      status={
                        slideIndex < index
                          ? 'done'
                          : slideIndex === index
                            ? 'active'
                            : 'idle'
                      }
                      progress={progress}
                      reducedMotion={reducedMotion}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 pt-3">
                  <div className="min-w-0 lg:hidden">{userChip}</div>
                  <p className="hidden min-w-0 truncate font-mono text-[11px] tracking-[0.16em] text-[#FFC9A8] uppercase lg:block lg:text-xs">
                    {kicker}
                  </p>
                  <div className="ml-auto flex shrink-0 gap-1.5">
                    <IconCircle
                      label={paused ? 'Play' : 'Pause'}
                      onClick={() => setPaused((value) => !value)}
                    >
                      {paused ? (
                        <PlayIcon width={16} height={16} />
                      ) : (
                        <PauseIcon width={16} height={16} />
                      )}
                    </IconCircle>
                    <CloseButton onClick={close} className="lg:hidden" />
                  </div>
                </div>
                <p className="pt-3 font-mono text-[11px] tracking-[0.16em] text-[#FFC9A8] uppercase lg:hidden">
                  {kicker}
                </p>
              </div>
            </div>

            <RoundNav
              className="hidden lg:flex"
              label="Next slide"
              onClick={goNext}
              disabled={index >= slides.length - 1}
              primary
            >
              <ChevronRightIcon width={22} height={22} />
            </RoundNav>
          </main>

          <footer className="hidden shrink-0 justify-center gap-6 px-6 py-4 font-mono text-xs tracking-[0.08em] text-[#8F84A0] uppercase lg:flex">
            <span className="inline-flex items-center gap-2">
              <Kbd>←</Kbd> <Kbd>→</Kbd> Navigate
            </span>
            <span className="inline-flex items-center gap-2">
              <Kbd>Space</Kbd> Pause
            </span>
            <span className="inline-flex items-center gap-2">
              <Kbd>Esc</Kbd> Close
            </span>
          </footer>
        </>
      )}
    </div>
  )
}

function ProgressSegment({
  status,
  progress,
  reducedMotion,
}: {
  status: 'done' | 'active' | 'idle'
  progress: MotionValue<number>
  reducedMotion: boolean
}) {
  const scaleX = useTransform(progress, (value) => {
    if (status === 'done' || (status === 'active' && reducedMotion)) return 1
    if (status === 'idle') return 0
    return value
  })

  return (
    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#F4EDE2]/25">
      <motion.div
        className="h-full w-full origin-left rounded-full bg-[#F4EDE2]"
        style={{ scaleX }}
      />
    </div>
  )
}

function CloseButton({
  onClick,
  className = '',
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close recap"
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4EDE2] transition-transform duration-150 hover:bg-white/16 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D] ${className}`}
    >
      <CloseIcon width={18} height={18} />
    </button>
  )
}

function IconCircle({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-[#F4EDE2] transition-transform duration-150 hover:bg-black/40 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D]"
    >
      {children}
    </button>
  )
}

function RoundNav({
  label,
  onClick,
  disabled,
  primary = false,
  className = '',
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`h-14 w-14 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D] disabled:opacity-30 ${
        primary
          ? 'bg-[#F4EDE2] text-[#1A0B22] hover:bg-white'
          : 'border border-[rgba(244,237,226,0.2)] bg-white/[0.04] text-[#F4EDE2] hover:bg-white/10'
      } ${className}`}
    >
      {children}
    </button>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[5px] border border-[rgba(244,237,226,0.25)] px-[7px] py-[3px] text-[#C9BFD6] normal-case">
      {children}
    </span>
  )
}

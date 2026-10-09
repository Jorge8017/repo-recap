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
import {
  compareSlideKicker,
  planCompareSlides,
  type CompareSlideId,
} from '../lib/compare'
import {
  assertPngBlob,
  downloadPngBlob,
  IMAGE_API_TOAST,
  IMAGE_CREATE_TOAST,
  ShareImageApiUnavailableError,
} from '../lib/downloadImage'
import { LINK_COPIED_TOAST } from '../lib/share'
import { siteOrigin } from '../lib/site'
import type { RecapResult } from '../types'
import {
  COMPARE_SLIDE_COMPONENTS,
  CompareScoreSlide,
  type CompareSlideProps,
} from './compare/CompareSlides'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PauseIcon,
  PlayIcon,
} from './Icons'
import { BrandLink } from './Logo'

const SLIDE_MS = 5000
const HOLD_MS = 200

declare global {
  interface Window {
    __REPO_RECAP_SLIDE_MOUNTS__?: Record<string, number>
  }
}

function SlideMountProbe({ id }: { id: CompareSlideId }) {
  useEffect(() => {
    const mounts = (window.__REPO_RECAP_SLIDE_MOUNTS__ ??= {})
    mounts[id] = (mounts[id] ?? 0) + 1
    if (import.meta.env.DEV) {
      console.warn(`[slide-mount] ${id} #${mounts[id]}`)
    }
  }, [id])
  return null
}

async function fetchCompareImagePng(a: string, b: string): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(
      `/api/compare-image?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
    )
  } catch {
    throw new ShareImageApiUnavailableError()
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    throw new ShareImageApiUnavailableError()
  }
  if (!response.ok) {
    throw new Error(`compare-image HTTP ${response.status}`)
  }
  const raw = await response.blob()
  const png =
    raw.type === 'image/png'
      ? raw
      : new Blob([await raw.arrayBuffer()], { type: 'image/png' })
  return assertPngBlob(png)
}

export function ComparePlayer({
  a,
  b,
  avatarA,
  avatarB,
}: {
  a: RecapResult
  b: RecapResult
  avatarA: string
  avatarB: string
}) {
  const slides = useMemo(() => planCompareSlides(a, b), [a, b])
  const reducedMotion = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
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

  const currentId: CompareSlideId = slides[index] ?? 'compare-intro'
  const isSummary = currentId === 'compare-score'
  const kicker = compareSlideKicker(index, slides.length, currentId)

  useLayoutEffect(() => {
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

  const swap = useCallback(() => {
    navigate(
      `/vs/${encodeURIComponent(b.stats.username)}/${encodeURIComponent(a.stats.username)}`,
    )
  }, [navigate, a.stats.username, b.stats.username])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }

  const onDownload = async () => {
    setDownloading(true)
    try {
      const blob = await fetchCompareImagePng(a.stats.username, b.stats.username)
      downloadPngBlob(
        blob,
        `repo-recap-${a.stats.username}-vs-${b.stats.username}.png`,
      )
    } catch (error) {
      showToast(
        error instanceof ShareImageApiUnavailableError
          ? IMAGE_API_TOAST
          : IMAGE_CREATE_TOAST,
      )
    } finally {
      setDownloading(false)
    }
  }

  const onCopyLink = async () => {
    const url = `${siteOrigin()}/vs/${encodeURIComponent(a.stats.username)}/${encodeURIComponent(b.stats.username)}`
    await navigator.clipboard.writeText(url)
    showToast(LINK_COPIED_TOAST)
  }

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
    if (x < bounds.width / 3) goPrev()
    else if (x > (bounds.width * 2) / 3) goNext()
  }

  const onPointerCancel = () => {
    clearHoldTimer()
    if (pausedByHoldRef.current) {
      pausedByHoldRef.current = false
      setPaused(false)
    }
  }

  const slideProps: CompareSlideProps = {
    a,
    b,
    avatarA,
    avatarB,
    slideCount: slides.length,
    onReplay: replay,
    onSwap: swap,
    onDownload,
    onCopyLink,
    downloading,
    toast,
  }

  const renderSlide = (id: CompareSlideId) => {
    if (id === 'compare-score') {
      return <CompareScoreSlide {...slideProps} />
    }
    const Slide = COMPARE_SLIDE_COMPONENTS[id]
    return <Slide {...slideProps} />
  }

  return (
    <div
      className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden touch-manipulation select-none"
      style={{
        background:
          'radial-gradient(760px 560px at 50% 40%, rgba(140,50,170,0.32), transparent 70%), #0B0812',
      }}
    >
      <header className="hidden w-full shrink-0 items-center justify-between gap-4 px-6 py-4 lg:flex lg:px-10">
        <BrandLink />
        <span className="font-mono text-xs tracking-[0.14em] text-[#F2C46D] uppercase">
          @{a.stats.username} vs @{b.stats.username}
        </span>
        <CloseButton onClick={close} />
      </header>

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
          className="story-card relative flex h-full w-full min-h-0 flex-col overflow-hidden lg:h-[min(746px,100%)] lg:w-[min(720px,92vw)] lg:rounded-[32px] lg:shadow-[0_50px_100px_rgba(0,0,0,0.55)]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#2A1240] to-[#1B0A2B]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentId}
                data-testid={`slide-${currentId}`}
                data-slide-id={currentId}
                className="absolute inset-0"
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <SlideMountProbe id={currentId} />
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
              <p className="min-w-0 truncate font-mono text-[11px] tracking-[0.16em] text-[#FFC9A8] uppercase lg:text-xs">
                {kicker}
              </p>
              <div className="ml-auto flex shrink-0 gap-1.5">
                {!isSummary ? (
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
                ) : null}
                <CloseButton onClick={close} className="lg:hidden" />
              </div>
            </div>
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
      aria-label="Close compare"
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4EDE2] ${className}`}
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-[#F4EDE2]"
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
      className={`h-14 w-14 items-center justify-center rounded-full disabled:opacity-30 ${
        primary
          ? 'bg-[#F4EDE2] text-[#1A0B22]'
          : 'border border-[rgba(244,237,226,0.2)] bg-white/[0.04] text-[#F4EDE2]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

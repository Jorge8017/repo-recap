import { AnimatePresence, motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { planSlides } from '../lib/slidePlan'
import type { RecapResult, SlideId } from '../types'
import { SLIDE_COMPONENTS, SummarySlide } from './slides'

const SLIDE_MS = 5000
const HOLD_MS = 200

export function StoryPlayer({ recap }: { recap: RecapResult }) {
  const { stats, personality } = recap
  const slides = useMemo(() => planSlides(stats), [stats])
  const reducedMotion = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const progressRef = useRef(0)
  const pausedRef = useRef(false)
  const holdTimerRef = useRef<number | null>(null)
  const pausedByHoldRef = useRef(false)

  pausedRef.current = paused

  const currentId: SlideId = slides[index] ?? 'intro'
  const slideProps = { stats, personality, reducedMotion }

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(slides.length - 1, current + 1))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1))
  }, [])

  const replay = useCallback(() => {
    setIndex(0)
    setPaused(false)
  }, [])

  useEffect(() => {
    progressRef.current = 0
    setProgress(0)
  }, [index])

  useEffect(() => {
    if (reducedMotion || paused) return

    const remaining = (1 - progressRef.current) * SLIDE_MS
    if (index >= slides.length - 1 && progressRef.current >= 1) return

    const started = performance.now()
    const startProgress = progressRef.current
    let frame = 0

    const tick = (now: number) => {
      const next = Math.min(1, startProgress + (now - started) / SLIDE_MS)
      progressRef.current = next
      setProgress(next)
      if (next < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)

    const timeout = window.setTimeout(() => {
      if (index < slides.length - 1) {
        setIndex((current) => current + 1)
      } else {
        progressRef.current = 1
        setProgress(1)
      }
    }, Math.max(16, remaining))

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [index, paused, reducedMotion, slides.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
        navigate('/')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, navigate])

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
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
      return <SummarySlide {...slideProps} onReplay={replay} />
    }
    const Slide = SLIDE_COMPONENTS[id]
    return <Slide {...slideProps} />
  }

  return (
    <div
      className="relative h-full min-h-dvh w-full touch-manipulation select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex gap-1">
          {slides.map((id, slideIndex) => (
            <div
              key={id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: barWidth(slideIndex, index, progress, reducedMotion),
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-[max(1.75rem,calc(env(safe-area-inset-top)+1.25rem))] left-3 z-40 rounded-full bg-black/25 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm hover:bg-black/40"
        aria-label="Back to landing"
      >
        Close
      </button>

      {paused && !reducedMotion ? (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 px-4 py-2 text-sm font-semibold tracking-wide text-white uppercase">
          Paused
        </div>
      ) : null}

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
  )
}

function barWidth(
  slideIndex: number,
  currentIndex: number,
  progress: number,
  reducedMotion: boolean,
): string {
  if (slideIndex < currentIndex) return '100%'
  if (slideIndex > currentIndex) return '0%'
  if (reducedMotion) return '100%'
  return `${Math.round(progress * 1000) / 10}%`
}

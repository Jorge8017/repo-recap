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

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const currentId: SlideId = slides[index] ?? 'intro'
  const slideProps = { stats, personality, reducedMotion, avatarSrc }

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

  useEffect(() => {
    progress.set(0)
  }, [index, progress])

  useEffect(() => {
    if (reducedMotion) {
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
  }, [index, paused, reducedMotion, slides.length, progress])

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
        navigate('/')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, navigate])

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
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-[max(1.75rem,calc(env(safe-area-inset-top)+1.25rem))] left-3 z-40 rounded-full bg-black/25 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-transform duration-150 hover:bg-black/40 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0c27a]"
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
    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
      <motion.div
        className="h-full w-full origin-left rounded-full bg-white"
        style={{ scaleX }}
      />
    </div>
  )
}

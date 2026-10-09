import { useLayoutEffect, useState, type RefObject } from 'react'

export function fitTextSize(
  maxSize: number,
  minSize: number,
  parentWidth: number,
  scrollWidth: number,
): number {
  if (parentWidth < 1 || scrollWidth <= parentWidth) return maxSize
  return Math.max(
    minSize,
    Math.floor((maxSize * parentWidth) / scrollWidth),
  )
}

export function useFitText(
  ref: RefObject<HTMLElement | null>,
  maxSize: number,
  minSize: number,
  wrapAtMin = false,
  onUpdate?: (size: number) => void,
): number {
  const [size, setSize] = useState(maxSize)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    let cancelled = false
    let frame = 0
    let lastWidth = -1

    const apply = () => {
      if (cancelled) return

      el.style.display = 'inline-block'
      el.style.maxWidth = '100%'
      el.style.whiteSpace = 'nowrap'
      el.style.overflowWrap = 'normal'
      el.style.fontSize = `${maxSize}px`

      const measured = fitTextSize(
        maxSize,
        minSize,
        parent.clientWidth,
        el.scrollWidth,
      )
      const next = Math.round(measured)
      el.style.fontSize = `${next}px`

      if (wrapAtMin && next <= minSize && el.scrollWidth > parent.clientWidth) {
        el.style.whiteSpace = 'normal'
        el.style.overflowWrap = 'anywhere'
      }

      setSize((prev) => {
        if (Math.abs(prev - next) < 1) return prev
        onUpdate?.(next)
        return next
      })
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    apply()
    lastWidth = parent.clientWidth

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const width = entry.contentRect.width
      if (Math.abs(width - lastWidth) < 1) return
      lastWidth = width
      schedule()
    })
    observer.observe(parent)

    const fonts = document.fonts
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        if (!cancelled) schedule()
      })
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [maxSize, minSize, onUpdate, ref, wrapAtMin])

  return size
}

export type FitTextOnceResult = {
  size: number
  ready: boolean
  /** Pixel width of the final value at the fitted size. */
  reservedWidth: number
  /** True when wrapAtMin kicked in because the final value still overflows. */
  wrap: boolean
}

/**
 * Fit font size from a dedicated sizer that holds the FINAL value only.
 * Waits for document.fonts before the first committed size so the visible
 * hero never flashes maxSize then snaps. Measures once per contentKey once
 * the parent has a real width.
 */
export function useFitTextOnce(
  ref: RefObject<HTMLElement | null>,
  contentKey: string,
  maxSize: number,
  minSize: number,
  wrapAtMin = false,
): FitTextOnceResult {
  const [size, setSize] = useState(maxSize)
  const [ready, setReady] = useState(false)
  const [reservedWidth, setReservedWidth] = useState(0)
  const [wrap, setWrap] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    let cancelled = false
    let observer: ResizeObserver | null = null
    setReady(false)
    setWrap(false)

    const measure = (): boolean => {
      if (cancelled) return false
      const parentWidth = parent.clientWidth
      // Parent is often 0 on the first layout pass; wait for a real width.
      if (parentWidth < 8) return false

      el.style.display = 'inline-block'
      el.style.maxWidth = '100%'
      el.style.whiteSpace = 'nowrap'
      el.style.overflowWrap = 'normal'
      el.style.fontSize = `${maxSize}px`
      const next = Math.round(
        fitTextSize(maxSize, minSize, parentWidth, el.scrollWidth),
      )
      el.style.fontSize = `${next}px`

      let nextWrap = false
      if (wrapAtMin && next <= minSize && el.scrollWidth > parentWidth) {
        el.style.whiteSpace = 'normal'
        el.style.overflowWrap = 'anywhere'
        nextWrap = true
      }

      setSize(next)
      setWrap(nextWrap)
      setReservedWidth(nextWrap ? 0 : Math.ceil(el.scrollWidth))
      setReady(true)
      observer?.disconnect()
      observer = null
      return true
    }

    const start = () => {
      if (measure()) return
      observer = new ResizeObserver(() => {
        measure()
      })
      observer.observe(parent)
    }

    if (!document.fonts || document.fonts.status === 'loaded') {
      start()
    } else {
      void document.fonts.ready.then(() => {
        if (!cancelled) start()
      })
    }

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [contentKey, maxSize, minSize, ref, wrapAtMin])

  return { size, ready, reservedWidth, wrap }
}

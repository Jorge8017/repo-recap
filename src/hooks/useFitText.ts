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

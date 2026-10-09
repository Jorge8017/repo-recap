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
): number {
  const [size, setSize] = useState(maxSize)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    let cancelled = false
    let frame = 0

    const apply = () => {
      if (cancelled) return

      el.style.display = 'inline-block'
      el.style.maxWidth = '100%'
      el.style.whiteSpace = 'nowrap'
      el.style.overflowWrap = 'normal'
      el.style.fontSize = `${maxSize}px`

      const next = fitTextSize(
        maxSize,
        minSize,
        parent.clientWidth,
        el.scrollWidth,
      )
      el.style.fontSize = `${next}px`

      if (wrapAtMin && next <= minSize && el.scrollWidth > parent.clientWidth) {
        el.style.whiteSpace = 'normal'
        el.style.overflowWrap = 'anywhere'
      }

      setSize((prev) => (prev === next ? prev : next))
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    apply()

    const observer = new ResizeObserver(schedule)
    observer.observe(parent)

    const mutations = new MutationObserver(schedule)
    mutations.observe(el, {
      characterData: true,
      childList: true,
      subtree: true,
    })

    const fonts = document.fonts
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        schedule()
      })
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      mutations.disconnect()
    }
  }, [maxSize, minSize, ref, wrapAtMin])

  return size
}

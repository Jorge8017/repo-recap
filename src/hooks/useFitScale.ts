import { useEffect, useRef, useState } from 'react'

export function useFitScale(naturalWidth: number, naturalHeight: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const update = (width: number, height: number) => {
      if (width < 1 || height < 1) return
      setScale(Math.min(width / naturalWidth, height / naturalHeight))
    }

    update(node.clientWidth, node.clientHeight)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [naturalWidth, naturalHeight])

  return { ref, scale }
}

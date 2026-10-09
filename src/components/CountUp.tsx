import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { formatCount } from '../lib/stats'

interface CountUpProps {
  value: number
  reducedMotion: boolean
  className?: string
  /** Stable id for this visit; changing it restarts the animation. */
  visitKey?: string
}

export function CountUp({
  value,
  reducedMotion,
  className,
  visitKey,
}: CountUpProps) {
  const finalText = formatCount(value)
  const [display, setDisplay] = useState(reducedMotion ? value : 0)
  const runKey = visitKey ?? String(value)

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value)
      return
    }

    setDisplay(0)
    const controls = animate(0, value, {
      duration: Math.min(1.6, 0.6 + Math.log10(Math.max(value, 1)) * 0.35),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })

    return () => controls.stop()
  }, [value, reducedMotion, runKey])

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        // Reserve final glyph width so counting digits never reflow layout.
        minWidth: `${finalText.length}ch`,
      }}
    >
      {formatCount(display)}
    </span>
  )
}

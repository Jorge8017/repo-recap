import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { formatCount } from '../lib/stats'

interface CountUpProps {
  value: number
  reducedMotion: boolean
  className?: string
}

export function CountUp({ value, reducedMotion, className }: CountUpProps) {
  const [display, setDisplay] = useState(reducedMotion ? value : 0)

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value)
      return
    }

    const controls = animate(0, value, {
      duration: Math.min(1.6, 0.6 + Math.log10(Math.max(value, 1)) * 0.35),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })

    return () => controls.stop()
  }, [value, reducedMotion])

  return <span className={className}>{formatCount(display)}</span>
}

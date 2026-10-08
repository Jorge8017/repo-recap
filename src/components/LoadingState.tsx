import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const MESSAGES = [
  'Counting stars in public…',
  'Reading commit tea leaves…',
  'Charting your constellation…',
  'Measuring streak stamina…',
  'Sorting languages by vibes…',
  'Winding the recap reel…',
]

export function LoadingState() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % MESSAGES.length)
    }, 1800)
    return () => window.clearInterval(id)
  }, [])

  const message = MESSAGES[index] ?? 'Winding the recap reel…'

  return (
    <div className="relative flex h-full min-h-dvh flex-col justify-end bg-gradient-to-br from-[#1a1033] via-[#2a1548] to-[#4a2d7a] px-7 pt-24 pb-16">
      <div className="absolute inset-x-0 top-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((slot) => (
            <div key={slot} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-white/50" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-8 h-24 w-24 animate-pulse rounded-3xl bg-white/15" />
      <div className="mb-3 h-3 w-28 animate-pulse rounded-full bg-white/20" />
      <div className="mb-2 h-12 w-4/5 animate-pulse rounded-2xl bg-white/15" />
      <div className="mb-10 h-12 w-2/3 animate-pulse rounded-2xl bg-white/10" />
      <div className="h-16">
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-lg text-white/80"
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

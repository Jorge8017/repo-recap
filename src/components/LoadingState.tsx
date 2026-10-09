import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BrandLink } from './Logo'

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
    <div
      className="flex min-h-dvh flex-col"
      style={{
        background:
          'radial-gradient(700px 520px at 50% 40%, rgba(122,45,74,0.38), transparent 70%), #0B0812',
      }}
    >
      <header className="hidden items-center justify-between px-10 py-6 lg:flex">
        <BrandLink />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div
          className="flex h-[min(746px,100dvh)] w-full max-w-[420px] flex-col justify-end rounded-[32px] px-7 pt-24 pb-16"
          style={{
            background:
              'radial-gradient(340px 300px at 80% 12%, rgba(199,92,255,0.28), transparent 70%), linear-gradient(170deg, #3A1250, #1B0A2B)',
            boxShadow: '0 50px 100px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          <div className="mb-8 h-16 w-16 animate-pulse rounded-2xl bg-white/15 lg:h-24 lg:w-24 lg:rounded-3xl" />
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
      </div>
    </div>
  )
}

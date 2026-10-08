import { motion } from 'framer-motion'
import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

export function PersonalitySlide({ personality, reducedMotion }: SlideProps) {
  return (
    <SlideShell
      announcement={`Personality: ${personality.title}. ${personality.description}`}
      gradient="bg-gradient-to-br from-[#14081c] via-[#4a1468] to-[#b03ad1]"
    >
      <Kicker>The reveal</Kicker>
      <motion.p
        className="mb-4 text-7xl"
        initial={reducedMotion ? false : { scale: 0.4, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 260, damping: 14, delay: 0.08 }
        }
        aria-hidden="true"
      >
        {personality.emoji}
      </motion.p>
      <p className="mb-2 text-xl text-white/80">If this recap had a name</p>
      <Headline>{personality.title}</Headline>
      <p className="mt-5 max-w-[22ch] text-lg leading-snug text-white/80">
        {personality.description}
      </p>
    </SlideShell>
  )
}

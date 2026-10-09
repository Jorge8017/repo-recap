import { motion } from 'framer-motion'
import type { SlideProps } from '../../types'
import { PersonalityIcon } from '../PersonalityIcon'
import { Headline, SlideShell } from './SlideShell'

export function QuietSlide({ reducedMotion }: SlideProps) {
  return (
    <SlideShell
      announcement="Your public profile is a blank canvas. Most work happens in private repos — publish a project to unlock your full recap."
      gradient="bg-gradient-to-br from-[#12151c] via-[#2a3348] to-[#5c6b88]"
    >
      <motion.div
        className="mb-8"
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.55 }}
        aria-hidden="true"
      >
        <PersonalityIcon id="ghost-mode" size={72} />
      </motion.div>
      <Headline>Your public profile is a blank canvas.</Headline>
      <p className="mt-5 max-w-[24ch] text-lg leading-snug text-white/80">
        Most work happens in private repos — publish a project to unlock your
        full recap.
      </p>
    </SlideShell>
  )
}

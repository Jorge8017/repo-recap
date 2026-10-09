import { motion } from 'framer-motion'
import type { SlideProps } from '../../types'
import { PersonalityIcon } from '../PersonalityIcon'
import { Headline, SlideShell } from './SlideShell'

export function PersonalitySlide({ personality, reducedMotion }: SlideProps) {
  return (
    <SlideShell
      announcement={`Personality: ${personality.title}. ${personality.description}`}
      gradient="bg-gradient-to-br from-[#3A1250] via-[#1B0A2B] to-[#14081c]"
    >
      <motion.div
        className="mb-4"
        initial={reducedMotion ? false : { scale: 0.4, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 260, damping: 14, delay: 0.08 }
        }
        aria-hidden="true"
      >
        <PersonalityIcon id={personality.id} size={72} />
      </motion.div>
      <p className="mb-2 text-xl text-white/80">If this recap had a name</p>
      <Headline>{personality.title}</Headline>
      <p className="mt-5 max-w-[22ch] text-lg leading-snug text-[#D7C7E6]">
        {personality.description}
      </p>
    </SlideShell>
  )
}

import { motion } from 'framer-motion'
import { LANGUAGE_BAR_COLORS } from '../../lib/slideMeta'
import type { SlideProps } from '../../types'
import { Headline, SlideShell } from './SlideShell'

export function LanguagesSlide({ stats, reducedMotion }: SlideProps) {
  const names = stats.topLanguages.map((item) => item.name).join(', ')

  return (
    <SlideShell
      announcement={`Top languages: ${names}.`}
      gradient="bg-gradient-to-br from-[#1a1040] via-[#2c1d73] to-[#6b3ac9]"
    >
      <Headline>The tongues you speak</Headline>
      <ul className="mt-8 space-y-4">
        {stats.topLanguages.map((language, index) => (
          <motion.li
            key={language.name}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.4, delay: index * 0.12 }
            }
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="font-semibold">{language.name}</span>
              <span className="text-sm text-white/80">{language.percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15 lg:h-3">
              <motion.div
                className="h-full w-full origin-left rounded-full"
                style={{
                  backgroundColor:
                    LANGUAGE_BAR_COLORS[index % LANGUAGE_BAR_COLORS.length] ??
                    '#F2C46D',
                }}
                initial={{ scaleX: reducedMotion ? language.percentage / 100 : 0 }}
                animate={{ scaleX: language.percentage / 100 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.9, delay: 0.08 + index * 0.12, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </div>
          </motion.li>
        ))}
      </ul>
    </SlideShell>
  )
}

import { motion } from 'framer-motion'
import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

const BAR_COLORS = ['#f0c27a', '#e07a5f', '#7bd4c4', '#8aa4ff', '#d9a8ff']

export function LanguagesSlide({ stats, reducedMotion }: SlideProps) {
  const names = stats.topLanguages.map((item) => item.name).join(', ')

  return (
    <SlideShell
      announcement={`Top languages: ${names}.`}
      gradient="bg-gradient-to-br from-[#1a1040] via-[#2c1d73] to-[#6b3ac9]"
    >
      <Kicker>Languages</Kicker>
      <Headline>The tongues you speak</Headline>
      <ul className="mt-8 space-y-4">
        {stats.topLanguages.map((language, index) => (
          <li key={language.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="font-semibold">{language.name}</span>
              <span className="text-sm text-white/70">{language.percentage}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length] ?? '#f0c27a',
                }}
                initial={{ width: reducedMotion ? `${language.percentage}%` : 0 }}
                animate={{ width: `${language.percentage}%` }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </SlideShell>
  )
}

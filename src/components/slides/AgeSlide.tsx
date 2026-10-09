import { formatAccountAgeParts } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { HeroStatSlide } from './HeroStatSlide'
import { SlideShell } from './SlideShell'

export function AgeSlide({ stats }: SlideProps) {
  const { value, unit } = formatAccountAgeParts(stats.accountAgeYears)

  return (
    <SlideShell
      announcement={`Building in public for ${value} ${unit}, since ${stats.joinYear}.`}
      gradient="bg-gradient-to-br from-[#0c2428] via-[#123e48] to-[#2a8f86]"
      pinBottom={false}
    >
      <HeroStatSlide
        lead="Building in public for"
        value={value}
        unit={unit}
        details={[{ label: 'Joined', value: String(stats.joinYear) }]}
      />
    </SlideShell>
  )
}

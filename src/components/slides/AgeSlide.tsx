import { formatAccountAge } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { Headline, SlideShell } from './SlideShell'

export function AgeSlide({ stats }: SlideProps) {
  const age = formatAccountAge(stats.accountAgeYears)

  return (
    <SlideShell
      announcement={`Building in public for ${age}, since ${stats.joinYear}.`}
      gradient="bg-gradient-to-br from-[#0c2428] via-[#123e48] to-[#2a8f86]"
      footer={<span>Joined {stats.joinYear}</span>}
    >
      <p className="mb-3 text-xl text-white/80">Building in public for</p>
      <Headline>{age}</Headline>
    </SlideShell>
  )
}

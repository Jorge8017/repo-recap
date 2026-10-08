import { formatAccountAge } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

export function AgeSlide({ stats }: SlideProps) {
  const age = formatAccountAge(stats.accountAgeYears)

  return (
    <SlideShell
      announcement={`Building in public for ${age}, since ${stats.joinYear}.`}
      gradient="bg-gradient-to-br from-[#0c2428] via-[#123e48] to-[#2a8f86]"
    >
      <Kicker>Account age</Kicker>
      <p className="mb-3 text-xl text-white/80">Building in public for</p>
      <Headline>{age}</Headline>
      <p className="mt-6 text-2xl font-medium text-[#dff7f3]">
        Joined {stats.joinYear}
      </p>
    </SlideShell>
  )
}

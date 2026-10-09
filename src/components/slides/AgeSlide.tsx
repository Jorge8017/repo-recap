import { formatAccountAgeParts } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { SlideShell } from './SlideShell'

export function AgeSlide({ stats }: SlideProps) {
  const { value, unit } = formatAccountAgeParts(stats.accountAgeYears)

  return (
    <SlideShell
      announcement={`Building in public for ${value} ${unit}, since ${stats.joinYear}.`}
      gradient="bg-gradient-to-br from-[#0c2428] via-[#123e48] to-[#2a8f86]"
      pinBottom={false}
    >
      <p className="text-[24px] text-[#C9BFD6]">Building in public for</p>
      <p className="mt-2 flex items-baseline gap-3">
        <span className="text-[96px] leading-none font-bold tracking-[-0.04em] text-[#F4EDE2]">
          {value}
        </span>
        <span className="text-[32px] leading-none font-bold tracking-[-0.04em] text-[#F4EDE2]">
          {unit}
        </span>
      </p>
      <p className="mt-3 text-[18px] text-[#C9BFD6]">Joined {stats.joinYear}</p>
    </SlideShell>
  )
}

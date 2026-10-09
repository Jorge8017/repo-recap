import { CountUp } from '../CountUp'
import { formatCount } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { Headline, SlideShell } from './SlideShell'

export function TotalsSlide({ stats, reducedMotion }: SlideProps) {
  const blocks = [
    stats.totalRepos > 0
      ? { value: stats.totalRepos, label: 'Public repos', accent: false }
      : null,
    stats.totalStars > 0
      ? { value: stats.totalStars, label: 'Stars received', accent: true }
      : null,
    stats.totalForks > 0
      ? { value: stats.totalForks, label: 'Forks', accent: false }
      : null,
  ].filter(
    (block): block is { value: number; label: string; accent: boolean } =>
      block !== null,
  )

  if (blocks.length === 0) return null

  const announcement = blocks
    .map((block) => `${block.value} ${block.label.toLowerCase()}`)
    .join(', ')

  const starsPerRepo =
    stats.totalRepos > 0 && stats.totalStars > 0
      ? Math.round(stats.totalStars / stats.totalRepos)
      : null

  return (
    <SlideShell
      announcement={announcement}
      gradient="bg-gradient-to-br from-[#6A2414] via-[#3A120C] to-[#2A0D0A]"
      footer={
        starsPerRepo !== null ? (
          <span>Roughly {formatCount(starsPerRepo)} stars per repo.</span>
        ) : undefined
      }
    >
      <Headline>
        A body of work
        <br />
        the internet relies on.
      </Headline>
      <div className="flex min-h-0 flex-col">
        {blocks.map((block, index) => (
          <div
            key={block.label}
            className={`flex items-baseline justify-between py-3 lg:py-4 ${index === 0 ? 'border-t' : ''} border-b border-[rgba(255,231,214,0.18)]`}
          >
            <span className="text-[15px] text-[#F2CDB7] lg:text-[17px]">{block.label}</span>
            <CountUp
              value={block.value}
              reducedMotion={reducedMotion}
              className={`text-[clamp(2rem,6vh,3.25rem)] leading-none font-bold tracking-[-0.04em] ${block.accent ? 'text-[#F2C46D]' : 'text-[#F4EDE2]'}`}
            />
          </div>
        ))}
      </div>
    </SlideShell>
  )
}

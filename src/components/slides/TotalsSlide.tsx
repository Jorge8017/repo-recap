import { CountUp } from '../CountUp'
import type { SlideProps } from '../../types'
import { Kicker, SlideShell } from './SlideShell'

export function TotalsSlide({ stats, reducedMotion }: SlideProps) {
  const blocks = [
    stats.totalRepos > 0
      ? { value: stats.totalRepos, label: 'public repos' }
      : null,
    stats.totalStars > 0
      ? { value: stats.totalStars, label: 'stars received' }
      : null,
    stats.totalForks > 0 ? { value: stats.totalForks, label: 'forks' } : null,
  ].filter((block): block is { value: number; label: string } => block !== null)

  if (blocks.length === 0) return null

  const announcement = blocks
    .map((block) => `${block.value} ${block.label}`)
    .join(', ')

  return (
    <SlideShell
      announcement={announcement}
      gradient="bg-gradient-to-br from-[#2a1208] via-[#6b2714] to-[#c45c28]"
    >
      <Kicker>Public catalog</Kicker>
      <div className="space-y-7">
        {blocks.map((block) => (
          <div key={block.label}>
            <CountUp
              value={block.value}
              reducedMotion={reducedMotion}
              className="block text-6xl leading-none font-bold tracking-tight text-[#f6efe4]"
            />
            <p className="mt-1 text-lg text-white/75">{block.label}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  )
}

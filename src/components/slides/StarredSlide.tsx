import { CountUp } from '../CountUp'
import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

export function StarredSlide({ stats, reducedMotion }: SlideProps) {
  const repo = stats.mostStarredRepo
  if (!repo) return null

  return (
    <SlideShell
      announcement={`Most-starred repo ${repo.name} with ${repo.stars} stars.`}
      gradient="bg-gradient-to-br from-[#1c1408] via-[#5c4310] to-[#c49a2a]"
    >
      <Kicker>Crowd favorite</Kicker>
      <p className="mb-2 text-xl text-white/80">Most-starred repo</p>
      <Headline>{repo.name}</Headline>
      <div className="mt-8 flex items-baseline gap-2">
        <CountUp
          value={repo.stars}
          reducedMotion={reducedMotion}
          className="text-5xl font-bold text-[#fff3c9]"
        />
        <span className="text-xl text-white/75">stars</span>
      </div>
      {repo.description ? (
        <p className="mt-6 max-w-[20ch] text-lg leading-snug text-white/80">
          {repo.description}
        </p>
      ) : null}
    </SlideShell>
  )
}

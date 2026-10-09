import { CountUp } from '../CountUp'
import { FittedText } from '../FittedText'
import type { SlideProps } from '../../types'
import { SlideShell } from './SlideShell'

export function StarredSlide({ stats, reducedMotion }: SlideProps) {
  const repo = stats.mostStarredRepo
  if (!repo) return null

  return (
    <SlideShell
      announcement={`Most-starred repo ${repo.name} with ${repo.stars} stars.`}
      gradient="bg-gradient-to-br from-[#1c1408] via-[#5c4310] to-[#c49a2a]"
      footer={repo.description ? <span>{repo.description}</span> : undefined}
    >
      <p className="mb-2 text-xl text-white/80">Most-starred repo</p>
      <FittedText
        text={repo.name}
        maxSize={64}
        minSize={28}
        wrapAtMin
        as="h2"
        testId="starred-repo-name"
        className="font-bold tracking-[-0.02em] text-[#F4EDE2]"
      />
      <div className="mt-8 flex items-baseline gap-2">
        <CountUp
          value={repo.stars}
          reducedMotion={reducedMotion}
          visitKey="starred"
          className="text-5xl font-bold text-[#fff3c9]"
        />
        <span className="text-xl text-white/75">stars</span>
      </div>
    </SlideShell>
  )
}

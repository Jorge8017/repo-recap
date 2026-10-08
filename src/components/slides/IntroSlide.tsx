import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

export function IntroSlide({ stats }: SlideProps) {
  return (
    <SlideShell
      announcement={`${stats.displayName}, your recap is ready.`}
      gradient="bg-gradient-to-br from-[#1a1033] via-[#3a1548] to-[#7a2d4a]"
    >
      <img
        src={stats.avatarUrl}
        alt=""
        width={96}
        height={96}
        className="mb-8 h-24 w-24 rounded-3xl object-cover shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-4 ring-white/20"
      />
      <Kicker>Repo Recap</Kicker>
      <Headline>
        {stats.displayName},
        <br />
        your recap is ready.
      </Headline>
      <p className="mt-4 text-lg text-white/75">@{stats.username}</p>
    </SlideShell>
  )
}

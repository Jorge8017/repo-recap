import type { SlideProps } from '../../types'
import { SlideShell } from './SlideShell'

export function IntroSlide({ stats, avatarSrc }: SlideProps) {
  return (
    <SlideShell
      announcement={`${stats.displayName}, your recap is ready.`}
      gradient="bg-gradient-to-br from-[#1a1033] via-[#3a1548] to-[#7a2d4a]"
    >
      <img
        src={avatarSrc}
        alt=""
        width={96}
        height={96}
        className="mb-5 h-16 w-16 rounded-2xl object-cover shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-2 ring-white/20 lg:h-20 lg:w-20 lg:rounded-3xl"
      />
      <h2 className="text-[clamp(1.75rem,4.5vh,2.6rem)] leading-[1.05] font-bold tracking-[-0.03em]">
        {stats.displayName},
        <br />
        your recap is ready.
      </h2>
      <p className="mt-4 text-lg text-white/70">@{stats.username}</p>
    </SlideShell>
  )
}

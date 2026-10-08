import { CountUp } from '../CountUp'
import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

export function StreakSlide({ stats, reducedMotion }: SlideProps) {
  const showStreak = stats.longestStreak > 0
  const showCommits = stats.totalCommitsPushed > 0
  if (!showStreak && !showCommits) return null

  const dayLabel = stats.longestStreak === 1 ? 'day' : 'days'
  const announcementParts: string[] = ['Last 90 days']
  if (showStreak) {
    announcementParts.push(`longest streak ${stats.longestStreak} ${dayLabel}`)
  }
  if (showCommits) {
    announcementParts.push(`${stats.totalCommitsPushed} commits pushed`)
  }

  return (
    <SlideShell
      announcement={announcementParts.join(': ')}
      gradient="bg-gradient-to-br from-[#2a0818] via-[#6b1438] to-[#c43b5c]"
    >
      <Kicker>Last 90 days</Kicker>
      {showStreak ? (
        <>
          <p className="mb-2 text-xl text-white/80">Longest active streak</p>
          <Headline>
            {stats.longestStreak} {dayLabel}
          </Headline>
        </>
      ) : (
        <>
          <p className="mb-2 text-xl text-white/80">Commits pushed</p>
          <Headline>
            <CountUp
              value={stats.totalCommitsPushed}
              reducedMotion={reducedMotion}
            />
          </Headline>
        </>
      )}
      {showStreak && showCommits ? (
        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
            Commits pushed
          </p>
          <CountUp
            value={stats.totalCommitsPushed}
            reducedMotion={reducedMotion}
            className="mt-1 block text-5xl font-bold text-[#ffd4de]"
          />
        </div>
      ) : null}
      {stats.mostActiveRepoInWindow ? (
        <p className="mt-6 text-white/75">
          Most active repo:{' '}
          <span className="font-semibold text-white">
            {stats.mostActiveRepoInWindow.name}
          </span>
        </p>
      ) : null}
    </SlideShell>
  )
}

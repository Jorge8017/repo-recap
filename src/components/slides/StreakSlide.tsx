import { formatCount } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { HeroStatSlide } from './HeroStatSlide'
import { SlideShell } from './SlideShell'

export function StreakSlide({ stats }: SlideProps) {
  const showStreak = stats.longestStreak > 0
  const showCommits = stats.totalCommitsPushed > 0
  if (!showStreak && !showCommits) return null

  const dayLabel = stats.longestStreak === 1 ? 'day' : 'days'
  const announcementParts: string[] = [
    stats.hasContributionStats ? 'Last 12 months' : 'Last 90 days',
  ]
  if (showStreak) {
    announcementParts.push(`longest streak ${stats.longestStreak} ${dayLabel}`)
  }
  if (showCommits) {
    announcementParts.push(`${stats.totalCommitsPushed} commits pushed`)
  }

  const details: Array<{ label: string; value: string }> = []
  if (stats.currentStreak > 0 && showStreak) {
    details.push({
      label: 'Current streak',
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`,
    })
  }
  if (stats.mostActiveRepoInWindow) {
    details.push({
      label: 'Most active repo',
      value: stats.mostActiveRepoInWindow.name,
    })
  }
  if (showCommits && showStreak && details.length < 2) {
    details.push({
      label: 'Commits pushed',
      value: formatCount(stats.totalCommitsPushed),
    })
  }

  return (
    <SlideShell
      announcement={announcementParts.join(': ')}
      gradient="bg-gradient-to-br from-[#2a0818] via-[#6b1438] to-[#c43b5c]"
      pinBottom={false}
    >
      {showStreak ? (
        <HeroStatSlide
          lead="Longest active streak"
          value={String(stats.longestStreak)}
          unit={dayLabel}
          details={details}
        />
      ) : (
        <HeroStatSlide
          lead="Commits pushed"
          value={formatCount(stats.totalCommitsPushed)}
          details={details}
        />
      )}
    </SlideShell>
  )
}

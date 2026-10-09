import type { RecapStats, SlideId } from '../types'

function hasYearSlide(stats: RecapStats): boolean {
  return (
    stats.hasContributionStats &&
    (stats.totalContributions > 0 ||
      stats.privateContributions > 0 ||
      stats.contributionWeeks.length > 0)
  )
}

export function planSlides(stats: RecapStats): SlideId[] {
  if (stats.isEmptyProfile) {
    const empty: SlideId[] = ['intro', 'age']
    if (hasYearSlide(stats)) empty.push('year')
    empty.push('quiet', 'summary')
    return empty
  }

  const slides: SlideId[] = ['intro', 'age']

  if (hasYearSlide(stats)) {
    slides.push('year')
  }

  if (stats.totalRepos > 0 || stats.totalStars > 0 || stats.totalForks > 0) {
    slides.push('totals')
  }

  if (stats.topLanguages.length > 0) {
    slides.push('languages')
  }

  if (stats.busiestDay !== null || stats.busiestHour !== null) {
    slides.push('busiest')
  }

  if (stats.longestStreak > 0 || stats.totalCommitsPushed > 0) {
    slides.push('streak')
  }

  if (stats.mostStarredRepo && stats.mostStarredRepo.stars > 0) {
    slides.push('starred')
  }

  slides.push('personality', 'summary')
  return slides
}

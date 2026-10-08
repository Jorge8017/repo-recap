import type { RecapStats, SlideId } from '../types'

export function planSlides(stats: RecapStats): SlideId[] {
  if (stats.isEmptyProfile) {
    return ['intro', 'age', 'quiet', 'summary']
  }

  const slides: SlideId[] = ['intro', 'age']

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

import { formatCount } from './stats.js'
import type { Personality, RecapResult, RecapStats } from '../types.js'

export type CompareSide = 'a' | 'b' | 'tie'

export type CompareSlideId =
  | 'compare-intro'
  | 'compare-contributions'
  | 'compare-streak'
  | 'compare-stars'
  | 'compare-languages'
  | 'compare-busiest'
  | 'compare-personalities'
  | 'compare-score'

export interface CompareRound {
  id: 'contributions' | 'streak' | 'stars' | 'repos'
  label: string
  aValue: number
  bValue: number
  aDisplay: string
  bDisplay: string
  winner: CompareSide
}

export interface CompareScore {
  rounds: CompareRound[]
  aWins: number
  bWins: number
  winner: CompareSide
  headline: string
}

export function isSameUser(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function compareMetric(a: number, b: number): CompareSide {
  if (a === b) return 'tie'
  return a > b ? 'a' : 'b'
}

function displayStat(
  stats: RecapStats,
  value: number,
  ghostLabel = 'Private',
): string {
  if (stats.isEmptyProfile) return ghostLabel
  return formatCount(value)
}

function hasContributionsSlide(stats: RecapStats): boolean {
  return stats.isEmptyProfile || stats.totalContributions > 0 || stats.hasContributionStats
}

function hasStreakSlide(stats: RecapStats): boolean {
  return stats.isEmptyProfile || stats.longestStreak > 0
}

function hasStarsSlide(stats: RecapStats): boolean {
  return stats.isEmptyProfile || stats.totalStars > 0
}

function hasLanguagesSlide(stats: RecapStats): boolean {
  return stats.topLanguages.length > 0
}

function hasBusiestSlide(stats: RecapStats): boolean {
  return Boolean(stats.busiestDay || stats.busiestHour !== null)
}

/** Skip a slide only when both sides have nothing to show for that stat. */
export function planCompareSlides(
  a: RecapResult,
  b: RecapResult,
): CompareSlideId[] {
  const slides: CompareSlideId[] = ['compare-intro']

  if (hasContributionsSlide(a.stats) || hasContributionsSlide(b.stats)) {
    slides.push('compare-contributions')
  }
  if (hasStreakSlide(a.stats) || hasStreakSlide(b.stats)) {
    slides.push('compare-streak')
  }
  if (hasStarsSlide(a.stats) || hasStarsSlide(b.stats)) {
    slides.push('compare-stars')
  }
  if (hasLanguagesSlide(a.stats) || hasLanguagesSlide(b.stats)) {
    slides.push('compare-languages')
  }
  if (hasBusiestSlide(a.stats) || hasBusiestSlide(b.stats)) {
    slides.push('compare-busiest')
  }

  slides.push('compare-personalities', 'compare-score')
  return slides
}

export function buildCompareScore(
  a: RecapStats,
  b: RecapStats,
): CompareScore {
  const rounds: CompareRound[] = [
    {
      id: 'contributions',
      label: 'Contributions',
      aValue: a.totalContributions,
      bValue: b.totalContributions,
      aDisplay: displayStat(a, a.totalContributions),
      bDisplay: displayStat(b, b.totalContributions),
      winner: compareMetric(a.totalContributions, b.totalContributions),
    },
    {
      id: 'streak',
      label: 'Streak',
      aValue: a.longestStreak,
      bValue: b.longestStreak,
      aDisplay: a.isEmptyProfile
        ? 'Private'
        : `${formatCount(a.longestStreak)} ${a.longestStreak === 1 ? 'day' : 'days'}`,
      bDisplay: b.isEmptyProfile
        ? 'Private'
        : `${formatCount(b.longestStreak)} ${b.longestStreak === 1 ? 'day' : 'days'}`,
      winner: compareMetric(a.longestStreak, b.longestStreak),
    },
    {
      id: 'stars',
      label: 'Stars',
      aValue: a.totalStars,
      bValue: b.totalStars,
      aDisplay: displayStat(a, a.totalStars),
      bDisplay: displayStat(b, b.totalStars),
      winner: compareMetric(a.totalStars, b.totalStars),
    },
    {
      id: 'repos',
      label: 'Public repos',
      aValue: a.totalRepos,
      bValue: b.totalRepos,
      aDisplay: a.isEmptyProfile ? 'Private' : formatCount(a.totalRepos),
      bDisplay: b.isEmptyProfile ? 'Private' : formatCount(b.totalRepos),
      winner: compareMetric(a.totalRepos, b.totalRepos),
    },
  ]

  let aWins = 0
  let bWins = 0
  for (const round of rounds) {
    if (round.winner === 'a') aWins += 1
    if (round.winner === 'b') bWins += 1
  }

  const winner: CompareSide =
    aWins === bWins ? 'tie' : aWins > bWins ? 'a' : 'b'

  const headline =
    winner === 'tie'
      ? `@${a.username} and @${b.username} tie ${aWins}–${bWins}`
      : winner === 'a'
        ? `@${a.username} wins ${aWins}–${bWins}`
        : `@${b.username} wins ${bWins}–${aWins}`

  return { rounds, aWins, bWins, winner, headline }
}

export function sharedLanguage(
  a: RecapStats,
  b: RecapStats,
): string | null {
  const bNames = new Set(b.topLanguages.map((lang) => lang.name))
  for (const lang of a.topLanguages) {
    if (bNames.has(lang.name)) return lang.name
  }
  return null
}

function hourPersona(hour: number | null): string | null {
  if (hour === null) return null
  if (hour >= 22 || hour < 5) return 'Night owl'
  if (hour >= 5 && hour < 11) return 'Early bird'
  if (hour >= 11 && hour < 17) return 'Daytime shipper'
  return 'Evening coder'
}

export function busiestContrastLine(
  a: RecapStats,
  b: RecapStats,
): string {
  const aPersona = hourPersona(a.busiestHour)
  const bPersona = hourPersona(b.busiestHour)
  if (aPersona && bPersona) {
    if (aPersona === bPersona) return `Both ${aPersona.toLowerCase()}s`
    return `${aPersona} vs ${bPersona.toLowerCase()}`
  }
  if (a.busiestDay && b.busiestDay) {
    if (a.busiestDay === b.busiestDay) return `Both peak on ${a.busiestDay}s`
    return `${a.busiestDay} vs ${b.busiestDay}`
  }
  return 'Different rhythms'
}

export function compareSlideCatalog(id: CompareSlideId): string {
  switch (id) {
    case 'compare-intro':
      return 'Compare'
    case 'compare-contributions':
      return 'Contributions'
    case 'compare-streak':
      return 'Streak'
    case 'compare-stars':
      return 'Stars'
    case 'compare-languages':
      return 'Languages'
    case 'compare-busiest':
      return 'Peak time'
    case 'compare-personalities':
      return 'Personalities'
    case 'compare-score':
      return 'Final score'
  }
}

export function compareSlideKicker(
  index: number,
  count: number,
  id: CompareSlideId,
): string {
  const n = String(index + 1).padStart(2, '0')
  const total = String(count).padStart(2, '0')
  return `${n} / ${total} · ${compareSlideCatalog(id)}`
}

export function formatHourLabel(hour: number | null): string {
  if (hour === null) return '—'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:00 ${suffix}`
}

export type { Personality }

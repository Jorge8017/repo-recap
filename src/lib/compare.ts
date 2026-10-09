import { formatCount } from './stats.js'
import type { Personality, RecapResult, RecapStats } from '../types.js'

export type CompareSide = 'a' | 'b' | 'tie'

export const COMPARE_COLOR_A = '#F2C46D'
export const COMPARE_COLOR_B = '#6FD3B8'

export type CompareSlideId =
  | 'compare-intro'
  | 'compare-contributions'
  | 'compare-streak'
  | 'compare-stars'
  | 'compare-languages'
  | 'compare-busiest'
  | 'compare-personalities'
  | 'compare-score'

export type CompareRoundId = 'contributions' | 'streak' | 'stars' | 'repos'

export interface CompareRound {
  id: CompareRoundId
  label: string
  aValue: number
  bValue: number
  aDisplay: string
  bDisplay: string
  winner: CompareSide
  comparable: boolean
}

export interface CompareScore {
  rounds: CompareRound[]
  aWins: number
  bWins: number
  winner: CompareSide
  headline: string
  enoughData: boolean
}

export type VerdictTone = 'a' | 'b' | 'muted' | 'ink'

export interface VerdictPart {
  text: string
  tone?: VerdictTone
}

export function isSameUser(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function compareMetric(a: number, b: number): CompareSide {
  if (a === b) return 'tie'
  return a > b ? 'a' : 'b'
}

export function firstName(stats: RecapStats): string {
  const fromDisplay = stats.displayName.trim().split(/\s+/)[0]
  return fromDisplay || stats.username
}

export function isMetricPrivate(
  stats: RecapStats,
  id: CompareRoundId,
): boolean {
  if (stats.isEmptyProfile) return true
  if (id === 'contributions' && !stats.hasContributionStats) return true
  return false
}

function displayStat(
  stats: RecapStats,
  id: CompareRoundId,
  value: number,
  ghostLabel = 'Private',
): string {
  if (isMetricPrivate(stats, id)) return ghostLabel
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

function buildRound(
  id: CompareRoundId,
  label: string,
  a: RecapStats,
  b: RecapStats,
  aValue: number,
  bValue: number,
  aDisplay: string,
  bDisplay: string,
): CompareRound {
  const aPrivate = isMetricPrivate(a, id)
  const bPrivate = isMetricPrivate(b, id)
  const comparable = !aPrivate && !bPrivate
  return {
    id,
    label,
    aValue,
    bValue,
    aDisplay,
    bDisplay,
    winner: comparable ? compareMetric(aValue, bValue) : 'tie',
    comparable,
  }
}

export function buildCompareScore(
  a: RecapStats,
  b: RecapStats,
): CompareScore {
  const rounds: CompareRound[] = [
    buildRound(
      'contributions',
      'Contributions',
      a,
      b,
      a.totalContributions,
      b.totalContributions,
      displayStat(a, 'contributions', a.totalContributions),
      displayStat(b, 'contributions', b.totalContributions),
    ),
    buildRound(
      'streak',
      'Streak',
      a,
      b,
      a.longestStreak,
      b.longestStreak,
      isMetricPrivate(a, 'streak')
        ? 'Private'
        : `${formatCount(a.longestStreak)} ${a.longestStreak === 1 ? 'day' : 'days'}`,
      isMetricPrivate(b, 'streak')
        ? 'Private'
        : `${formatCount(b.longestStreak)} ${b.longestStreak === 1 ? 'day' : 'days'}`,
    ),
    buildRound(
      'stars',
      'Stars',
      a,
      b,
      a.totalStars,
      b.totalStars,
      displayStat(a, 'stars', a.totalStars),
      displayStat(b, 'stars', b.totalStars),
    ),
    buildRound(
      'repos',
      'Public repos',
      a,
      b,
      a.totalRepos,
      b.totalRepos,
      isMetricPrivate(a, 'repos') ? 'Private' : formatCount(a.totalRepos),
      isMetricPrivate(b, 'repos') ? 'Private' : formatCount(b.totalRepos),
    ),
  ]

  let aWins = 0
  let bWins = 0
  for (const round of rounds) {
    if (!round.comparable) continue
    if (round.winner === 'a') aWins += 1
    if (round.winner === 'b') bWins += 1
  }

  const comparableCount = rounds.filter((round) => round.comparable).length
  const enoughData = comparableCount > 0

  if (!enoughData) {
    return {
      rounds,
      aWins: 0,
      bWins: 0,
      winner: 'tie',
      headline: 'Not enough public data to score',
      enoughData: false,
    }
  }

  const winner: CompareSide =
    aWins === bWins ? 'tie' : aWins > bWins ? 'a' : 'b'

  const headline =
    winner === 'tie'
      ? `@${a.username} and @${b.username} tie, ${aWins}–${bWins}`
      : winner === 'a'
        ? `@${a.username} takes it, ${aWins}–${bWins}`
        : `@${b.username} takes it, ${bWins}–${aWins}`

  return { rounds, aWins, bWins, winner, headline, enoughData }
}

export function formatMultiplier(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return '1×'
  if (ratio >= 10) return `${Math.round(ratio)}×`
  const rounded = Math.round(ratio * 10) / 10
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1)
  return `${text}×`
}

function privateStatVerdict(a: RecapStats, b: RecapStats, id: CompareRoundId): VerdictPart[] | null {
  const aPrivate = isMetricPrivate(a, id)
  const bPrivate = isMetricPrivate(b, id)
  if (!aPrivate && !bPrivate) return null
  if (aPrivate && bPrivate) {
    return [{ text: 'Both keep this one private.', tone: 'muted' }]
  }
  const user = aPrivate ? a.username : b.username
  return [{ text: `@${user} keeps this one private.`, tone: 'muted' }]
}

export function contributionsVerdict(a: RecapStats, b: RecapStats): VerdictPart[] {
  const priv = privateStatVerdict(a, b, 'contributions')
  if (priv) return priv
  const side = compareMetric(a.totalContributions, b.totalContributions)
  if (side === 'tie') return [{ text: 'Too close to call.' }]
  const winner = side === 'a' ? a : b
  const loser = side === 'a' ? b : a
  const lo = loser.totalContributions
  const hi = winner.totalContributions
  if (lo === 0 || hi / lo < 1.15) return [{ text: 'Too close to call.' }]
  const mult = formatMultiplier(hi / lo)
  return [
    { text: `${firstName(winner)} shipped ` },
    { text: mult, tone: side },
    { text: ' as many contributions this year.' },
  ]
}

export function streakVerdict(a: RecapStats, b: RecapStats): VerdictPart[] {
  const priv = privateStatVerdict(a, b, 'streak')
  if (priv) return priv
  const side = compareMetric(a.longestStreak, b.longestStreak)
  if (side === 'tie') return [{ text: 'Too close to call.' }]
  const winner = side === 'a' ? a : b
  const loser = side === 'a' ? b : a
  const delta = Math.abs(winner.longestStreak - loser.longestStreak)
  if (delta === 0) return [{ text: 'Too close to call.' }]
  const days = delta === 1 ? '1 day' : `${formatCount(delta)} days`
  return [
    { text: `${firstName(winner)}'s longest streak beats ${firstName(loser)}'s by ` },
    { text: days, tone: side },
    { text: '.' },
  ]
}

export function starsVerdict(a: RecapStats, b: RecapStats): VerdictPart[] {
  const priv = privateStatVerdict(a, b, 'stars')
  if (priv) return priv
  const side = compareMetric(a.totalStars, b.totalStars)
  if (side === 'tie') return [{ text: 'Too close to call.' }]
  const winner = side === 'a' ? a : b
  const loser = side === 'a' ? b : a
  const lo = loser.totalStars
  const hi = winner.totalStars
  if (lo === 0 || hi / lo < 1.15) return [{ text: 'Too close to call.' }]
  const mult = formatMultiplier(hi / lo)
  return [
    { text: `${firstName(winner)} earned ` },
    { text: mult, tone: side },
    { text: ' as many stars.' },
  ]
}

export function proportionShares(
  aValue: number,
  bValue: number,
): { aPercent: number; bPercent: number } | null {
  const total = aValue + bValue
  if (total <= 0) return { aPercent: 50, bPercent: 50 }
  const aPercent = Math.round((aValue / total) * 100)
  return { aPercent, bPercent: 100 - aPercent }
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

export function languagesVerdict(a: RecapStats, b: RecapStats): string {
  const aEmpty = a.topLanguages.length === 0
  const bEmpty = b.topLanguages.length === 0
  if (aEmpty && !bEmpty) {
    return `@${a.username} hasn't published any code yet`
  }
  if (bEmpty && !aEmpty) {
    return `@${b.username} hasn't published any code yet`
  }
  if (aEmpty && bEmpty) {
    return 'No public languages yet'
  }
  const shared = sharedLanguage(a, b)
  if (shared) return `You both write ${shared}`
  return 'Different stacks'
}

function hourPersona(hour: number | null): string | null {
  if (hour === null) return null
  if (hour >= 22 || hour < 5) return 'Night owl'
  if (hour >= 5 && hour < 11) return 'Early bird'
  if (hour >= 11 && hour < 17) return 'Daytime shipper'
  return 'Evening coder'
}

export function hasPeakTimeData(stats: RecapStats): boolean {
  return Boolean(stats.busiestDay || stats.busiestHour !== null)
}

export function busiestContrastLine(
  a: RecapStats,
  b: RecapStats,
): string {
  const aHas = hasPeakTimeData(a)
  const bHas = hasPeakTimeData(b)
  if (!aHas && bHas) return `@${a.username} keeps their hours private`
  if (!bHas && aHas) return `@${b.username} keeps their hours private`
  if (!aHas && !bHas) return 'Different rhythms'

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

function compareSlideExtra(id: CompareSlideId): string | null {
  switch (id) {
    case 'compare-contributions':
      return 'LAST 12 MONTHS'
    case 'compare-streak':
      return 'LONGEST'
    case 'compare-stars':
      return 'RECEIVED'
    case 'compare-languages':
      return 'TOP 3'
    case 'compare-busiest':
      return 'DAY + HOUR'
    default:
      return null
  }
}

export function compareSlideKicker(
  index: number,
  count: number,
  id: CompareSlideId,
): string {
  const n = String(index + 1).padStart(2, '0')
  const total = String(count).padStart(2, '0')
  const catalog = compareSlideCatalog(id).toUpperCase()
  const extra = compareSlideExtra(id)
  return extra
    ? `${n} / ${total} · ${catalog} · ${extra}`
    : `${n} / ${total} · ${catalog}`
}

export function formatHourLabel(hour: number | null): string {
  if (hour === null) return ''
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:00 ${suffix}`
}

export type { Personality }

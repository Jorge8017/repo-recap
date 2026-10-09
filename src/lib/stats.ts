import type {
  ActiveRepo,
  BestMonth,
  ContributionDay,
  ContributionWeek,
  ContributionsSummary,
  GitHubEvent,
  GitHubRepo,
  GitHubUser,
  LanguageStat,
  RecentRepo,
  RecapStats,
  RepoHighlight,
} from '../types.js'

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

export function shortRepoName(fullName: string): string {
  const parts = fullName.split('/')
  const last = parts[parts.length - 1]
  return last && last.length > 0 ? last : fullName
}

export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const normalized = hour % 12 === 0 ? 12 : hour % 12
  return `${normalized}:00 ${period}`
}

export function formatAccountAgeParts(years: number): {
  value: string
  unit: string
} {
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12))
    return { value: String(months), unit: months === 1 ? 'month' : 'months' }
  }
  if (years < 10) {
    const rounded = Math.round(years * 10) / 10
    if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
      const whole = Math.round(rounded)
      return { value: String(whole), unit: whole === 1 ? 'year' : 'years' }
    }
    return { value: rounded.toFixed(1), unit: 'years' }
  }
  return { value: String(Math.floor(years)), unit: 'years' }
}

export function formatAccountAge(years: number): string {
  const { value, unit } = formatAccountAgeParts(years)
  return `${value} ${unit}`
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value,
  )
}

function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextDayKey(key: string): string {
  const [yearRaw, monthRaw, dayRaw] = key.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function previousDayKey(key: string): string {
  const [yearRaw, monthRaw, dayRaw] = key.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function flattenContributionDays(
  weeks: ContributionWeek[],
): ContributionDay[] {
  const days: ContributionDay[] = []
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      days.push(day)
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date))
}

export function longestContributionStreak(weeks: ContributionWeek[]): number {
  const days = flattenContributionDays(weeks).filter(
    (day) => day.contributionCount > 0,
  )
  if (days.length === 0) return 0

  let best = 1
  let current = 1
  for (let index = 1; index < days.length; index += 1) {
    const previous = days[index - 1]
    const day = days[index]
    if (!previous || !day) continue
    if (day.date === nextDayKey(previous.date)) {
      current += 1
      if (current > best) best = current
    } else {
      current = 1
    }
  }
  return best
}

export function currentContributionStreak(
  weeks: ContributionWeek[],
  todayKey: string,
): number {
  const active = new Set(
    flattenContributionDays(weeks)
      .filter((day) => day.contributionCount > 0)
      .map((day) => day.date),
  )
  if (active.size === 0) return 0

  let cursor = active.has(todayKey) ? todayKey : previousDayKey(todayKey)
  if (!active.has(cursor)) return 0

  let streak = 0
  while (active.has(cursor)) {
    streak += 1
    cursor = previousDayKey(cursor)
  }
  return streak
}

export function busiestWeekdayFromCalendar(
  weeks: ContributionWeek[],
): string | null {
  const counts = new Array<number>(7).fill(0)
  for (const day of flattenContributionDays(weeks)) {
    if (day.contributionCount <= 0) continue
    const weekday = ((day.weekday % 7) + 7) % 7
    counts[weekday] = (counts[weekday] ?? 0) + day.contributionCount
  }
  const index = busiestBucket(counts)
  return index === null ? null : (WEEKDAYS[index] ?? null)
}

export function bestMonthFromCalendar(weeks: ContributionWeek[]): BestMonth | null {
  const months = new Map<string, number>()
  for (const day of flattenContributionDays(weeks)) {
    if (day.contributionCount <= 0) continue
    const key = day.date.slice(0, 7)
    months.set(key, (months.get(key) ?? 0) + day.contributionCount)
  }

  let bestKey: string | null = null
  let bestCount = 0
  for (const [key, count] of months) {
    if (count > bestCount || (count === bestCount && bestKey !== null && key < bestKey)) {
      bestKey = key
      bestCount = count
    }
  }
  if (!bestKey || bestCount <= 0) return null

  const [yearRaw, monthRaw] = bestKey.split('-')
  const monthIndex = Number(monthRaw) - 1
  const label = `${MONTH_LABELS[monthIndex] ?? monthRaw} ${yearRaw}`
  return { label, count: bestCount, key: bestKey }
}

export function longestActiveStreak(events: GitHubEvent[]): number {
  if (events.length === 0) return 0

  const uniqueDays = new Set<string>()
  for (const event of events) {
    const date = new Date(event.created_at)
    if (Number.isNaN(date.getTime())) continue
    uniqueDays.add(localDayKey(date))
  }

  const sorted = [...uniqueDays].sort()
  if (sorted.length === 0) return 0

  let best = 1
  let current = 1
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const day = sorted[index]
    if (!previous || !day) continue
    if (day === nextLocalDayKey(previous)) {
      current += 1
      if (current > best) best = current
    } else {
      current = 1
    }
  }

  return best
}

function nextLocalDayKey(key: string): string {
  const [yearRaw, monthRaw, dayRaw] = key.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 1)
  return localDayKey(date)
}

function busiestBucket(counts: number[]): number | null {
  let bestIndex: number | null = null
  let bestCount = 0
  for (let index = 0; index < counts.length; index += 1) {
    const count = counts[index] ?? 0
    if (count > bestCount) {
      bestCount = count
      bestIndex = index
    }
  }
  return bestCount > 0 ? bestIndex : null
}

export function topLanguagesFromRepos(repos: GitHubRepo[]): {
  topLanguages: LanguageStat[]
  languageCount: number
} {
  const counts = new Map<string, number>()
  for (const repo of repos) {
    if (!repo.language) continue
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
  }

  const languageCount = counts.size
  if (languageCount === 0) {
    return { topLanguages: [], languageCount: 0 }
  }

  const totalWithLanguage = [...counts.values()].reduce(
    (sum, count) => sum + count,
    0,
  )
  const ranked = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })

  const topLanguages = ranked.slice(0, 5).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalWithLanguage) * 100),
  }))

  return { topLanguages, languageCount }
}

export function mostStarredRepoFrom(repos: GitHubRepo[]): RepoHighlight | null {
  let best: GitHubRepo | null = null
  for (const repo of repos) {
    if (repo.stargazers_count <= 0) continue
    if (!best || repo.stargazers_count > best.stargazers_count) {
      best = repo
    }
  }
  if (!best) return null
  return {
    name: best.name,
    stars: best.stargazers_count,
    description: best.description,
    url: best.html_url,
  }
}

export function mostRecentlyActiveRepoFrom(
  repos: GitHubRepo[],
): RecentRepo | null {
  let best: GitHubRepo | null = null
  for (const repo of repos) {
    if (!repo.pushed_at) continue
    if (
      !best ||
      !best.pushed_at ||
      repo.pushed_at > best.pushed_at
    ) {
      best = repo
    }
  }
  if (!best || !best.pushed_at) return null
  return {
    name: best.name,
    pushedAt: best.pushed_at,
    url: best.html_url,
  }
}

function mostActiveRepoFromEvents(events: GitHubEvent[]): ActiveRepo | null {
  const counts = new Map<string, number>()
  for (const event of events) {
    const name = shortRepoName(event.repo.name)
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  let bestName: string | null = null
  let bestCount = 0
  for (const [name, count] of counts) {
    if (count > bestCount || (count === bestCount && bestName !== null && name < bestName)) {
      bestName = name
      bestCount = count
    }
  }

  if (!bestName || bestCount === 0) return null
  return { name: bestName, eventCount: bestCount }
}

export function buildRecapStats(
  user: GitHubUser,
  repos: GitHubRepo[],
  events: GitHubEvent[],
  now: Date = new Date(),
  contributions: ContributionsSummary | null = null,
): RecapStats {
  const created = new Date(user.created_at)
  const createdMs = created.getTime()
  const accountAgeYears = Number.isNaN(createdMs)
    ? 0
    : Math.max(0, (now.getTime() - createdMs) / MS_PER_YEAR)
  const joinYear = Number.isNaN(createdMs) ? now.getFullYear() : created.getFullYear()

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)
  const { topLanguages, languageCount } = topLanguagesFromRepos(repos)

  const dayCounts = new Array<number>(7).fill(0)
  const hourCounts = new Array<number>(24).fill(0)
  let totalPushEvents = 0
  let totalCommitsPushed = 0

  for (const event of events) {
    const date = new Date(event.created_at)
    if (Number.isNaN(date.getTime())) continue
    const day = date.getDay()
    const hour = date.getHours()
    dayCounts[day] = (dayCounts[day] ?? 0) + 1
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
    if (event.type === 'PushEvent') {
      totalPushEvents += 1
      totalCommitsPushed += event.payload.size ?? 0
    }
  }

  const busiestHour = busiestBucket(hourCounts)
  const hasContributionStats = Boolean(contributions)
  const weeks = contributions?.contributionCalendar.weeks ?? []
  const todayKey = localDayKey(now)

  const busiestDay = hasContributionStats
    ? busiestWeekdayFromCalendar(weeks)
    : (() => {
        const busiestDayIndex = busiestBucket(dayCounts)
        return busiestDayIndex === null
          ? null
          : (WEEKDAYS[busiestDayIndex] ?? null)
      })()

  const longestStreak = hasContributionStats
    ? longestContributionStreak(weeks)
    : longestActiveStreak(events)
  const currentStreak = hasContributionStats
    ? currentContributionStreak(weeks, todayKey)
    : 0

  if (hasContributionStats && contributions) {
    totalCommitsPushed = Math.max(
      totalCommitsPushed,
      contributions.totalCommitContributions,
    )
  }

  return {
    username: user.login,
    displayName: user.name?.trim() || user.login,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    accountAgeYears,
    joinYear,
    totalRepos: user.public_repos,
    totalStars,
    totalForks,
    mostStarredRepo: mostStarredRepoFrom(repos),
    topLanguages,
    languageCount,
    mostRecentlyActiveRepo: mostRecentlyActiveRepoFrom(repos),
    busiestDay,
    busiestHour,
    totalPushEvents,
    totalCommitsPushed,
    longestStreak,
    currentStreak,
    mostActiveRepoInWindow: mostActiveRepoFromEvents(events),
    hasEventStats: events.length > 0,
    hasContributionStats,
    totalContributions: contributions?.contributionCalendar.totalContributions ?? 0,
    privateContributions: contributions?.restrictedContributionsCount ?? 0,
    bestMonth: hasContributionStats ? bestMonthFromCalendar(weeks) : null,
    contributionWeeks: weeks,
    isEmptyProfile: user.public_repos === 0 && events.length === 0,
  }
}

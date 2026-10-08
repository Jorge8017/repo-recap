import type {
  ActiveRepo,
  GitHubEvent,
  GitHubRepo,
  GitHubUser,
  LanguageStat,
  RecentRepo,
  RecapStats,
  RepoHighlight,
} from '../types'

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
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

export function formatAccountAge(years: number): string {
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12))
    return months === 1 ? '1 month' : `${months} months`
  }
  if (years < 10) {
    const rounded = Math.round(years * 10) / 10
    if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
      const whole = Math.round(rounded)
      return whole === 1 ? '1 year' : `${whole} years`
    }
    return `${rounded.toFixed(1)} years`
  }
  const whole = Math.floor(years)
  return `${whole} years`
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

function nextLocalDayKey(key: string): string {
  const [yearRaw, monthRaw, dayRaw] = key.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 1)
  return localDayKey(date)
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

  const busiestDayIndex = busiestBucket(dayCounts)
  const busiestHour = busiestBucket(hourCounts)
  const busiestDay =
    busiestDayIndex === null ? null : (WEEKDAYS[busiestDayIndex] ?? null)

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
    longestStreak: longestActiveStreak(events),
    mostActiveRepoInWindow: mostActiveRepoFromEvents(events),
    hasEventStats: events.length > 0,
    isEmptyProfile: user.public_repos === 0 && events.length === 0,
  }
}

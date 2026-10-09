export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  created_at: string
  public_repos: number
  html_url: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string | null
  html_url: string
  fork: boolean
}

export interface GitHubEventRepo {
  name: string
}

export interface GitHubEventPayload {
  size?: number
}

export interface GitHubEvent {
  id: string
  type: string | null
  created_at: string
  repo: GitHubEventRepo
  payload: GitHubEventPayload
}

export interface ContributionDay {
  date: string
  contributionCount: number
  weekday: number
}

export interface ContributionWeek {
  contributionDays: ContributionDay[]
}

export interface ContributionCalendar {
  totalContributions: number
  weeks: ContributionWeek[]
}

export interface ContributionsSummary {
  totalCommitContributions: number
  totalPullRequestContributions: number
  totalIssueContributions: number
  totalPullRequestReviewContributions: number
  restrictedContributionsCount: number
  contributionCalendar: ContributionCalendar
}

export interface CachedRecapPayload {
  user: GitHubUser
  repos: GitHubRepo[]
  events: GitHubEvent[]
  contributions?: ContributionsSummary | null
}

export interface LanguageStat {
  name: string
  count: number
  percentage: number
}

export interface RepoHighlight {
  name: string
  stars: number
  description: string | null
  url: string
}

export interface RecentRepo {
  name: string
  pushedAt: string
  url: string
}

export interface ActiveRepo {
  name: string
  eventCount: number
}

export interface BestMonth {
  label: string
  count: number
  key: string
}

export interface RecapStats {
  username: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  accountAgeYears: number
  joinYear: number
  totalRepos: number
  totalStars: number
  totalForks: number
  mostStarredRepo: RepoHighlight | null
  topLanguages: LanguageStat[]
  languageCount: number
  mostRecentlyActiveRepo: RecentRepo | null
  busiestDay: string | null
  busiestHour: number | null
  totalPushEvents: number
  totalCommitsPushed: number
  longestStreak: number
  currentStreak: number
  mostActiveRepoInWindow: ActiveRepo | null
  hasEventStats: boolean
  hasContributionStats: boolean
  totalContributions: number
  privateContributions: number
  bestMonth: BestMonth | null
  contributionWeeks: ContributionWeek[]
  isEmptyProfile: boolean
}

export type PersonalityId =
  | 'ghost-mode'
  | 'night-owl'
  | 'polyglot'
  | 'weekend-warrior'
  | 'star-collector'
  | 'marathon-coder'
  | 'builder'

export interface Personality {
  id: PersonalityId
  title: string
  description: string
  emoji: string
}

export type SlideId =
  | 'intro'
  | 'age'
  | 'year'
  | 'quiet'
  | 'totals'
  | 'languages'
  | 'busiest'
  | 'streak'
  | 'starred'
  | 'personality'
  | 'summary'

export interface RecapResult {
  stats: RecapStats
  personality: Personality
}

export interface SlideProps {
  stats: RecapStats
  personality: Personality
  reducedMotion: boolean
  avatarSrc: string
}

export type GitHubErrorCode = 'not_found' | 'rate_limit' | 'http' | 'network'

export type ApiRecapErrorCode = 'not_found' | 'rate_limited' | 'upstream' | 'invalid_username'

export interface ApiRecapErrorBody {
  error: ApiRecapErrorCode
  resetAt?: string
}

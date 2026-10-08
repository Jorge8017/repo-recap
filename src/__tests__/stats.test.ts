import { describe, expect, it } from 'vitest'
import {
  buildRecapStats,
  formatAccountAge,
  formatHourLabel,
  longestActiveStreak,
  mostRecentlyActiveRepoFrom,
  mostStarredRepoFrom,
  topLanguagesFromRepos,
} from '../lib/stats'
import { planSlides } from '../lib/slidePlan'
import {
  buildSnapshotTiles,
  shouldUseSingleStatSnapshot,
} from '../lib/snapshot'
import type { GitHubEvent, GitHubRepo, GitHubUser } from '../types'

function user(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    login: 'octo',
    name: 'Octo Cat',
    avatar_url: 'https://example.com/avatar.png',
    bio: null,
    created_at: '2020-01-15T00:00:00.000Z',
    public_repos: 3,
    html_url: 'https://example.com/octo',
    ...overrides,
  }
}

function repo(overrides: Partial<GitHubRepo> & Pick<GitHubRepo, 'name'>): GitHubRepo {
  return {
    id: overrides.id ?? overrides.name.length,
    full_name: `octo/${overrides.name}`,
    description: null,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: '2024-01-01T00:00:00.000Z',
    html_url: `https://example.com/octo/${overrides.name}`,
    fork: false,
    ...overrides,
  }
}

function eventAtLocal(input: {
  type: string
  year: number
  month: number
  day: number
  hour: number
  repo?: string
  size?: number
  id?: string
}): GitHubEvent {
  const created = new Date(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    0,
    0,
  )
  return {
    id: input.id ?? `${created.toISOString()}-${input.type}`,
    type: input.type,
    created_at: created.toISOString(),
    repo: { name: input.repo ?? 'octo/hello' },
    payload: input.type === 'PushEvent' ? { size: input.size ?? 1 } : {},
  }
}

describe('formatAccountAge', () => {
  it('formats months under one year', () => {
    expect(formatAccountAge(0.5)).toBe('6 months')
    expect(formatAccountAge(1 / 12)).toBe('1 month')
  })

  it('formats whole and fractional years', () => {
    expect(formatAccountAge(1)).toBe('1 year')
    expect(formatAccountAge(4)).toBe('4 years')
    expect(formatAccountAge(2.4)).toBe('2.4 years')
    expect(formatAccountAge(12.9)).toBe('12 years')
  })
})

describe('formatHourLabel', () => {
  it('formats 12-hour times', () => {
    expect(formatHourLabel(0)).toBe('12:00 AM')
    expect(formatHourLabel(11)).toBe('11:00 AM')
    expect(formatHourLabel(12)).toBe('12:00 PM')
    expect(formatHourLabel(22)).toBe('10:00 PM')
  })
})

describe('buildRecapStats', () => {
  const now = new Date('2024-01-15T00:00:00.000Z')

  it('derives account age, join year, and display name', () => {
    const stats = buildRecapStats(user(), [], [], now)
    expect(stats.joinYear).toBe(2020)
    expect(stats.accountAgeYears).toBeCloseTo(4, 1)
    expect(stats.displayName).toBe('Octo Cat')
  })

  it('falls back to login when name is empty', () => {
    const stats = buildRecapStats(user({ name: '  ' }), [], [], now)
    expect(stats.displayName).toBe('octo')
  })

  it('handles a profile with no repos', () => {
    const stats = buildRecapStats(user({ public_repos: 0 }), [], [], now)
    expect(stats.totalRepos).toBe(0)
    expect(stats.totalStars).toBe(0)
    expect(stats.totalForks).toBe(0)
    expect(stats.mostStarredRepo).toBeNull()
    expect(stats.topLanguages).toEqual([])
    expect(stats.languageCount).toBe(0)
    expect(stats.mostRecentlyActiveRepo).toBeNull()
    expect(stats.isEmptyProfile).toBe(true)
  })

  it('sets isEmptyProfile only when there are no public repos and no events', () => {
    expect(buildRecapStats(user({ public_repos: 0 }), [], [], now).isEmptyProfile).toBe(
      true,
    )
    expect(
      buildRecapStats(
        user({ public_repos: 0 }),
        [],
        [
          eventAtLocal({
            type: 'WatchEvent',
            year: 2024,
            month: 1,
            day: 2,
            hour: 10,
          }),
        ],
        now,
      ).isEmptyProfile,
    ).toBe(false)
    expect(
      buildRecapStats(user({ public_repos: 1 }), [repo({ name: 'one' })], [], now)
        .isEmptyProfile,
    ).toBe(false)
    expect(
      buildRecapStats(user(), [repo({ name: 'one' })], [
        eventAtLocal({
          type: 'PushEvent',
          year: 2024,
          month: 1,
          day: 2,
          hour: 10,
        }),
      ], now).isEmptyProfile,
    ).toBe(false)
  })

  it('sums stars and forks and finds the most-starred repo', () => {
    const repos = [
      repo({ name: 'quiet', stargazers_count: 2, forks_count: 1 }),
      repo({ name: 'loud', stargazers_count: 40, forks_count: 3, description: 'A beacon' }),
      repo({ name: 'also-quiet', stargazers_count: 2, forks_count: 0 }),
    ]
    const stats = buildRecapStats(user(), repos, [], now)
    expect(stats.totalStars).toBe(44)
    expect(stats.totalForks).toBe(4)
    expect(stats.mostStarredRepo).toEqual({
      name: 'loud',
      stars: 40,
      description: 'A beacon',
      url: 'https://example.com/octo/loud',
    })
  })

  it('ignores zero-star repos for the highlight', () => {
    expect(
      mostStarredRepoFrom([repo({ name: 'empty', stargazers_count: 0 })]),
    ).toBeNull()
  })

  it('picks the most recently pushed repo', () => {
    const repos = [
      repo({ name: 'old', pushed_at: '2023-01-01T00:00:00.000Z' }),
      repo({ name: 'new', pushed_at: '2024-06-01T00:00:00.000Z' }),
      repo({ name: 'mid', pushed_at: '2024-02-01T00:00:00.000Z' }),
    ]
    expect(mostRecentlyActiveRepoFrom(repos)?.name).toBe('new')
  })

  it('returns no languages when every repo language is empty', () => {
    const repos = [
      repo({ name: 'a', language: null }),
      repo({ name: 'b', language: null }),
    ]
    expect(topLanguagesFromRepos(repos)).toEqual({
      topLanguages: [],
      languageCount: 0,
    })
  })

  it('ranks top 5 languages with percentages', () => {
    const repos = [
      repo({ name: 'a', language: 'TypeScript' }),
      repo({ name: 'b', language: 'TypeScript' }),
      repo({ name: 'c', language: 'TypeScript' }),
      repo({ name: 'd', language: 'Rust' }),
      repo({ name: 'e', language: 'Rust' }),
      repo({ name: 'f', language: 'Go' }),
      repo({ name: 'g', language: 'Python' }),
      repo({ name: 'h', language: 'CSS' }),
      repo({ name: 'i', language: 'Shell' }),
      repo({ name: 'j', language: null }),
    ]
    const { topLanguages, languageCount } = topLanguagesFromRepos(repos)
    expect(languageCount).toBe(6)
    expect(topLanguages).toHaveLength(5)
    expect(topLanguages[0]).toMatchObject({ name: 'TypeScript', count: 3, percentage: 33 })
    expect(topLanguages[1]).toMatchObject({ name: 'Rust', count: 2 })
    expect(topLanguages.map((item) => item.name)).not.toContain('Shell')
  })

  it('handles a profile with no events', () => {
    const stats = buildRecapStats(user(), [repo({ name: 'only' })], [], now)
    expect(stats.hasEventStats).toBe(false)
    expect(stats.busiestDay).toBeNull()
    expect(stats.busiestHour).toBeNull()
    expect(stats.totalPushEvents).toBe(0)
    expect(stats.totalCommitsPushed).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.mostActiveRepoInWindow).toBeNull()
  })

  it('computes busiest local day and hour, commits, and most active repo', () => {
    const events = [
      eventAtLocal({ type: 'PushEvent', year: 2024, month: 3, day: 11, hour: 14, size: 3, repo: 'octo/alpha' }),
      eventAtLocal({ type: 'PushEvent', year: 2024, month: 3, day: 11, hour: 14, size: 4, repo: 'octo/alpha' }),
      eventAtLocal({ type: 'WatchEvent', year: 2024, month: 3, day: 11, hour: 9, repo: 'octo/beta' }),
      eventAtLocal({ type: 'IssuesEvent', year: 2024, month: 3, day: 12, hour: 14, repo: 'octo/alpha' }),
    ]
    const stats = buildRecapStats(user(), [], events, now)
    expect(stats.hasEventStats).toBe(true)
    expect(stats.busiestHour).toBe(14)
    expect(stats.totalPushEvents).toBe(2)
    expect(stats.totalCommitsPushed).toBe(7)
    expect(stats.mostActiveRepoInWindow).toEqual({ name: 'alpha', eventCount: 3 })
    const sample = new Date(2024, 2, 11)
    const expectedDay = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ][sample.getDay()]
    expect(stats.busiestDay).toBe(expectedDay)
  })
})

describe('longestActiveStreak', () => {
  it('returns 0 without events', () => {
    expect(longestActiveStreak([])).toBe(0)
  })

  it('counts consecutive local calendar days and resets after a gap', () => {
    const events = [
      eventAtLocal({ type: 'PushEvent', year: 2024, month: 5, day: 1, hour: 10, id: '1' }),
      eventAtLocal({ type: 'PushEvent', year: 2024, month: 5, day: 2, hour: 23, id: '2' }),
      eventAtLocal({ type: 'WatchEvent', year: 2024, month: 5, day: 3, hour: 1, id: '3' }),
      eventAtLocal({ type: 'PushEvent', year: 2024, month: 5, day: 5, hour: 12, id: '4' }),
      eventAtLocal({ type: 'PushEvent', year: 2024, month: 5, day: 6, hour: 12, id: '5' }),
    ]
    expect(longestActiveStreak(events)).toBe(3)
  })
})

describe('planSlides', () => {
  it('plays the Quiet Mode story for empty public profiles', () => {
    const empty = buildRecapStats(user({ public_repos: 0 }), [], [])
    expect(empty.isEmptyProfile).toBe(true)
    expect(planSlides(empty)).toEqual(['intro', 'age', 'quiet', 'summary'])
  })

  it('skips empty-data slides on sparse profiles instead of showing zeros', () => {
    const sparse = buildRecapStats(
      user({ public_repos: 2 }),
      [repo({ name: 'blank', language: null, stargazers_count: 0, forks_count: 0 })],
      [],
    )
    expect(sparse.isEmptyProfile).toBe(false)
    expect(planSlides(sparse)).toEqual(['intro', 'age', 'totals', 'personality', 'summary'])
  })

  it('includes language, event, and starred slides when data exists', () => {
    const stats = buildRecapStats(
      user(),
      [
        repo({
          name: 'star',
          language: 'Go',
          stargazers_count: 12,
          pushed_at: '2024-01-01T00:00:00.000Z',
        }),
      ],
      [
        eventAtLocal({
          type: 'PushEvent',
          year: 2024,
          month: 1,
          day: 2,
          hour: 10,
          size: 2,
        }),
      ],
    )
    expect(planSlides(stats)).toEqual([
      'intro',
      'age',
      'totals',
      'languages',
      'busiest',
      'streak',
      'starred',
      'personality',
      'summary',
    ])
  })
})

describe('buildSnapshotTiles', () => {
  const now = new Date('2024-01-15T00:00:00.000Z')

  it('omits zero, empty, and dash values', () => {
    const stats = buildRecapStats(
      user({ public_repos: 2 }),
      [repo({ name: 'blank', language: null, stargazers_count: 0, forks_count: 0 })],
      [],
      now,
    )
    const tiles = buildSnapshotTiles(stats)
    expect(tiles.map((tile) => tile.label)).toEqual(['Public for', 'Repos'])
    expect(tiles.some((tile) => tile.value === '0' || tile.value === '—')).toBe(
      false,
    )
  })

  it('uses a single large-stat snapshot when fewer than two tiles remain', () => {
    const empty = buildRecapStats(user({ public_repos: 0 }), [], [], now)
    const tiles = buildSnapshotTiles(empty)
    expect(tiles).toHaveLength(1)
    expect(tiles[0]?.label).toBe('Public for')
    expect(shouldUseSingleStatSnapshot(tiles)).toBe(true)
  })
})

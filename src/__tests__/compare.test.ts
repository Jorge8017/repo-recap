import { describe, expect, it } from 'vitest'
import {
  buildCompareScore,
  compareMetric,
  isSameUser,
  planCompareSlides,
} from '../lib/compare'
import { assignPersonality } from '../lib/personality'
import type { RecapResult, RecapStats } from '../types'

function stats(overrides: Partial<RecapStats> = {}): RecapStats {
  return {
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: 'https://example.com/a.png',
    profileUrl: 'https://github.com/alice',
    accountAgeYears: 5,
    joinYear: 2020,
    totalRepos: 10,
    totalStars: 50,
    totalForks: 2,
    mostStarredRepo: null,
    topLanguages: [{ name: 'TypeScript', count: 3, percentage: 60 }],
    languageCount: 1,
    mostRecentlyActiveRepo: null,
    busiestDay: 'Monday',
    busiestHour: 14,
    totalPushEvents: 10,
    totalCommitsPushed: 20,
    longestStreak: 5,
    currentStreak: 1,
    mostActiveRepoInWindow: null,
    hasEventStats: true,
    hasContributionStats: true,
    totalContributions: 100,
    privateContributions: 0,
    bestMonth: null,
    contributionWeeks: [],
    isEmptyProfile: false,
    ...overrides,
  }
}

function result(overrides: Partial<RecapStats> = {}): RecapResult {
  const s = stats(overrides)
  return { stats: s, personality: assignPersonality(s) }
}

describe('compare helpers', () => {
  it('rejects the same user case-insensitively', () => {
    expect(isSameUser('Gaearon', 'gaearon')).toBe(true)
    expect(isSameUser('gaearon', 'sindresorhus')).toBe(false)
  })

  it('compares metrics with ties', () => {
    expect(compareMetric(10, 3)).toBe('a')
    expect(compareMetric(3, 10)).toBe('b')
    expect(compareMetric(5, 5)).toBe('tie')
  })

  it('builds a score from contributions, streak, stars, and repos', () => {
    const score = buildCompareScore(
      stats({
        username: 'alice',
        totalContributions: 200,
        longestStreak: 3,
        totalStars: 10,
        totalRepos: 2,
      }),
      stats({
        username: 'bob',
        totalContributions: 50,
        longestStreak: 10,
        totalStars: 10,
        totalRepos: 8,
      }),
    )
    expect(score.aWins).toBe(1)
    expect(score.bWins).toBe(2)
    expect(score.winner).toBe('b')
    expect(score.headline).toBe('@bob wins 2–1')
  })

  it('reports a tie state', () => {
    const score = buildCompareScore(
      stats({ totalContributions: 10, longestStreak: 2, totalStars: 1, totalRepos: 1 }),
      stats({
        username: 'bob',
        totalContributions: 10,
        longestStreak: 2,
        totalStars: 1,
        totalRepos: 1,
      }),
    )
    expect(score.winner).toBe('tie')
    expect(score.headline).toContain('tie')
  })

  it('shows Private for Ghost Mode instead of zeros', () => {
    const score = buildCompareScore(
      stats({
        username: 'ghost',
        isEmptyProfile: true,
        totalContributions: 0,
        longestStreak: 0,
        totalStars: 0,
        totalRepos: 0,
      }),
      stats({ username: 'bob', totalContributions: 12 }),
    )
    expect(score.rounds[0]?.aDisplay).toBe('Private')
    expect(score.rounds[0]?.bDisplay).toBe('12')
  })

  it('skips slides when both sides lack data', () => {
    const empty = result({
      totalContributions: 0,
      hasContributionStats: false,
      longestStreak: 0,
      totalStars: 0,
      topLanguages: [],
      busiestDay: null,
      busiestHour: null,
      isEmptyProfile: false,
    })
    const slides = planCompareSlides(empty, empty)
    expect(slides).toEqual([
      'compare-intro',
      'compare-personalities',
      'compare-score',
    ])
  })

  it('keeps Ghost Mode slides even with zero public stats', () => {
    const ghost = result({
      username: 'ghost',
      isEmptyProfile: true,
      totalContributions: 0,
      longestStreak: 0,
      totalStars: 0,
      topLanguages: [],
      busiestDay: null,
      busiestHour: null,
    })
    const slides = planCompareSlides(ghost, ghost)
    expect(slides).toContain('compare-contributions')
    expect(slides).toContain('compare-streak')
    expect(slides).toContain('compare-stars')
  })
})

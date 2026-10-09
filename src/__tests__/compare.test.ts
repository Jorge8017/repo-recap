import { describe, expect, it } from 'vitest'
import {
  buildCompareScore,
  busiestContrastLine,
  compareMetric,
  contributionsVerdict,
  formatMultiplier,
  isNearEqual,
  isSameUser,
  languagesVerdict,
  planCompareSlides,
  starsVerdict,
  streakVerdict,
} from '../lib/compare'
import { assignPersonality } from '../lib/personality'
import { formatCount } from '../lib/stats'
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

function ghost(overrides: Partial<RecapStats> = {}): RecapStats {
  return stats({
    username: 'ghost',
    displayName: 'Ghost',
    isEmptyProfile: true,
    totalContributions: 0,
    longestStreak: 0,
    totalStars: 0,
    totalRepos: 0,
    topLanguages: [],
    busiestDay: null,
    busiestHour: null,
    hasContributionStats: false,
    ...overrides,
  })
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
    expect(score.enoughData).toBe(true)
    expect(score.headline).toBe('@bob takes it, 2–1')
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
    expect(score.enoughData).toBe(true)
  })

  it('excludes all-private Ghost Mode pairs from scoring', () => {
    const score = buildCompareScore(ghost({ username: 'a' }), ghost({ username: 'b' }))
    expect(score.enoughData).toBe(false)
    expect(score.aWins).toBe(0)
    expect(score.bWins).toBe(0)
    expect(score.headline).toBe('Not enough public data to score')
    expect(score.rounds.every((round) => !round.comparable)).toBe(true)
    expect(score.rounds[0]?.aDisplay).toBe('Private')
  })

  it('excludes one-private categories and never counts Private as a loss', () => {
    const score = buildCompareScore(
      ghost({ username: 'ghost' }),
      stats({
        username: 'bob',
        totalContributions: 12,
        longestStreak: 4,
        totalStars: 9,
        totalRepos: 3,
      }),
    )
    expect(score.rounds.every((round) => !round.comparable)).toBe(true)
    expect(score.enoughData).toBe(false)
    expect(score.headline).toBe('Not enough public data to score')
    expect(score.aWins).toBe(0)
    expect(score.bWins).toBe(0)
    expect(score.rounds[0]?.aDisplay).toBe('Private')
    expect(score.rounds[0]?.bDisplay).toBe('12')
  })

  it('scores only comparable rounds in a mixed private set', () => {
    const score = buildCompareScore(
      stats({
        username: 'alice',
        hasContributionStats: false,
        totalContributions: 0,
        longestStreak: 10,
        totalStars: 5,
        totalRepos: 2,
      }),
      stats({
        username: 'bob',
        hasContributionStats: true,
        totalContributions: 80,
        longestStreak: 3,
        totalStars: 5,
        totalRepos: 8,
      }),
    )
    const contributions = score.rounds.find((round) => round.id === 'contributions')
    expect(contributions?.comparable).toBe(false)
    expect(contributions?.aDisplay).toBe('Private')
    expect(score.enoughData).toBe(true)
    expect(score.aWins).toBe(1)
    expect(score.bWins).toBe(1)
    expect(score.winner).toBe('tie')
    expect(score.headline).toContain('tie')
  })

  it('formats multipliers and contribution verdicts', () => {
    expect(formatMultiplier(5.74)).toBe('5.7×')
    expect(formatMultiplier(12.2)).toBe('12×')
    const parts = contributionsVerdict(
      stats({ displayName: 'Dan Abramov', username: 'gaearon', totalContributions: 20 }),
      stats({
        displayName: 'Sindre Sorhus',
        username: 'sindresorhus',
        totalContributions: 114,
      }),
    )
    expect(parts.map((part) => part.text).join('')).toContain('5.7×')
    expect(parts.some((part) => part.tone === 'b' && part.text === '5.7×')).toBe(true)

    const privateParts = contributionsVerdict(
      ghost({ username: 'quiet' }),
      stats({ username: 'bob', totalContributions: 12 }),
    )
    expect(privateParts[0]?.text).toBe('@quiet keeps this one private.')

    const streak = streakVerdict(
      stats({ displayName: 'Dan', longestStreak: 10 }),
      stats({ displayName: 'Sindre', username: 'sindresorhus', longestStreak: 6 }),
    )
    expect(streak.map((part) => part.text).join('')).toContain('by 4 days')
  })

  it('uses leads-by when the losing value is 0', () => {
    const parts = starsVerdict(
      stats({ displayName: 'Dan', username: 'gaearon', totalStars: 45_499 }),
      stats({ displayName: 'Jordan', username: 'jorge8017', totalStars: 0 }),
    )
    const text = parts.map((part) => part.text).join('')
    expect(text).toBe(`dan leads by ${formatCount(45_499)} stars.`)
    expect(text).not.toContain('Too close')
    expect(text).not.toContain('×')

    const contrib = contributionsVerdict(
      stats({ displayName: 'Alice', totalContributions: 0 }),
      stats({ displayName: 'Bob', username: 'bob', totalContributions: 12 }),
    )
    expect(contrib.map((part) => part.text).join('')).toBe(
      `bob leads by ${formatCount(12)} contributions.`,
    )
  })

  it('says too close only for near-equal positive values or exact ties', () => {
    expect(isNearEqual(100, 96)).toBe(true)
    expect(isNearEqual(100, 90)).toBe(false)
    expect(isNearEqual(0, 100)).toBe(false)

    const near = contributionsVerdict(
      stats({ totalContributions: 100 }),
      stats({ username: 'bob', totalContributions: 97 }),
    )
    expect(near[0]?.text).toBe('Too close to call.')

    const tied = starsVerdict(
      stats({ totalStars: 50 }),
      stats({ username: 'bob', totalStars: 50 }),
    )
    expect(tied[0]?.text).toBe('Too close to call.')
  })

  it('builds language and peak-time verdicts without placeholder rhythms', () => {
    expect(
      languagesVerdict(
        stats({ username: 'quiet', topLanguages: [] }),
        stats({ username: 'bob' }),
      ),
    ).toBe("@quiet hasn't published any code yet")
    expect(
      languagesVerdict(
        stats({ topLanguages: [{ name: 'Go', count: 1, percentage: 100 }] }),
        stats({
          username: 'bob',
          topLanguages: [{ name: 'Rust', count: 1, percentage: 100 }],
        }),
      ),
    ).toBe('Different stacks')
    expect(
      busiestContrastLine(
        stats({ username: 'quiet', busiestDay: null, busiestHour: null }),
        stats({ username: 'bob', busiestDay: 'Monday', busiestHour: 9 }),
      ),
    ).toBe('@quiet keeps their hours private')
    expect(
      busiestContrastLine(
        stats({ busiestDay: 'Monday', busiestHour: 23 }),
        stats({ username: 'bob', busiestDay: 'Tuesday', busiestHour: 8 }),
      ),
    ).toBe('Night owl vs early bird')
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
    const ghostResult = result({
      username: 'ghost',
      isEmptyProfile: true,
      totalContributions: 0,
      longestStreak: 0,
      totalStars: 0,
      topLanguages: [],
      busiestDay: null,
      busiestHour: null,
    })
    const slides = planCompareSlides(ghostResult, ghostResult)
    expect(slides).toContain('compare-contributions')
    expect(slides).toContain('compare-streak')
    expect(slides).toContain('compare-stars')
  })
})

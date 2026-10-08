import { describe, expect, it } from 'vitest'
import { assignPersonality } from '../lib/personality'
import type { RecapStats } from '../types'

function stats(overrides: Partial<RecapStats> = {}): RecapStats {
  return {
    username: 'dev',
    displayName: 'Dev',
    avatarUrl: 'https://example.com/a.png',
    profileUrl: 'https://example.com/dev',
    accountAgeYears: 3,
    joinYear: 2021,
    totalRepos: 2,
    totalStars: 0,
    totalForks: 0,
    mostStarredRepo: null,
    topLanguages: [],
    languageCount: 1,
    mostRecentlyActiveRepo: null,
    busiestDay: 'Wednesday',
    busiestHour: 14,
    totalPushEvents: 0,
    totalCommitsPushed: 0,
    longestStreak: 0,
    mostActiveRepoInWindow: null,
    hasEventStats: true,
    isEmptyProfile: false,
    ...overrides,
  }
}

describe('assignPersonality', () => {
  it('assigns Ghost Mode first for empty public profiles', () => {
    const result = assignPersonality(
      stats({
        isEmptyProfile: true,
        totalRepos: 0,
        hasEventStats: false,
        busiestHour: 23,
        languageCount: 5,
        busiestDay: 'Sunday',
        totalStars: 500,
        longestStreak: 12,
      }),
    )
    expect(result).toMatchObject({
      id: 'ghost-mode',
      title: 'Ghost Mode',
      emoji: '👻',
      description: 'Building in private. Mysterious.',
    })
  })

  it('assigns Night Owl for peak hours between 22:00 and 04:00', () => {
    expect(assignPersonality(stats({ busiestHour: 22 })).id).toBe('night-owl')
    expect(assignPersonality(stats({ busiestHour: 3 })).id).toBe('night-owl')
    expect(assignPersonality(stats({ busiestHour: 0 })).id).toBe('night-owl')
    expect(assignPersonality(stats({ busiestHour: 4 })).id).not.toBe('night-owl')
    expect(assignPersonality(stats({ busiestHour: 21 })).id).not.toBe('night-owl')
  })

  it('assigns Polyglot when four or more languages are present', () => {
    const result = assignPersonality(stats({ languageCount: 4, busiestHour: 11 }))
    expect(result).toMatchObject({
      id: 'polyglot',
      title: 'Polyglot',
      emoji: '🧬',
    })
  })

  it('assigns Weekend Warrior for Saturday or Sunday peaks', () => {
    expect(
      assignPersonality(stats({ busiestDay: 'Saturday', busiestHour: 11 })).id,
    ).toBe('weekend-warrior')
    expect(
      assignPersonality(stats({ busiestDay: 'Sunday', busiestHour: 11 })).id,
    ).toBe('weekend-warrior')
  })

  it('assigns Star Collector at 100 or more stars', () => {
    expect(assignPersonality(stats({ totalStars: 100, busiestHour: 11 })).id).toBe(
      'star-collector',
    )
    expect(assignPersonality(stats({ totalStars: 99, busiestHour: 11 })).id).toBe(
      'builder',
    )
  })

  it('assigns Marathon Coder for a streak of at least 7 days', () => {
    expect(
      assignPersonality(stats({ longestStreak: 7, busiestHour: 11 })).id,
    ).toBe('marathon-coder')
    expect(
      assignPersonality(stats({ longestStreak: 6, busiestHour: 11 })).id,
    ).toBe('builder')
  })

  it('falls back to Builder when nothing else matches', () => {
    const result = assignPersonality(
      stats({
        hasEventStats: false,
        busiestDay: null,
        busiestHour: null,
        languageCount: 0,
        totalStars: 0,
        longestStreak: 0,
      }),
    )
    expect(result).toMatchObject({
      id: 'builder',
      title: 'Builder',
      emoji: '🧱',
    })
  })

  it('uses priority order when several personalities could apply', () => {
    const stacked = stats({
      busiestHour: 23,
      languageCount: 5,
      busiestDay: 'Sunday',
      totalStars: 500,
      longestStreak: 12,
    })
    expect(assignPersonality(stacked).id).toBe('night-owl')

    expect(
      assignPersonality(
        stats({
          busiestHour: 10,
          languageCount: 5,
          busiestDay: 'Sunday',
          totalStars: 500,
          longestStreak: 12,
        }),
      ).id,
    ).toBe('polyglot')

    expect(
      assignPersonality(
        stats({
          busiestHour: 10,
          languageCount: 2,
          busiestDay: 'Saturday',
          totalStars: 500,
          longestStreak: 12,
        }),
      ).id,
    ).toBe('weekend-warrior')
  })
})

import { describe, expect, it } from 'vitest'
import {
  bestMonthFromCalendar,
  busiestWeekdayFromCalendar,
  buildRecapStats,
  currentContributionStreak,
  longestContributionStreak,
} from '../lib/stats'
import type {
  ContributionWeek,
  ContributionsSummary,
  GitHubUser,
} from '../types'

function day(
  date: string,
  contributionCount: number,
  weekday: number,
): ContributionWeek['contributionDays'][number] {
  return { date, contributionCount, weekday }
}

function weeksFromDays(
  days: Array<{ date: string; count: number; weekday: number }>,
): ContributionWeek[] {
  const byWeek = new Map<string, ContributionWeek['contributionDays']>()
  for (const entry of days) {
    const date = new Date(`${entry.date}T12:00:00.000Z`)
    const weekStart = new Date(date)
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay())
    const key = weekStart.toISOString().slice(0, 10)
    const list = byWeek.get(key) ?? []
    list.push(day(entry.date, entry.count, entry.weekday))
    byWeek.set(key, list)
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, contributionDays]) => ({ contributionDays }))
}

function contributions(
  days: Array<{ date: string; count: number; weekday: number }>,
  restricted = 0,
): ContributionsSummary {
  const calendarWeeks = weeksFromDays(days)
  const total = days.reduce((sum, entry) => sum + entry.count, 0)
  return {
    totalCommitContributions: total,
    totalPullRequestContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestReviewContributions: 0,
    restrictedContributionsCount: restricted,
    contributionCalendar: {
      totalContributions: total,
      weeks: calendarWeeks,
    },
  }
}

const user: GitHubUser = {
  login: 'octo',
  name: 'Octo',
  avatar_url: 'https://example.com/a.png',
  bio: null,
  created_at: '2020-01-01T00:00:00.000Z',
  public_repos: 0,
  html_url: 'https://github.com/octo',
}

describe('calendar streaks', () => {
  it('counts streaks across year boundaries', () => {
    const weeks = weeksFromDays([
      { date: '2023-12-30', count: 1, weekday: 6 },
      { date: '2023-12-31', count: 2, weekday: 0 },
      { date: '2024-01-01', count: 3, weekday: 1 },
      { date: '2024-01-02', count: 1, weekday: 2 },
      { date: '2024-01-04', count: 1, weekday: 4 },
    ])
    expect(longestContributionStreak(weeks)).toBe(4)
  })

  it('returns 0 for an empty calendar', () => {
    expect(longestContributionStreak([])).toBe(0)
    expect(currentContributionStreak([], '2024-06-01')).toBe(0)
    expect(busiestWeekdayFromCalendar([])).toBeNull()
    expect(bestMonthFromCalendar([])).toBeNull()
  })

  it('computes current streak ending today or yesterday', () => {
    const weeks = weeksFromDays([
      { date: '2024-05-30', count: 1, weekday: 4 },
      { date: '2024-05-31', count: 2, weekday: 5 },
      { date: '2024-06-01', count: 1, weekday: 6 },
    ])
    expect(currentContributionStreak(weeks, '2024-06-01')).toBe(3)
    expect(currentContributionStreak(weeks, '2024-06-02')).toBe(3)
    expect(currentContributionStreak(weeks, '2024-06-03')).toBe(0)
  })
})

describe('calendar aggregates', () => {
  it('picks the busiest weekday and best month', () => {
    const weeks = weeksFromDays([
      { date: '2024-03-06', count: 5, weekday: 3 },
      { date: '2024-03-13', count: 4, weekday: 3 },
      { date: '2024-04-01', count: 2, weekday: 1 },
      { date: '2024-04-08', count: 1, weekday: 1 },
    ])
    expect(busiestWeekdayFromCalendar(weeks)).toBe('Wednesday')
    expect(bestMonthFromCalendar(weeks)).toEqual({
      label: 'March 2024',
      count: 9,
      key: '2024-03',
    })
  })

  it('surfaces all-private contribution counts on empty public profiles', () => {
    const stats = buildRecapStats(
      user,
      [],
      [],
      new Date('2024-06-15T00:00:00.000Z'),
      contributions([], 1204),
    )
    expect(stats.isEmptyProfile).toBe(true)
    expect(stats.privateContributions).toBe(1204)
    expect(stats.totalContributions).toBe(0)
    expect(stats.hasContributionStats).toBe(true)
    expect(stats.longestStreak).toBe(0)
  })
})

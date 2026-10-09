import { describe, expect, it } from 'vitest'
import {
  buildMonthlyBars,
  sumMonthlyBars,
  totalContributionsInWeeks,
} from '../lib/monthlyBars'
import type { ContributionWeek } from '../types'

function weeksFromDays(
  days: Array<{ date: string; count: number }>,
): ContributionWeek[] {
  const byWeek = new Map<string, ContributionWeek['contributionDays']>()
  for (const entry of days) {
    const date = new Date(`${entry.date}T12:00:00.000Z`)
    const weekStart = new Date(date)
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay())
    const key = weekStart.toISOString().slice(0, 10)
    const list = byWeek.get(key) ?? []
    list.push({
      date: entry.date,
      contributionCount: entry.count,
      weekday: date.getUTCDay(),
    })
    byWeek.set(key, list)
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, contributionDays]) => ({ contributionDays }))
}

describe('buildMonthlyBars', () => {
  it('returns 12 rolling months oldest-first with initials', () => {
    const now = new Date(2024, 5, 15) // June 2024
    const bars = buildMonthlyBars([], now)
    expect(bars).toHaveLength(12)
    expect(bars[0]?.key).toBe('2023-07')
    expect(bars[11]?.key).toBe('2024-06')
    expect(bars.map((bar) => bar.initial).join('')).toBe('JASONDJFMAMJ')
  })

  it('marks the busiest month as best', () => {
    const now = new Date(2024, 5, 15)
    const weeks = weeksFromDays([
      { date: '2024-03-01', count: 6 },
      { date: '2024-04-01', count: 30 },
      { date: '2024-05-01', count: 1 },
    ])
    const bars = buildMonthlyBars(weeks, now)
    const best = bars.find((bar) => bar.isBest)
    expect(best?.key).toBe('2024-04')
    expect(best?.total).toBe(30)
  })

  it('sums to the calendar totalContributions for the last 12 months', () => {
    const now = new Date(2024, 5, 15)
    const days = [
      { date: '2023-07-04', count: 2 },
      { date: '2023-11-12', count: 5 },
      { date: '2024-01-20', count: 3 },
      { date: '2024-04-08', count: 11 },
      { date: '2024-06-02', count: 7 },
    ]
    const weeks = weeksFromDays(days)
    const calendarTotal = totalContributionsInWeeks(weeks)
    const bars = buildMonthlyBars(weeks, now)
    expect(sumMonthlyBars(bars)).toBe(calendarTotal)
    expect(calendarTotal).toBe(28)
  })
})

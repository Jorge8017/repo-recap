import { describe, expect, it } from 'vitest'
import { buildMonthlyBars } from '../lib/monthlyBars'
import type { ContributionWeek } from '../types'

function weeksFromMonths(
  entries: Array<{ key: string; days: number[] }>,
): ContributionWeek[] {
  return entries.map((entry) => ({
    contributionDays: entry.days.map((count, index) => ({
      date: `${entry.key}-${String(index + 1).padStart(2, '0')}`,
      contributionCount: count,
      weekday: index % 7,
    })),
  }))
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
    const bars = buildMonthlyBars(
      weeksFromMonths([
        { key: '2024-03', days: [2, 2, 2] },
        { key: '2024-04', days: [10, 10, 10] },
        { key: '2024-05', days: [1] },
      ]),
      now,
    )
    const best = bars.find((bar) => bar.isBest)
    expect(best?.key).toBe('2024-04')
    expect(best?.total).toBe(30)
  })
})

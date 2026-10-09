import type { ContributionWeek } from '../types'

const MONTH_INITIALS = [
  'J',
  'F',
  'M',
  'A',
  'M',
  'J',
  'J',
  'A',
  'S',
  'O',
  'N',
  'D',
] as const

export interface MonthBar {
  key: string
  initial: string
  total: number
  isBest: boolean
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/** Build 12 rolling months (oldest → newest) from contribution calendar days. */
export function buildMonthlyBars(
  weeks: ContributionWeek[],
  now: Date = new Date(),
): MonthBar[] {
  const totals = new Map<string, number>()
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      const key = day.date.slice(0, 7)
      totals.set(key, (totals.get(key) ?? 0) + day.contributionCount)
    }
  }

  const cursor = new Date(now.getFullYear(), now.getMonth(), 1)
  cursor.setMonth(cursor.getMonth() - 11)

  const bars: MonthBar[] = []
  for (let index = 0; index < 12; index += 1) {
    const year = cursor.getFullYear()
    const monthIndex = cursor.getMonth()
    const key = monthKey(year, monthIndex)
    bars.push({
      key,
      initial: MONTH_INITIALS[monthIndex] ?? '?',
      total: totals.get(key) ?? 0,
      isBest: false,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  let bestIndex = -1
  let bestTotal = 0
  bars.forEach((bar, index) => {
    if (bar.total > bestTotal) {
      bestTotal = bar.total
      bestIndex = index
    }
  })
  if (bestIndex >= 0 && bestTotal > 0) {
    const best = bars[bestIndex]
    if (best) bars[bestIndex] = { ...best, isBest: true }
  }

  return bars
}

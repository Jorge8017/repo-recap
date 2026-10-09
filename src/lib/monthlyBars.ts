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

export function rollingMonthKeys(now: Date = new Date()): string[] {
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1)
  cursor.setMonth(cursor.getMonth() - 11)
  const keys: string[] = []
  for (let index = 0; index < 12; index += 1) {
    keys.push(monthKey(cursor.getFullYear(), cursor.getMonth()))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return keys
}

export function totalContributionsInWeeks(weeks: ContributionWeek[]): number {
  let total = 0
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      total += day.contributionCount
    }
  }
  return total
}

/** Build 12 rolling months (oldest → newest) from contribution calendar days. */
export function buildMonthlyBars(
  weeks: ContributionWeek[],
  now: Date = new Date(),
): MonthBar[] {
  const keys = rollingMonthKeys(now)
  const keySet = new Set(keys)
  const totals = new Map<string, number>(keys.map((key) => [key, 0]))

  for (const week of weeks) {
    for (const day of week.contributionDays) {
      const key = day.date.slice(0, 7)
      if (!keySet.has(key)) continue
      totals.set(key, (totals.get(key) ?? 0) + day.contributionCount)
    }
  }

  const bars: MonthBar[] = keys.map((key) => {
    const monthIndex = Number(key.slice(5, 7)) - 1
    return {
      key,
      initial: MONTH_INITIALS[monthIndex] ?? '?',
      total: totals.get(key) ?? 0,
      isBest: false,
    }
  })

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

export function sumMonthlyBars(bars: MonthBar[]): number {
  return bars.reduce((sum, bar) => sum + bar.total, 0)
}

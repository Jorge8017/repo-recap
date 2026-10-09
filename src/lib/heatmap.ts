import type { ContributionDay, ContributionWeek } from '../types'

export const HEATMAP_LEVEL_COLORS = [
  'rgba(244, 237, 226, 0.10)',
  'rgba(242, 196, 109, 0.35)',
  'rgba(242, 196, 109, 0.55)',
  'rgba(242, 196, 109, 0.80)',
  '#F2C46D',
] as const

export const FULL_WEEKS = 53
export const HALF_WEEKS = 26
export const HEATMAP_ROWS = 7
export const MAX_CELL = 14
export const MIN_CELL = 4

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function contributionLevel(
  count: number,
  thresholds: readonly [number, number, number],
): number {
  if (count <= 0) return 0
  const [q1, q2, q3] = thresholds
  if (count <= q1) return 1
  if (count <= q2) return 2
  if (count <= q3) return 3
  return 4
}

/** Quartile thresholds of non-zero contribution counts. */
export function quartileThresholds(
  counts: readonly number[],
): [number, number, number] {
  const nonZero = counts.filter((count) => count > 0).sort((a, b) => a - b)
  if (nonZero.length === 0) return [0, 0, 0]

  const at = (fraction: number) => {
    const index = Math.min(
      nonZero.length - 1,
      Math.max(0, Math.floor((nonZero.length - 1) * fraction)),
    )
    return nonZero[index] ?? 0
  }

  const q1 = at(0.25)
  const q2 = at(0.5)
  const q3 = at(0.75)
  return [q1, q2, Math.max(q3, q2)]
}

export function fitHeatmapCells(
  width: number,
  cols: number,
  minCell = MIN_CELL,
  maxCell = MAX_CELL,
): { cell: number; gap: number; fits: boolean } {
  if (width < 1 || cols < 1) {
    return { cell: minCell, gap: 2, fits: false }
  }

  let cell = maxCell
  let gap = Math.max(2, Math.round(cell * 0.25))
  for (let step = 0; step < 6; step += 1) {
    gap = Math.max(2, Math.round(cell * 0.25))
    cell = Math.min(maxCell, Math.floor((width - gap * (cols - 1)) / cols))
    if (cell < 1) cell = 1
  }
  gap = Math.max(2, Math.round(cell * 0.25))
  cell = Math.min(maxCell, Math.floor((width - gap * (cols - 1)) / cols))
  if (cell < 1) cell = 1
  return { cell, gap, fits: cell >= minCell }
}

export function chooseHeatmapWeekCount(width: number): number {
  const full = fitHeatmapCells(width, FULL_WEEKS)
  if (full.fits) return FULL_WEEKS
  return HALF_WEEKS
}

export interface HeatmapCell {
  date: string
  count: number
  level: number
  weekIndex: number
  row: number
}

export interface HeatmapMonthLabel {
  label: string
  weekIndex: number
}

export interface HeatmapModel {
  weeksShown: number
  cells: HeatmapCell[]
  months: HeatmapMonthLabel[]
  truncated: boolean
}

function padWeeks(weeks: ContributionWeek[], count: number): ContributionWeek[] {
  const sliced = weeks.slice(-count)
  const padded = [...sliced]
  while (padded.length < count) {
    padded.unshift({ contributionDays: [] })
  }
  return padded
}

function dayInWeek(
  week: ContributionWeek,
  weekday: number,
): ContributionDay | undefined {
  return week.contributionDays.find((day) => day.weekday === weekday)
}

export function buildHeatmapModel(
  weeks: ContributionWeek[],
  weekCount: number = FULL_WEEKS,
): HeatmapModel {
  const padded = padWeeks(weeks, weekCount)
  const counts: number[] = []
  for (const week of padded) {
    for (const day of week.contributionDays) {
      counts.push(day.contributionCount)
    }
  }
  const thresholds = quartileThresholds(counts)

  const cells: HeatmapCell[] = []
  const months: HeatmapMonthLabel[] = []
  let lastMonth = -1

  padded.forEach((week, weekIndex) => {
    let firstDate: string | null = null
    for (let row = 0; row < HEATMAP_ROWS; row += 1) {
      const day = dayInWeek(week, row)
      const count = day?.contributionCount ?? 0
      const date = day?.date ?? `empty-${weekIndex}-${row}`
      if (day && !firstDate) firstDate = day.date
      cells.push({
        date,
        count,
        level: contributionLevel(count, thresholds),
        weekIndex,
        row,
      })
    }

    if (firstDate) {
      const month = Number(firstDate.slice(5, 7)) - 1
      if (month !== lastMonth) {
        months.push({
          label: MONTH_LABELS[month] ?? firstDate.slice(5, 7),
          weekIndex,
        })
        lastMonth = month
      }
    }
  })

  return {
    weeksShown: weekCount,
    cells,
    months,
    truncated: weekCount < FULL_WEEKS,
  }
}

/** Drop month labels that would sit closer than minGapPx. */
export function spaceMonthLabels(
  months: HeatmapMonthLabel[],
  cell: number,
  gap: number,
  minGapPx = 28,
): HeatmapMonthLabel[] {
  if (months.length === 0) return []
  const step = cell + gap
  const kept: HeatmapMonthLabel[] = []
  let lastX = -Infinity
  for (const month of months) {
    const x = month.weekIndex * step
    if (x - lastX >= minGapPx) {
      kept.push(month)
      lastX = x
    }
  }
  return kept
}

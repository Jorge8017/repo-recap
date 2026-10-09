import { describe, expect, it } from 'vitest'
import {
  HALF_WEEKS,
  FULL_WEEKS,
  chooseHeatmapWeekCount,
  contributionLevel,
  fitHeatmapCells,
  quartileThresholds,
} from '../lib/heatmap'

describe('quartileThresholds', () => {
  it('returns zeros when every day is empty', () => {
    expect(quartileThresholds([0, 0, 0, 0])).toEqual([0, 0, 0])
  })

  it('keeps a usable range for uniform non-zero activity', () => {
    const thresholds = quartileThresholds([3, 3, 3, 3, 3, 3, 3, 3])
    expect(thresholds).toEqual([3, 3, 3])
    expect(contributionLevel(0, thresholds)).toBe(0)
    expect(contributionLevel(3, thresholds)).toBe(1)
  })

  it('spreads skewed profiles across levels 1–4', () => {
    const counts = [1, 1, 1, 2, 2, 5, 8, 20, 40, 80]
    const thresholds = quartileThresholds(counts)
    expect(thresholds[0]).toBeLessThanOrEqual(thresholds[1])
    expect(thresholds[1]).toBeLessThanOrEqual(thresholds[2])

    const levels = new Set(
      counts.map((count) => contributionLevel(count, thresholds)),
    )
    expect(levels.has(1)).toBe(true)
    expect(levels.has(4)).toBe(true)
    expect(contributionLevel(0, thresholds)).toBe(0)
  })
})

describe('fitHeatmapCells', () => {
  it('caps cell size at 14px and keeps a proportional gap', () => {
    const layout = fitHeatmapCells(1200, FULL_WEEKS)
    expect(layout.cell).toBe(14)
    expect(layout.gap).toBe(Math.max(2, Math.round(14 * 0.25)))
    expect(layout.fits).toBe(true)
  })

  it('falls back to 26 weeks when 53 weeks cannot stay at 4px', () => {
    expect(chooseHeatmapWeekCount(200)).toBe(HALF_WEEKS)
    expect(chooseHeatmapWeekCount(360)).toBe(FULL_WEEKS)
  })
})

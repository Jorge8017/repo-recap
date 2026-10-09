import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FULL_WEEKS,
  HEATMAP_LEVEL_COLORS,
  HEATMAP_ROWS,
  buildHeatmapModel,
  chooseHeatmapWeekCount,
  fitHeatmapCells,
  spaceMonthLabels,
} from '../lib/heatmap'
import type { ContributionWeek } from '../types'

interface ContributionHeatmapProps {
  weeks: ContributionWeek[]
  reducedMotion: boolean
}

export const ContributionHeatmap = memo(function ContributionHeatmap({
  weeks,
  reducedMotion,
}: ContributionHeatmapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const node = hostRef.current
    if (!node) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = node.clientWidth
        setWidth((prev) => (prev === next ? prev : next))
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  const weekCount = width > 0 ? chooseHeatmapWeekCount(width) : FULL_WEEKS
  const layout = width > 0
    ? fitHeatmapCells(width, weekCount)
    : { cell: 0, gap: 2, fits: false }

  const model = useMemo(
    () => buildHeatmapModel(weeks, weekCount),
    [weeks, weekCount],
  )

  const cell = layout.cell
  const gap = layout.gap
  const radius = cell * 0.25
  const gridWidth = weekCount * cell + Math.max(0, weekCount - 1) * gap
  const gridHeight = HEATMAP_ROWS * cell + (HEATMAP_ROWS - 1) * gap
  const monthLabels = spaceMonthLabels(model.months, cell, gap)
  const showMonths = width >= 360 && monthLabels.length > 0

  return (
    <div
      ref={hostRef}
      className="mt-8 w-full min-w-0"
      data-testid="contribution-heatmap"
      aria-hidden="true"
    >
      {model.truncated ? (
        <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-[#C9BFD6] uppercase">
          Last 6 months
        </p>
      ) : null}

      {cell > 0 ? (
        <svg
          width={gridWidth}
          height={gridHeight}
          viewBox={`0 0 ${gridWidth} ${gridHeight}`}
          className={
            reducedMotion
              ? 'block max-w-full'
              : 'heatmap-reveal block max-w-full'
          }
          role="presentation"
        >
          {model.cells.map((entry) => (
            <rect
              key={entry.date}
              x={entry.weekIndex * (cell + gap)}
              y={entry.row * (cell + gap)}
              width={cell}
              height={cell}
              rx={radius}
              ry={radius}
              fill={HEATMAP_LEVEL_COLORS[entry.level]}
            />
          ))}
        </svg>
      ) : (
        <div className="h-16" />
      )}

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="relative min-h-[14px] min-w-0 flex-1 overflow-hidden">
          {showMonths
            ? monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.weekIndex}`}
                  className="absolute top-0 font-mono text-[11px] text-[#C9BFD6]"
                  style={{ left: month.weekIndex * (cell + gap) }}
                >
                  {month.label}
                </span>
              ))
            : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-[#C9BFD6]">
          <span>Less</span>
          {HEATMAP_LEVEL_COLORS.map((color) => (
            <span
              key={color}
              className="inline-block rounded-[2px]"
              style={{
                width: Math.max(8, cell),
                height: Math.max(8, cell),
                background: color,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
})

import { motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import type { ContributionWeek } from '../types'

const LEVEL_COLORS = ['#241510', '#6B2E18', '#C45A2A', '#E89A4A', '#F2C46D'] as const
const COLS = 53
const ROWS = 7
const GAP = 2

function intensityLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

function buildGrid(weeks: ContributionWeek[]): Array<{
  key: string
  level: number
  weekIndex: number
  row: number
}> {
  const padded = weeks.slice(-COLS)
  while (padded.length < COLS) {
    padded.unshift({ contributionDays: [] })
  }

  let max = 0
  for (const week of padded) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > max) max = day.contributionCount
    }
  }

  const cells: Array<{
    key: string
    level: number
    weekIndex: number
    row: number
  }> = []

  padded.forEach((week, weekIndex) => {
    const byWeekday = new Map(
      week.contributionDays.map((day) => [day.weekday, day]),
    )
    for (let row = 0; row < ROWS; row += 1) {
      const day = byWeekday.get(row)
      const count = day?.contributionCount ?? 0
      cells.push({
        key: day?.date ?? `empty-${weekIndex}-${row}`,
        level: intensityLevel(count, max),
        weekIndex,
        row,
      })
    }
  })

  return cells
}

export function ContributionHeatmap({
  weeks,
  reducedMotion,
}: {
  weeks: ContributionWeek[]
  reducedMotion: boolean
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(4)
  const cells = buildGrid(weeks)

  useLayoutEffect(() => {
    const node = hostRef.current
    if (!node) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = node.clientWidth
        if (width < 1) return
        const next = Math.max(2, Math.floor((width - GAP * (COLS - 1)) / COLS))
        setCell((prev) => (prev === next ? prev : next))
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

  const height = ROWS * cell + GAP * (ROWS - 1)

  return (
    <div ref={hostRef} className="mt-6 w-full min-w-0" aria-hidden="true">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${cell}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${cell}px)`,
          gap: GAP,
          width: COLS * cell + GAP * (COLS - 1),
          height,
        }}
      >
        {cells.map((entry) => (
          <motion.span
            key={entry.key}
            className="rounded-[2px]"
            style={{
              width: cell,
              height: cell,
              background: LEVEL_COLORS[entry.level],
              gridColumn: entry.weekIndex + 1,
              gridRow: entry.row + 1,
            }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    delay: entry.weekIndex * 0.018,
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          />
        ))}
      </div>
    </div>
  )
}

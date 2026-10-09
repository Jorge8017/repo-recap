import { memo, useEffect, useState } from 'react'
import { formatCount } from '../lib/stats'
import type { MonthBar } from '../lib/monthlyBars'

interface MonthlyBarsProps {
  months: MonthBar[]
  totalContributions: number
  bestMonthLabel: string | null
  reducedMotion: boolean
  /** Test-only hook to assert memoisation. */
  onRender?: () => void
}

export const MonthlyBars = memo(function MonthlyBars({
  months,
  totalContributions,
  bestMonthLabel,
  reducedMotion,
  onRender,
}: MonthlyBarsProps) {
  onRender?.()
  const [active, setActive] = useState(reducedMotion)
  const max = Math.max(...months.map((month) => month.total), 0)

  useEffect(() => {
    if (reducedMotion) {
      setActive(true)
      return
    }
    const frame = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion])

  const aria = bestMonthLabel
    ? `${formatCount(totalContributions)} contributions in the last 12 months. Best month ${bestMonthLabel}.`
    : `${formatCount(totalContributions)} contributions in the last 12 months.`

  return (
    <div
      className={`monthly-bars ${active ? 'monthly-bars--active' : ''}`}
      data-testid="monthly-bars"
      role="img"
      aria-label={aria}
    >
      <div
        className="monthly-bars-chart"
        style={{
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: 'var(--monthly-bars-gap, 6px)',
        }}
        aria-hidden="true"
      >
        {months.map((month, index) => {
          const ratio = max > 0 ? month.total / max : 0
          const heightPct =
            month.total > 0 ? Math.max((3 / 120) * 100, ratio * 100) : 0
          const color = month.isBest
            ? '#F2C46D'
            : month.total === 0
              ? 'rgba(244, 237, 226, 0.18)'
              : 'rgba(242, 196, 109, 0.45)'

          return (
            <div
              key={month.key}
              className="relative flex h-full min-w-0 flex-col justify-end"
            >
              {month.isBest && month.total > 0 ? (
                <span className="monthly-bar-count absolute inset-x-0 bottom-full mb-1 text-center font-mono text-[12px] text-[#F2C46D]">
                  {formatCount(month.total)}
                </span>
              ) : null}
              <div
                className="monthly-bar w-full"
                style={{
                  height: month.total === 0 ? 3 : `${heightPct}%`,
                  minHeight: 3,
                  borderRadius: '4px 4px 2px 2px',
                  background: color,
                  ['--bar-index' as string]: index,
                }}
              />
            </div>
          )
        })}
      </div>
      <div
        className="monthly-bars-labels"
        style={{
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: 'var(--monthly-bars-gap, 6px)',
        }}
        aria-hidden="true"
      >
        {months.map((month) => (
          <span
            key={`${month.key}-label`}
            data-testid="month-initial"
            className="text-center font-mono text-[11px]"
            style={{
              color: month.isBest ? '#F2C46D' : 'rgba(244, 237, 226, 0.6)',
            }}
          >
            {month.initial}
          </span>
        ))}
      </div>
    </div>
  )
})

import { useMemo } from 'react'
import { buildMonthlyBars } from '../../lib/monthlyBars'
import { formatCount } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { MonthlyBars } from '../MonthlyBars'
import { HeroStatSlide } from './HeroStatSlide'
import { SlideShell } from './SlideShell'

export function YearSlide({ stats, reducedMotion }: SlideProps) {
  const total =
    stats.totalContributions > 0
      ? stats.totalContributions
      : stats.privateContributions
  const unit = total === 1 ? 'contribution' : 'contributions'
  const details = stats.bestMonth
    ? [
        {
          label: 'Best month',
          value: `${stats.bestMonth.label} · ${formatCount(stats.bestMonth.count)}`,
        },
      ]
    : stats.privateContributions > 0 && stats.totalContributions > 0
      ? [
          {
            label: 'Private',
            value: formatCount(stats.privateContributions),
          },
        ]
      : undefined

  const summaryParts = [
    `${formatCount(total)} ${unit} in the last 12 months`,
  ]
  if (stats.bestMonth) {
    summaryParts.push(
      `best month ${stats.bestMonth.label} with ${formatCount(stats.bestMonth.count)}`,
    )
  }
  if (stats.privateContributions > 0) {
    summaryParts.push(
      `${formatCount(stats.privateContributions)} private contributions`,
    )
  }

  const months = useMemo(
    () => buildMonthlyBars(stats.contributionWeeks),
    [stats.contributionWeeks],
  )

  return (
    <SlideShell
      announcement={summaryParts.join('. ')}
      gradient="bg-gradient-to-br from-[#2a1208] via-[#6b2e18] to-[#c45a2a]"
      pinBottom={false}
    >
      <HeroStatSlide
        lead="Your last 12 months"
        value={formatCount(total)}
        countTo={total}
        reducedMotion={reducedMotion}
        visitKey="year"
        unit={unit}
        details={details}
      >
        <MonthlyBars
          months={months}
          totalContributions={total}
          bestMonthLabel={stats.bestMonth?.label ?? null}
          reducedMotion={reducedMotion}
        />
      </HeroStatSlide>
      <p className="sr-only">{summaryParts.join('. ')}.</p>
    </SlideShell>
  )
}

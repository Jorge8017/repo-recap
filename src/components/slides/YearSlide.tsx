import { formatCount } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { ContributionHeatmap } from '../ContributionHeatmap'
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

  return (
    <SlideShell
      announcement={summaryParts.join('. ')}
      gradient="bg-gradient-to-br from-[#2a1208] via-[#6b2e18] to-[#c45a2a]"
      pinBottom={false}
    >
      <HeroStatSlide
        lead="Your last 12 months"
        value={formatCount(total)}
        unit={unit}
        details={details}
      />
      <ContributionHeatmap
        weeks={stats.contributionWeeks}
        reducedMotion={reducedMotion}
      />
      <p className="sr-only">{summaryParts.join('. ')}.</p>
    </SlideShell>
  )
}

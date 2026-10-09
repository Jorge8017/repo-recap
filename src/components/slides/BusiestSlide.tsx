import { formatHourLabel } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { HeroStatSlide } from './HeroStatSlide'
import { SlideShell } from './SlideShell'

export function BusiestSlide({ stats }: SlideProps) {
  const day = stats.busiestDay
  const hour =
    stats.busiestHour === null ? null : formatHourLabel(stats.busiestHour)
  if (!day && hour === null) return null

  const announcementParts = ['Last 90 days']
  if (day) announcementParts.push(`busiest day ${day}`)
  if (hour) announcementParts.push(`busiest hour ${hour} in your local time`)

  const details =
    day && hour ? [{ label: 'Peak hour', value: hour }] : undefined

  return (
    <SlideShell
      announcement={announcementParts.join(': ')}
      gradient="bg-gradient-to-br from-[#0a1628] via-[#12325c] to-[#3d6ec9]"
      pinBottom={false}
    >
      {day ? (
        <HeroStatSlide lead="You light up on" value={`${day}s`} details={details} />
      ) : (
        <HeroStatSlide lead="Peak hour" value={hour ?? ''} />
      )}
    </SlideShell>
  )
}

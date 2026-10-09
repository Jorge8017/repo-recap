import { formatHourLabel } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { Headline, SlideShell } from './SlideShell'

export function BusiestSlide({ stats }: SlideProps) {
  const day = stats.busiestDay
  const hour =
    stats.busiestHour === null ? null : formatHourLabel(stats.busiestHour)
  if (!day && hour === null) return null

  const announcementParts = ['Last 90 days']
  if (day) announcementParts.push(`busiest day ${day}`)
  if (hour) announcementParts.push(`busiest hour ${hour} in your local time`)

  return (
    <SlideShell
      announcement={announcementParts.join(': ')}
      gradient="bg-gradient-to-br from-[#0a1628] via-[#12325c] to-[#3d6ec9]"
      footer={hour && day ? <span>Peak hour {hour}</span> : undefined}
    >
      {day ? (
        <>
          <p className="mb-2 text-xl text-white/80">You light up on</p>
          <Headline>{day}s</Headline>
        </>
      ) : (
        <>
          <p className="mb-2 text-xl text-white/80">Peak hour</p>
          <Headline>{hour}</Headline>
        </>
      )}
    </SlideShell>
  )
}

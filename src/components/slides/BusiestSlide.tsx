import { formatHourLabel } from '../../lib/stats'
import type { SlideProps } from '../../types'
import { Headline, Kicker, SlideShell } from './SlideShell'

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
    >
      <Kicker>Last 90 days · your local time</Kicker>
      {day ? (
        <>
          <p className="mb-2 text-xl text-white/80">You light up on</p>
          <Headline>{day}s</Headline>
        </>
      ) : hour ? (
        <>
          <p className="mb-2 text-xl text-white/80">Peak hour</p>
          <Headline>{hour}</Headline>
        </>
      ) : null}
      {day && hour ? (
        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
            Peak hour
          </p>
          <p className="mt-1 text-4xl font-bold text-[#d6e6ff]">{hour}</p>
        </div>
      ) : null}
    </SlideShell>
  )
}

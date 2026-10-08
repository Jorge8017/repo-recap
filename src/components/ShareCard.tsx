import { formatCount } from '../lib/stats'
import { SITE_NAME } from '../lib/site'
import type { Personality, RecapStats } from '../types'

export const SHARE_CARD_WIDTH = 540
export const SHARE_CARD_HEIGHT = 675

interface ShareCardProps {
  stats: RecapStats
  personality: Personality
  avatarSrc: string
  siteHost: string
}

export function ShareCard({
  stats,
  personality,
  avatarSrc,
  siteHost,
}: ShareCardProps) {
  const languages = stats.topLanguages.slice(0, 3)
  const showStars = stats.totalStars > 0
  const showStreak = stats.longestStreak > 0
  const showDay = Boolean(stats.busiestDay)

  return (
    <div
      className="flex h-full w-full flex-col justify-between overflow-hidden text-[#f6efe4]"
      style={{
        fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        background:
          'linear-gradient(160deg, #1a1033 0%, #3a1548 48%, #7a2d4a 100%)',
      }}
    >
      <div className="flex flex-1 flex-col px-8 pt-9 pb-4">
        <p
          className="text-[11px] font-semibold tracking-[0.22em] text-[#f0c27a] uppercase"
        >
          {SITE_NAME}
        </p>
        <div className="mt-6 flex items-center gap-4">
          <img
            src={avatarSrc}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-[22px] object-cover ring-4 ring-white/20"
          />
          <div>
            <p className="text-xl leading-tight font-bold">{stats.displayName}</p>
            <p className="mt-1 text-sm text-white/75">@{stats.username}</p>
          </div>
        </div>

        <p className="mt-8 text-4xl leading-none">{personality.emoji}</p>
        <h2 className="mt-3 text-[2.35rem] leading-[1.05] font-bold tracking-tight">
          {personality.title}
        </h2>
        <p className="mt-2 max-w-[18ch] text-sm leading-snug text-white/75">
          {personality.description}
        </p>

        {languages.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {languages.map((language) => (
              <span
                key={language.name}
                className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold"
              >
                {language.name}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="mt-auto grid grid-cols-3 gap-3 pt-8">
          {showStars ? (
            <ShareStat label="Stars" value={formatCount(stats.totalStars)} />
          ) : null}
          {showStreak ? (
            <ShareStat
              label="Streak"
              value={`${stats.longestStreak}d`}
            />
          ) : null}
          {showDay ? (
            <ShareStat label="Peak day" value={stats.busiestDay ?? ''} />
          ) : null}
        </dl>
      </div>
      <div className="border-t border-white/10 px-8 py-4">
        <p className="text-[11px] tracking-wide text-white/65">
          made with {SITE_NAME}
        </p>
        <p className="text-[11px] font-medium text-[#f0c27a]">{siteHost}</p>
      </div>
    </div>
  )
}

function ShareStat({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-[0.16em] text-white/55 uppercase">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-bold">{value}</dd>
    </div>
  )
}

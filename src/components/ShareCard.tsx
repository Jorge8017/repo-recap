import { formatCount } from '../lib/stats'
import { SITE_NAME } from '../lib/site'
import type { Personality, RecapStats } from '../types'

export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1350

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
      className="flex h-full w-full flex-col text-[#f6efe4]"
      style={{
        fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        background:
          'linear-gradient(160deg, #1a1033 0%, #3a1548 48%, #7a2d4a 100%)',
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ padding: '72px 72px 40px' }}
      >
        <p
          className="font-semibold tracking-[0.22em] text-[#f0c27a] uppercase"
          style={{ fontSize: 22 }}
        >
          {SITE_NAME}
        </p>
        <div className="flex items-center" style={{ marginTop: 40, gap: 28 }}>
          <img
            src={avatarSrc}
            alt=""
            width={144}
            height={144}
            style={{
              width: 144,
              height: 144,
              borderRadius: 36,
              objectFit: 'cover',
              boxShadow: '0 0 0 6px rgba(255,255,255,0.2)',
            }}
          />
          <div>
            <p className="font-bold" style={{ fontSize: 42, lineHeight: 1.1 }}>
              {stats.displayName}
            </p>
            <p style={{ marginTop: 8, fontSize: 28, color: 'rgba(255,255,255,0.8)' }}>
              @{stats.username}
            </p>
          </div>
        </div>

        <p style={{ marginTop: 48, fontSize: 88, lineHeight: 1 }}>{personality.emoji}</p>
        <h2
          className="font-bold tracking-tight"
          style={{ marginTop: 16, fontSize: 64, lineHeight: 1.05 }}
        >
          {personality.title}
        </h2>
        <p
          style={{
            marginTop: 16,
            fontSize: 28,
            lineHeight: 1.35,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: '18em',
          }}
        >
          {personality.description}
        </p>

        {languages.length > 0 ? (
          <div className="flex flex-wrap" style={{ marginTop: 36, gap: 12 }}>
            {languages.map((language) => (
              <span
                key={language.name}
                className="font-semibold"
                style={{
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)',
                  padding: '10px 22px',
                  fontSize: 24,
                }}
              >
                {language.name}
              </span>
            ))}
          </div>
        ) : null}

        <dl
          className="mt-auto grid grid-cols-3"
          style={{ gap: 24, paddingTop: 48 }}
        >
          {showStars ? (
            <ShareStat label="Stars" value={formatCount(stats.totalStars)} />
          ) : null}
          {showStreak ? (
            <ShareStat label="Streak" value={`${stats.longestStreak}d`} />
          ) : null}
          {showDay ? (
            <ShareStat label="Peak day" value={stats.busiestDay ?? ''} />
          ) : null}
        </dl>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding: '28px 72px 40px',
        }}
      >
        <p style={{ fontSize: 22, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)' }}>
          made with {SITE_NAME}
        </p>
        <p className="font-medium text-[#f0c27a]" style={{ fontSize: 22, marginTop: 6 }}>
          {siteHost}
        </p>
      </div>
    </div>
  )
}

function ShareStat({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <dt
        className="font-semibold tracking-[0.16em] uppercase"
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }}
      >
        {label}
      </dt>
      <dd className="font-bold" style={{ marginTop: 8, fontSize: 32 }}>
        {value}
      </dd>
    </div>
  )
}

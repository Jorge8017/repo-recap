import { LANGUAGE_BAR_COLORS } from '../lib/slideMeta'
import { formatCount } from '../lib/stats'
import type { Personality, RecapStats } from '../types'

export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1350

interface ShareCardProps {
  stats: RecapStats
  personality: Personality
  avatarSrc: string
  siteOrigin: string
}

export function ShareCard({
  stats,
  personality,
  avatarSrc,
  siteOrigin,
}: ShareCardProps) {
  const languages = stats.topLanguages.slice(0, 3)
  const used = languages.reduce((sum, language) => sum + language.percentage, 0)
  const rest = Math.max(0, 100 - used)
  const showStars = stats.totalStars > 0
  const showStreak = stats.longestStreak > 0
  const showDay = Boolean(stats.busiestDay)
  const host = siteOrigin.replace(/^https?:\/\//, '')
  const initial = (stats.displayName.trim()[0] ?? stats.username[0] ?? '?').toUpperCase()

  return (
    <div
      className="flex h-full w-full flex-col justify-between text-[#F4EDE2]"
      style={{
        fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        padding: 81,
        boxSizing: 'border-box',
        background:
          'radial-gradient(810px 675px at 85% 10%, rgba(199,92,255,0.45), transparent 70%), radial-gradient(675px 585px at 0% 100%, rgba(217,94,60,0.35), transparent 70%), linear-gradient(170deg, #3A1250, #1B0A2B)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 27 }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              width={108}
              height={108}
              style={{
                width: 108,
                height: 108,
                borderRadius: 32,
                objectFit: 'cover',
                background: '#5B3A6E',
              }}
            />
          ) : (
            <div
              style={{
                width: 108,
                height: 108,
                borderRadius: 32,
                background: '#5B3A6E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 45,
              }}
            >
              {initial}
            </div>
          )}
          <div>
            <p className="font-bold" style={{ fontSize: 40, lineHeight: 1.1 }}>
              {stats.displayName}
            </p>
            <p style={{ marginTop: 6, fontSize: 32, color: '#CDB9DC' }}>
              @{stats.username}
            </p>
          </div>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 25,
            letterSpacing: '0.16em',
            color: '#F2C46D',
          }}
        >
          REPO RECAP
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 22 }}>
        <p style={{ fontSize: 144, lineHeight: 1 }} aria-hidden="true">
          {personality.emoji}
        </p>
        <h2
          className="font-bold"
          style={{
            fontSize: personality.title.length > 10 ? 110 : 144,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          {personality.title}
        </h2>
        <p
          style={{
            fontSize: 38,
            lineHeight: 1.45,
            color: '#D7C7E6',
            maxWidth: '16em',
          }}
        >
          {personality.description}
        </p>
        {languages.length > 0 ? (
          <>
            <div
              className="flex overflow-hidden"
              style={{ height: 22, borderRadius: 11, marginTop: 18 }}
            >
              {languages.map((language, index) => (
                <div
                  key={language.name}
                  style={{
                    width: `${language.percentage}%`,
                    background:
                      LANGUAGE_BAR_COLORS[index % LANGUAGE_BAR_COLORS.length],
                  }}
                />
              ))}
              {rest > 0 ? (
                <div style={{ width: `${rest}%`, background: 'rgba(255,255,255,0.18)' }} />
              ) : null}
            </div>
            <div className="flex" style={{ gap: 36, fontSize: 29, color: '#D7C7E6' }}>
              {languages.map((language) => (
                <span key={language.name}>
                  {language.name} {language.percentage}%
                </span>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-col" style={{ gap: 40 }}>
        <dl
          className="grid grid-cols-3"
          style={{
            gap: 27,
            paddingTop: 40,
            borderTop: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          {showStars ? (
            <ShareStat label="Stars" value={formatCount(stats.totalStars)} />
          ) : null}
          {showStreak ? (
            <ShareStat
              label="Streak"
              value={`${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`}
            />
          ) : null}
          {showDay ? (
            <ShareStat label="Peak day" value={stats.busiestDay ?? ''} />
          ) : null}
        </dl>
        <p style={{ fontSize: 29, color: '#B9A6CB' }}>{host}</p>
      </div>
    </div>
  )
}

function ShareStat({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col" style={{ gap: 9 }}>
      <dt
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 22,
          letterSpacing: '0.14em',
          color: '#B9A6CB',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </dt>
      <dd className="font-bold" style={{ fontSize: 63, letterSpacing: '-0.02em' }}>
        {value}
      </dd>
    </div>
  )
}

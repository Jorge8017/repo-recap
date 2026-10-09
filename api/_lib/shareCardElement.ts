import { createElement as h, type ReactElement } from 'react'
import { LANGUAGE_BAR_COLORS } from '../../src/lib/slideMeta.js'
import { assignPersonality } from '../../src/lib/personality.js'
import {
  formatAccountAge,
  formatCount,
  buildRecapStats,
} from '../../src/lib/stats.js'
import type { CachedRecapPayload, Personality, RecapStats } from '../../src/types.js'
import { personalityIconDataUri } from './personalityIconSvg.js'
import { truncateEllipsis } from './xml.js'

export const SHARE_IMAGE_WIDTH = 1080
export const SHARE_IMAGE_HEIGHT = 1350
export const SHARE_IMAGE_FOOTER = 'recap.jordanshears.com'

export type ShareStatItem = { label: string; value: string }

export function titleFontSize(title: string): number {
  if (title.length <= 8) return 144
  if (title.length <= 12) return 110
  if (title.length <= 16) return 90
  return 72
}

export function shareStatsForCard(
  stats: RecapStats,
  personality: Personality,
): ShareStatItem[] {
  const ghostCard = personality.id === 'ghost-mode' || stats.isEmptyProfile
  if (ghostCard) {
    return [
      {
        label: 'On GitHub',
        value: formatAccountAge(stats.accountAgeYears),
      },
      { label: 'Joined', value: String(stats.joinYear) },
      {
        label: stats.privateContributions > 0 ? 'Private' : 'Public repos',
        value:
          stats.privateContributions > 0
            ? `${formatCount(stats.privateContributions)} this year`
            : 'Private',
      },
    ]
  }

  const items: ShareStatItem[] = []
  if (stats.totalStars > 0) {
    items.push({ label: 'Stars', value: formatCount(stats.totalStars) })
  }
  if (stats.longestStreak > 0) {
    items.push({
      label: 'Streak',
      value: `${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`,
    })
  }
  if (stats.busiestDay) {
    items.push({ label: 'Peak day', value: stats.busiestDay })
  }
  return items
}

export function buildShareCardModel(
  payload: CachedRecapPayload,
  avatarDataUri: string | null,
  now = new Date(),
): {
  stats: RecapStats
  personality: Personality
  displayName: string
  username: string
  avatarDataUri: string | null
  initial: string
  iconDataUri: string
  statItems: ShareStatItem[]
  languages: Array<{ name: string; percentage: number }>
  restPercent: number
  ghostMode: boolean
} {
  const stats = buildRecapStats(
    payload.user,
    payload.repos,
    payload.events,
    now,
    payload.contributions ?? null,
  )
  const personality = assignPersonality(stats)
  const ghostMode = personality.id === 'ghost-mode' || stats.isEmptyProfile
  const languages = stats.topLanguages.slice(0, 3)
  const used = languages.reduce((sum, language) => sum + language.percentage, 0)

  return {
    stats,
    personality,
    displayName: truncateEllipsis(stats.displayName, 22),
    username: truncateEllipsis(stats.username, 22),
    avatarDataUri,
    initial: (
      stats.displayName.trim()[0] ??
      stats.username[0] ??
      '?'
    ).toUpperCase(),
    iconDataUri: personalityIconDataUri(personality.id),
    statItems: shareStatsForCard(stats, personality),
    languages,
    restPercent: Math.max(0, 100 - used),
    ghostMode,
  }
}

function glow(style: Record<string, string | number>) {
  return h('div', { style: { display: 'flex', ...style } })
}

/** Satori-friendly React tree matching the in-app ShareCard layout. */
export function buildShareCardElement(
  payload: CachedRecapPayload,
  avatarDataUri: string | null,
  now = new Date(),
): ReactElement {
  const model = buildShareCardModel(payload, avatarDataUri, now)
  const titleSize = titleFontSize(model.personality.title)

  const languageBar =
    model.languages.length > 0
      ? h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              marginTop: 18,
              width: '100%',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                width: '100%',
                height: 22,
                borderRadius: 11,
                overflow: 'hidden',
              },
            },
            ...model.languages.map((language, index) =>
              h('div', {
                key: language.name,
                style: {
                  display: 'flex',
                  width: `${language.percentage}%`,
                  height: 22,
                  background:
                    LANGUAGE_BAR_COLORS[index % LANGUAGE_BAR_COLORS.length],
                },
              }),
            ),
            model.restPercent > 0
              ? h('div', {
                  style: {
                    display: 'flex',
                    width: `${model.restPercent}%`,
                    height: 22,
                    background: 'rgba(255,255,255,0.18)',
                  },
                })
              : null,
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                gap: 36,
                fontSize: 29,
                color: '#D7C7E6',
              },
            },
            ...model.languages.map((language) =>
              h(
                'span',
                { key: language.name, style: { display: 'flex' } },
                `${language.name} ${language.percentage}%`,
              ),
            ),
          ),
        )
      : null

  const avatar = model.avatarDataUri
    ? h('img', {
        src: model.avatarDataUri,
        width: 108,
        height: 108,
        style: {
          width: 108,
          height: 108,
          borderRadius: 32,
          objectFit: 'cover',
          background: '#5B3A6E',
        },
      })
    : h(
        'div',
        {
          style: {
            display: 'flex',
            width: 108,
            height: 108,
            borderRadius: 32,
            background: '#5B3A6E',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 45,
            color: '#F4EDE2',
          },
        },
        model.initial,
      )

  const statsRow =
    model.statItems.length > 0
      ? h(
          'div',
          {
            style: {
              display: 'flex',
              width: '100%',
              gap: 27,
              paddingTop: 40,
              borderTop: '1px solid rgba(255,255,255,0.14)',
            },
          },
          ...model.statItems.map((item) =>
            h(
              'div',
              {
                key: item.label,
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  flex: 1,
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    color: '#B9A6CB',
                    textTransform: 'uppercase',
                  },
                },
                item.label,
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontSize: 63,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#F4EDE2',
                  },
                },
                item.value,
              ),
            ),
          ),
        )
      : null

  return h(
    'div',
    {
      style: {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 81,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Space Grotesk',
        color: '#F4EDE2',
        background: 'linear-gradient(170deg, #3A1250, #1B0A2B)',
      },
    },
    glow({
      position: 'absolute',
      width: 810,
      height: 675,
      right: -120,
      top: -80,
      borderRadius: 9999,
      background: 'rgba(199,92,255,0.45)',
    }),
    glow({
      position: 'absolute',
      width: 675,
      height: 585,
      left: -200,
      bottom: -120,
      borderRadius: 9999,
      background: 'rgba(217,94,60,0.35)',
    }),
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 27,
            flex: 1,
            minWidth: 0,
          },
        },
        avatar,
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontWeight: 700,
                fontSize: 40,
                lineHeight: 1.1,
              },
            },
            model.displayName,
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                marginTop: 6,
                fontSize: 32,
                color: '#CDB9DC',
              },
            },
            `@${model.username}`,
          ),
        ),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexShrink: 0,
            fontFamily: 'JetBrains Mono',
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: '0.16em',
            color: '#F2C46D',
            whiteSpace: 'nowrap',
          },
        },
        'REPO RECAP',
      ),
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          width: '100%',
          position: 'relative',
        },
      },
      h('img', {
        src: model.iconDataUri,
        width: 144,
        height: 144,
        style: { width: 144, height: 144 },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontWeight: 700,
            fontSize: titleSize,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            maxWidth: '100%',
          },
        },
        model.personality.title,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 38,
            lineHeight: 1.45,
            color: '#D7C7E6',
            maxWidth: '16em',
          },
        },
        model.personality.description,
      ),
      languageBar,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
          width: '100%',
          position: 'relative',
        },
      },
      statsRow,
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 29,
            color: '#B9A6CB',
          },
        },
        SHARE_IMAGE_FOOTER,
      ),
    ),
  )
}

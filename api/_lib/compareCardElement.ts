import { createElement as h, type ReactElement } from 'react'
import { buildCompareScore } from '../../src/lib/compare.js'
import { buildRecapStats } from '../../src/lib/stats.js'
import type { CachedRecapPayload } from '../../src/types.js'
import { truncateEllipsis } from './xml.js'
import {
  SHARE_CARD_BACKGROUND_IMAGE,
  SHARE_IMAGE_FOOTER,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
} from './shareCardElement.js'

export function buildCompareCardElement(
  payloadA: CachedRecapPayload,
  payloadB: CachedRecapPayload,
  avatarA: string | null,
  avatarB: string | null,
  now = new Date(),
): ReactElement {
  const statsA = buildRecapStats(
    payloadA.user,
    payloadA.repos,
    payloadA.events,
    now,
    payloadA.contributions ?? null,
  )
  const statsB = buildRecapStats(
    payloadB.user,
    payloadB.repos,
    payloadB.events,
    now,
    payloadB.contributions ?? null,
  )
  const score = buildCompareScore(statsA, statsB)
  const nameA = truncateEllipsis(statsA.displayName, 18)
  const nameB = truncateEllipsis(statsB.displayName, 18)
  const rows = score.rounds.filter((round) =>
    ['contributions', 'streak', 'stars'].includes(round.id),
  )

  const avatar = (src: string | null, initial: string) =>
    src
      ? h('img', {
          src,
          width: 96,
          height: 96,
          style: {
            width: 96,
            height: 96,
            borderRadius: 28,
            objectFit: 'cover',
            background: '#5B3A6E',
          },
        })
      : h(
          'div',
          {
            style: {
              display: 'flex',
              width: 96,
              height: 96,
              borderRadius: 28,
              background: '#5B3A6E',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 700,
              color: '#F4EDE2',
            },
          },
          initial,
        )

  const person = (
    name: string,
    username: string,
    src: string | null,
  ) =>
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          flex: 1,
        },
      },
      avatar(src, (name[0] ?? '?').toUpperCase()),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 32,
            fontWeight: 700,
            color: '#F4EDE2',
          },
        },
        name,
      ),
      h(
        'div',
        { style: { display: 'flex', fontSize: 24, color: '#CDB9DC' } },
        `@${username}`,
      ),
    )

  return h(
    'div',
    {
      style: {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        fontFamily: 'Space Grotesk',
        color: '#F4EDE2',
        backgroundImage: SHARE_CARD_BACKGROUND_IMAGE,
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
        },
      },
      person(nameA, statsA.username, avatarA),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'JetBrains Mono',
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: '#F2C46D',
            paddingTop: 28,
          },
        },
        'VS',
      ),
      person(nameB, statsB.username, avatarB),
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          width: '100%',
        },
      },
      ...rows.map((round) =>
        h(
          'div',
          {
            key: round.id,
            style: {
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                flex: 1,
                fontSize: 40,
                fontWeight: 700,
                color: round.winner === 'a' ? '#F2C46D' : '#F4EDE2',
              },
            },
            round.aDisplay,
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontSize: 22,
                letterSpacing: '0.12em',
                color: '#B9A6CB',
                textTransform: 'uppercase',
              },
            },
            round.label,
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                flex: 1,
                justifyContent: 'flex-end',
                fontSize: 40,
                fontWeight: 700,
                color: round.winner === 'b' ? '#F2C46D' : '#F4EDE2',
              },
            },
            round.bDisplay,
          ),
        ),
      ),
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          width: '100%',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#F2C46D',
          },
        },
        score.headline,
      ),
      h(
        'div',
        { style: { display: 'flex', fontSize: 28, color: '#B9A6CB' } },
        SHARE_IMAGE_FOOTER,
      ),
    ),
  )
}

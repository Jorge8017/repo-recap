import { createElement as h, type ReactElement } from 'react'
import {
  buildCompareScore,
  COMPARE_COLOR_A,
  COMPARE_COLOR_B,
} from '../../src/lib/compare.js'
import { buildRecapStats } from '../../src/lib/stats.js'
import type { CachedRecapPayload } from '../../src/types.js'
import { truncateEllipsis } from './xml.js'
import {
  SHARE_IMAGE_FOOTER,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
} from './shareCardElement.js'

export const COMPARE_IMAGE_PADDING = 72
export const COMPARE_IMAGE_CONTENT_WIDTH =
  SHARE_IMAGE_WIDTH - COMPARE_IMAGE_PADDING * 2

/** Soft gold/teal glows on the compare gradient — Satori has no CSS blur. */
export const COMPARE_CARD_BACKGROUND_IMAGE = [
  'radial-gradient(540px 480px at 30% 55%, rgba(242,196,109,0.14) 0%, rgba(242,196,109,0) 70%)',
  'radial-gradient(540px 480px at 70% 55%, rgba(111,211,184,0.14) 0%, rgba(111,211,184,0) 70%)',
  'linear-gradient(165deg, #241133, #160B22)',
].join(', ')

const VALUE_COL_WIDTH = 300

function valueStyle(opts: {
  color: string
  opacity: number
  bold: boolean
  align: 'left' | 'right'
}) {
  return {
    display: 'flex',
    width: VALUE_COL_WIDTH,
    maxWidth: VALUE_COL_WIDTH,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontSize: 36,
    fontWeight: opts.bold ? 700 : 500,
    color: opts.color,
    opacity: opts.opacity,
    justifyContent: opts.align === 'right' ? 'flex-end' : 'flex-start',
  }
}

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
  const nameA = truncateEllipsis(statsA.displayName, 16)
  const nameB = truncateEllipsis(statsB.displayName, 16)
  const rows = score.rounds

  const avatar = (
    src: string | null,
    initial: string,
    ring: string,
  ) =>
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: 124,
          height: 124,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          background: ring,
          padding: 2,
        },
      },
      src
        ? h('img', {
            src,
            width: 120,
            height: 120,
            style: {
              width: 120,
              height: 120,
              borderRadius: 999,
              objectFit: 'cover',
              background: '#5B3A6E',
            },
          })
        : h(
            'div',
            {
              style: {
                display: 'flex',
                width: 120,
                height: 120,
                borderRadius: 999,
                background: '#5B3A6E',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                fontWeight: 700,
                color: '#F4EDE2',
              },
            },
            initial,
          ),
    )

  const person = (
    name: string,
    username: string,
    src: string | null,
    color: string,
    align: 'flex-start' | 'flex-end',
  ) =>
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: align,
          gap: 10,
          flex: 1,
          minWidth: 0,
          maxWidth: 360,
        },
      },
      avatar(src, (name[0] ?? '?').toUpperCase(), color),
      h(
        'div',
        {
          style: {
            display: 'flex',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 30,
            fontWeight: 700,
            color: '#F4EDE2',
          },
        },
        name,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 24,
            color,
          },
        },
        `@${truncateEllipsis(username, 18)}`,
      ),
    )

  const aDim = score.enoughData && score.winner === 'b' ? 0.55 : 1
  const bDim = score.enoughData && score.winner === 'a' ? 0.55 : 1

  return h(
    'div',
    {
      style: {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: COMPARE_IMAGE_PADDING,
        fontFamily: 'Space Grotesk',
        color: '#F4EDE2',
        backgroundImage: COMPARE_CARD_BACKGROUND_IMAGE,
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        },
      },
      person(nameA, statsA.username, avatarA, COMPARE_COLOR_A, 'flex-start'),
      h(
        'div',
        {
          style: {
            display: 'flex',
            width: 72,
            height: 72,
            borderRadius: 999,
            border: '1px solid rgba(244,237,226,0.2)',
            background: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'JetBrains Mono',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: '#F4EDE2',
            flexShrink: 0,
          },
        },
        'VS',
      ),
      person(nameB, statsB.username, avatarB, COMPARE_COLOR_B, 'flex-end'),
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          width: '100%',
          flex: 1,
        },
      },
      score.enoughData
        ? h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 18,
                fontSize: 120,
                fontWeight: 700,
                letterSpacing: '-0.05em',
                lineHeight: 1,
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  color: COMPARE_COLOR_A,
                  opacity: aDim,
                },
              },
              String(score.aWins),
            ),
            h(
              'div',
              { style: { display: 'flex', color: '#8F84A0', fontSize: 80 } },
              '–',
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  color: COMPARE_COLOR_B,
                  opacity: bDim,
                },
              },
              String(score.bWins),
            ),
          )
        : h(
            'div',
            {
              style: {
                display: 'flex',
                maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
                textAlign: 'center',
                fontSize: 40,
                fontWeight: 700,
                color: '#C9BFD6',
                justifyContent: 'center',
              },
            },
            'Not enough public data',
          ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 28,
            color: '#F4EDE2',
            justifyContent: 'center',
          },
        },
        truncateEllipsis(score.headline, 48),
      ),
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          width: '100%',
        },
      },
      ...rows.map((round) => {
        const muted = !round.comparable
        const aWin = round.comparable && round.winner === 'a'
        const bWin = round.comparable && round.winner === 'b'
        const aText = truncateEllipsis(round.aDisplay, 14)
        const bText = truncateEllipsis(round.bDisplay, 14)
        return h(
          'div',
          {
            key: round.id,
            style: {
              display: 'flex',
              width: '100%',
              maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            },
          },
          h(
            'div',
            {
              style: valueStyle({
                color: muted ? '#8F84A0' : COMPARE_COLOR_A,
                opacity: muted ? 1 : aWin ? 1 : round.winner === 'b' ? 0.55 : 1,
                bold: aWin,
                align: 'left',
              }),
            },
            aText,
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                fontFamily: 'JetBrains Mono',
                fontSize: 20,
                letterSpacing: '0.12em',
                color: '#8F84A0',
                textTransform: 'uppercase',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
            muted ? 'Not comparable' : round.label,
          ),
          h(
            'div',
            {
              style: valueStyle({
                color: muted ? '#8F84A0' : COMPARE_COLOR_B,
                opacity: muted ? 1 : bWin ? 1 : round.winner === 'a' ? 0.55 : 1,
                bold: bWin,
                align: 'right',
              }),
            },
            bText,
          ),
        )
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            marginTop: 12,
            fontSize: 26,
            color: '#B9A6CB',
          },
        },
        SHARE_IMAGE_FOOTER,
      ),
    ),
  )
}

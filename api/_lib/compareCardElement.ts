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
export const COMPARE_IMAGE_MAX_RIGHT =
  COMPARE_IMAGE_PADDING + COMPARE_IMAGE_CONTENT_WIDTH

const VS_SIZE = 72
const COL_GAP = 24
const PERSON_WIDTH =
  (COMPARE_IMAGE_CONTENT_WIDTH - VS_SIZE - COL_GAP * 2) / 2
const VALUE_COL_WIDTH = 280
const LABEL_COL_WIDTH =
  COMPARE_IMAGE_CONTENT_WIDTH - VALUE_COL_WIDTH * 2
const SECTION_GAP = 56
const LOSER_OPACITY = 0.72

/** Soft gold/teal glows on the compare gradient — Satori has no CSS blur. */
export const COMPARE_CARD_BACKGROUND_IMAGE = [
  'radial-gradient(540px 480px at 30% 55%, rgba(242,196,109,0.14) 0%, rgba(242,196,109,0) 70%)',
  'radial-gradient(540px 480px at 70% 55%, rgba(111,211,184,0.14) 0%, rgba(111,211,184,0) 70%)',
  'linear-gradient(165deg, #241133, #160B22)',
].join(', ')

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
    fontSize: 32,
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
  const nameA = truncateEllipsis(statsA.displayName, 14)
  const nameB = truncateEllipsis(statsB.displayName, 14)
  const userA = truncateEllipsis(statsA.username, 16)
  const userB = truncateEllipsis(statsB.username, 16)
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
          width: 104,
          height: 104,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          background: ring,
          padding: 2,
          flexShrink: 0,
        },
      },
      src
        ? h('img', {
            src,
            width: 100,
            height: 100,
            style: {
              width: 100,
              height: 100,
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
                width: 100,
                height: 100,
                borderRadius: 999,
                background: '#5B3A6E',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
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
          gap: 8,
          width: PERSON_WIDTH,
          maxWidth: PERSON_WIDTH,
          overflow: 'hidden',
          flexShrink: 0,
        },
      },
      avatar(src, (name[0] ?? '?').toUpperCase(), color),
      h(
        'div',
        {
          style: {
            display: 'flex',
            width: '100%',
            maxWidth: PERSON_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 28,
            fontWeight: 700,
            color: '#F4EDE2',
            justifyContent: align === 'flex-end' ? 'flex-end' : 'flex-start',
          },
        },
        name,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            width: '100%',
            maxWidth: PERSON_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 22,
            color,
            justifyContent: align === 'flex-end' ? 'flex-end' : 'flex-start',
          },
        },
        `@${username}`,
      ),
    )

  const aDim = score.enoughData && score.winner === 'b' ? LOSER_OPACITY : 1
  const bDim = score.enoughData && score.winner === 'a' ? LOSER_OPACITY : 1

  const header = h(
    'div',
    {
      style: {
        display: 'flex',
        width: COMPARE_IMAGE_CONTENT_WIDTH,
        maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: COL_GAP,
        flexShrink: 0,
      },
    },
    person(nameA, userA, avatarA, COMPARE_COLOR_A, 'flex-start'),
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: VS_SIZE,
          height: VS_SIZE,
          borderRadius: 999,
          border: '1px solid rgba(244,237,226,0.2)',
          background: 'rgba(255,255,255,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono',
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: '0.14em',
          color: '#F4EDE2',
          flexShrink: 0,
        },
      },
      'VS',
    ),
    person(nameB, userB, avatarB, COMPARE_COLOR_B, 'flex-end'),
  )

  const scoreBlock = h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        width: COMPARE_IMAGE_CONTENT_WIDTH,
        maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
        flexShrink: 0,
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
              gap: 16,
              fontSize: 96,
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
            { style: { display: 'flex', color: '#8F84A0', fontSize: 64 } },
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
              fontSize: 36,
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
          fontSize: 26,
          color: '#F4EDE2',
          justifyContent: 'center',
        },
      },
      truncateEllipsis(score.headline, 42),
    ),
  )

  const table = h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: COMPARE_IMAGE_CONTENT_WIDTH,
        maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
        flexShrink: 0,
      },
    },
    ...rows.map((round) => {
      const muted = !round.comparable
      const aWin = round.comparable && round.winner === 'a'
      const bWin = round.comparable && round.winner === 'b'
      const aText = truncateEllipsis(round.aDisplay, 12)
      const bText = truncateEllipsis(round.bDisplay, 12)
      return h(
        'div',
        {
          key: round.id,
          style: {
            display: 'flex',
            width: COMPARE_IMAGE_CONTENT_WIDTH,
            maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          },
        },
        h(
          'div',
          {
            style: valueStyle({
              color: muted ? '#8F84A0' : COMPARE_COLOR_A,
              opacity: muted ? 1 : aWin ? 1 : round.winner === 'b' ? LOSER_OPACITY : 1,
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
              flexDirection: 'column',
              width: LABEL_COL_WIDTH,
              maxWidth: LABEL_COL_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontSize: 18,
                letterSpacing: '0.12em',
                color: '#8F84A0',
                textTransform: 'uppercase',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
            truncateEllipsis(round.label, 14),
          ),
          muted
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 14,
                    color: '#8F84A0',
                    marginTop: 2,
                  },
                },
                '· not comparable',
              )
            : null,
        ),
        h(
          'div',
          {
            style: valueStyle({
              color: muted ? '#8F84A0' : COMPARE_COLOR_B,
              opacity: muted ? 1 : bWin ? 1 : round.winner === 'a' ? LOSER_OPACITY : 1,
              bold: bWin,
              align: 'right',
            }),
          },
          bText,
        ),
      )
    }),
  )

  const footer = h(
    'div',
    {
      style: {
        display: 'flex',
        width: COMPARE_IMAGE_CONTENT_WIDTH,
        maxWidth: COMPARE_IMAGE_CONTENT_WIDTH,
        fontSize: 24,
        color: '#B9A6CB',
        flexShrink: 0,
      },
    },
    SHARE_IMAGE_FOOTER,
  )

  const spacer = (key: string) =>
    h('div', {
      key,
      style: {
        display: 'flex',
        width: '100%',
        height: SECTION_GAP,
        maxHeight: 120,
        flexShrink: 0,
      },
    })

  return h(
    'div',
    {
      style: {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: COMPARE_IMAGE_PADDING,
        fontFamily: 'Space Grotesk',
        color: '#F4EDE2',
        backgroundImage: COMPARE_CARD_BACKGROUND_IMAGE,
      },
    },
    header,
    spacer('gap-1'),
    scoreBlock,
    spacer('gap-2'),
    table,
    spacer('gap-3'),
    footer,
  )
}

import { assignPersonality } from '../../src/lib/personality.js'
import { LANGUAGE_BAR_COLORS } from '../../src/lib/slideMeta.js'
import { formatCount, buildRecapStats } from '../../src/lib/stats.js'
import type { CachedRecapPayload, PersonalityId } from '../../src/types.js'
import { c1LogoMarkup, personalityIconMarkup } from './personalityIconSvg.js'
import { escapeXml, truncateEllipsis } from './xml.js'

export type CardTheme = 'dark' | 'light'

export interface CardThemeColors {
  background: string
  backgroundAlt: string
  text: string
  muted: string
  gold: string
  barTrack: string
  border: string
}

export function themeColors(theme: CardTheme): CardThemeColors {
  if (theme === 'light') {
    return {
      background: '#FFFFFF',
      backgroundAlt: '#F7F2EA',
      text: '#1A0B22',
      // ~7.2:1 on white — WCAG AA for body text
      muted: '#4A3A58',
      gold: '#B7791F',
      barTrack: '#E8DFD2',
      border: '#E5DCCF',
    }
  }
  return {
    background: '#1B0A2B',
    backgroundAlt: '#2A1240',
    text: '#F4EDE2',
    muted: '#C9BFD6',
    gold: '#F2C46D',
    barTrack: 'rgba(244,237,226,0.12)',
    border: 'rgba(244,237,226,0.12)',
  }
}

export function parseCardTheme(raw: string | null | undefined): CardTheme {
  return raw === 'light' ? 'light' : 'dark'
}

const SANS =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif'
const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export function statusCardSvg(
  message: string,
  theme: CardTheme = 'dark',
): string {
  const colors = themeColors(theme)
  const label = escapeXml(message)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="495" height="200" viewBox="0 0 495 200" role="img" aria-label="${label}">
  <rect width="495" height="200" rx="12" fill="${colors.background}"/>
  <rect x="1" y="1" width="493" height="198" rx="11" fill="none" stroke="${colors.border}"/>
  <text x="247.5" y="105" text-anchor="middle" font-family='${SANS}' font-size="18" fill="${colors.text}">${label}</text>
  <g opacity="0.9">${c1LogoMarkup(20, 168, 16, colors.text)}</g>
  <text x="42" y="181" font-family='${MONO}' font-size="11" fill="${colors.muted}">recap.jordanshears.com</text>
</svg>`
}

export async function fetchAvatarDataUri(
  avatarUrl: string,
  token: string | undefined,
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'image/*',
      'User-Agent': 'repo-recap-card',
    }
    if (token) headers.Authorization = `Bearer ${token}`
    const response = await fetch(avatarUrl, { headers })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') ?? 'image/png'
    if (!contentType.startsWith('image/')) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength === 0 || buffer.byteLength > 1_500_000) return null
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

function avatarMarkup(
  dataUri: string | null,
  initial: string,
  colors: CardThemeColors,
): string {
  const clip = 'avatarClip'
  if (dataUri) {
    return `<defs><clipPath id="${clip}"><circle cx="44" cy="44" r="24"/></clipPath></defs>
      <circle cx="44" cy="44" r="24" fill="${colors.backgroundAlt}"/>
      <image href="${escapeXml(dataUri)}" xlink:href="${escapeXml(dataUri)}" x="20" y="20" width="48" height="48" clip-path="url(#${clip})" preserveAspectRatio="xMidYMid slice"/>`
  }
  return `<circle cx="44" cy="44" r="24" fill="${colors.backgroundAlt}"/>
    <text x="44" y="50" text-anchor="middle" font-family='${SANS}' font-size="18" font-weight="700" fill="${colors.gold}">${escapeXml(initial)}</text>`
}

function languageBar(
  languages: Array<{ name: string; percentage: number }>,
  colors: CardThemeColors,
): string {
  const top = languages.slice(0, 3)
  const barX = 20
  const barY = 128
  const barW = 455
  const barH = 8
  if (top.length === 0) {
    return `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="4" fill="${colors.barTrack}"/>
      <text x="${barX}" y="${barY + 28}" font-family='${MONO}' font-size="11" fill="${colors.muted}">No languages detected</text>`
  }

  let x = barX
  const segments = top
    .map((lang, index) => {
      const width = Math.max(4, Math.round((lang.percentage / 100) * barW))
      const color = LANGUAGE_BAR_COLORS[index % LANGUAGE_BAR_COLORS.length] ?? colors.gold
      const rect = `<rect x="${x}" y="${barY}" width="${width}" height="${barH}" rx="0" fill="${color}"/>`
      x += width
      return rect
    })
    .join('')

  const labels = top
    .map((lang, index) => {
      const color = LANGUAGE_BAR_COLORS[index % LANGUAGE_BAR_COLORS.length] ?? colors.gold
      const label = escapeXml(
        `${truncateEllipsis(lang.name, 12)} ${lang.percentage}%`,
      )
      const lx = barX + index * 150
      return `<circle cx="${lx + 4}" cy="${barY + 24}" r="3.5" fill="${color}"/>
        <text x="${lx + 12}" y="${barY + 28}" font-family='${MONO}' font-size="11" fill="${colors.muted}">${label}</text>`
    })
    .join('')

  return `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="4" fill="${colors.barTrack}"/>
    ${segments}
    ${labels}`
}

export function buildRecapCardSvg(options: {
  payload: CachedRecapPayload
  theme: CardTheme
  avatarDataUri: string | null
  now?: Date
}): string {
  const { payload, theme, avatarDataUri, now = new Date() } = options
  const colors = themeColors(theme)
  const stats = buildRecapStats(
    payload.user,
    payload.repos,
    payload.events,
    now,
    payload.contributions ?? null,
  )
  const personality = assignPersonality(stats)
  const name = truncateEllipsis(stats.displayName, 22)
  const login = truncateEllipsis(`@${stats.username}`, 24)
  const personalityTitle = truncateEllipsis(personality.title, 16)
  const contributions = formatCount(stats.totalContributions)
  const streak =
    stats.longestStreak > 0
      ? `${formatCount(stats.longestStreak)} day streak`
      : 'No streak yet'
  const initial = (
    stats.displayName.trim()[0] ??
    stats.username[0] ??
    '?'
  ).toUpperCase()

  const iconColor = colors.gold
  const iconX = 330
  const titleX = 358

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="495" height="200" viewBox="0 0 495 200" role="img" aria-label="${escapeXml(`${name} Repo Recap`)}">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.backgroundAlt}"/>
      <stop offset="1" stop-color="${colors.background}"/>
    </linearGradient>
  </defs>
  <rect width="495" height="200" rx="12" fill="url(#cardBg)"/>
  <rect x="1" y="1" width="493" height="198" rx="11" fill="none" stroke="${colors.border}"/>
  ${avatarMarkup(avatarDataUri, initial, colors)}
  <text x="80" y="38" font-family='${SANS}' font-size="18" font-weight="700" fill="${colors.text}">${escapeXml(name)}</text>
  <text x="80" y="58" font-family='${MONO}' font-size="12" fill="${colors.muted}">${escapeXml(login)}</text>
  ${personalityIconMarkup(personality.id as PersonalityId, iconColor, 22, iconX, 26)}
  <text x="${titleX}" y="42" font-family='${SANS}' font-size="14" font-weight="700" fill="${colors.gold}">${escapeXml(personalityTitle)}</text>
  <text x="20" y="98" font-family='${SANS}' font-size="16" font-weight="700" fill="${colors.text}">${escapeXml(contributions)} contributions</text>
  <text x="20" y="118" font-family='${MONO}' font-size="12" fill="${colors.muted}">Last 12 months · ${escapeXml(streak)}</text>
  ${languageBar(stats.topLanguages, colors)}
  ${c1LogoMarkup(20, 168, 16, colors.text)}
  <text x="42" y="181" font-family='${MONO}' font-size="11" fill="${colors.muted}">recap.jordanshears.com</text>
</svg>`
}

export function svgContainsSecret(svg: string, token: string | undefined): boolean {
  if (!token) return false
  return svg.includes(token)
}

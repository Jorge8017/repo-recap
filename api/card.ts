import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  buildRecapCardSvg,
  fetchAvatarDataUri,
  parseCardTheme,
  statusCardSvg,
  type CardTheme,
} from './_lib/cardSvg.js'
import { buildAuthenticatedRecap } from './_lib/github.js'

function readQuery(
  req: VercelRequest,
  key: string,
): string | undefined {
  const raw = req.query[key]
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  const path = req.url
  if (!path) return undefined
  try {
    return new URL(path, 'http://localhost').searchParams.get(key) ?? undefined
  } catch {
    return undefined
  }
}

function sendSvg(
  res: VercelResponse,
  status: number,
  svg: string,
  cacheControl: string | null,
): void {
  res.status(status)
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
  res.setHeader('Vary', 'Accept-Encoding')
  if (cacheControl) {
    res.setHeader('Cache-Control', cacheControl)
  } else {
    res.setHeader('Cache-Control', 'no-store')
  }
  res.send(svg)
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    sendSvg(res, 200, statusCardSvg('Try again soon'), null)
    return
  }

  const theme: CardTheme = parseCardTheme(readQuery(req, 'theme'))
  const token = process.env.GITHUB_TOKEN
  const result = await buildAuthenticatedRecap(readQuery(req, 'u'), token)

  if (result.status === 400 || result.status === 404) {
    sendSvg(
      res,
      200,
      statusCardSvg('User not found', theme),
      'public, max-age=300, s-maxage=300',
    )
    return
  }

  if (result.status === 429) {
    sendSvg(res, 200, statusCardSvg('Try again soon', theme), null)
    return
  }

  if (result.status !== 200) {
    sendSvg(res, 200, statusCardSvg('Try again soon', theme), null)
    return
  }

  const avatarDataUri = await fetchAvatarDataUri(
    result.body.user.avatar_url,
    token,
  )
  const svg = buildRecapCardSvg({
    payload: result.body,
    theme,
    avatarDataUri,
  })

  sendSvg(
    res,
    200,
    svg,
    'public, s-maxage=21600, stale-while-revalidate=86400',
  )
}

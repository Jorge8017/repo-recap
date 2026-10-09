import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { ApiRecapErrorBody } from '../src/types.js'
import { fetchAvatarDataUri } from './_lib/avatarDataUri.js'
import { buildAuthenticatedRecap } from './_lib/github.js'
import { renderSharePng } from './_lib/renderSharePng.js'
import { buildShareCardElement } from './_lib/shareCardElement.js'

const CACHE_OK = 'public, s-maxage=21600, stale-while-revalidate=86400'

function readQuery(req: VercelRequest, key: string): string | undefined {
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

function sendJsonError(
  res: VercelResponse,
  status: number,
  body: ApiRecapErrorBody,
): void {
  res.status(status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.json(body)
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    sendJsonError(res, 405, { error: 'upstream' })
    return
  }

  const token = process.env.GITHUB_TOKEN
  const result = await buildAuthenticatedRecap(readQuery(req, 'u'), token)

  if (result.status !== 200) {
    // Same JSON error contract as /api/recap (no user data).
    sendJsonError(res, result.status, result.body)
    return
  }

  try {
    const avatarDataUri = await fetchAvatarDataUri(
      result.body.user.avatar_url,
      token,
    )
    const element = buildShareCardElement(result.body, avatarDataUri)
    const buffer = await renderSharePng(element)

    if (token && buffer.toString('utf8').includes(token)) {
      sendJsonError(res, 404, { error: 'not_found' })
      return
    }

    res.status(200)
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', CACHE_OK)
    res.setHeader('Vary', 'Accept-Encoding')
    res.send(buffer)
  } catch (error) {
    console.error('share-image failed', error)
    sendJsonError(res, 500, { error: 'upstream' })
  }
}

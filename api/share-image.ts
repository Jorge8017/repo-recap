import type { VercelRequest, VercelResponse } from '@vercel/node'
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

function sendError(res: VercelResponse, status: 400 | 404 | 429 | 405 | 500): void {
  res.status(status)
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  if (status === 400) {
    res.send('Bad Request')
    return
  }
  if (status === 404) {
    res.send('Not Found')
    return
  }
  if (status === 429) {
    res.send('Too Many Requests')
    return
  }
  if (status === 405) {
    res.send('Method Not Allowed')
    return
  }
  res.send('Internal Server Error')
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    sendError(res, 405)
    return
  }

  const token = process.env.GITHUB_TOKEN
  const result = await buildAuthenticatedRecap(readQuery(req, 'u'), token)

  if (result.status === 400) {
    sendError(res, 400)
    return
  }
  if (result.status === 404) {
    sendError(res, 404)
    return
  }
  if (result.status === 429) {
    sendError(res, 429)
    return
  }
  if (result.status !== 200) {
    sendError(res, 404)
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
      sendError(res, 404)
      return
    }

    res.status(200)
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', CACHE_OK)
    res.setHeader('Vary', 'Accept-Encoding')
    res.send(buffer)
  } catch (error) {
    console.error('share-image failed', error)
    sendError(res, 500)
  }
}

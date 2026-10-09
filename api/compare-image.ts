import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { ApiRecapErrorBody } from '../src/types.js'
import { fetchAvatarDataUri } from './_lib/avatarDataUri.js'
import { buildCompareCardElement } from './_lib/compareCardElement.js'
import { buildAuthenticatedRecap } from './_lib/github.js'
import { renderSharePng } from './_lib/renderSharePng.js'
import { isSameUser } from '../src/lib/compare.js'

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
  const aRaw = readQuery(req, 'a')
  const bRaw = readQuery(req, 'b')

  if (
    aRaw &&
    bRaw &&
    isSameUser(aRaw, bRaw)
  ) {
    sendJsonError(res, 400, { error: 'invalid_username' })
    return
  }

  const [resultA, resultB] = await Promise.all([
    buildAuthenticatedRecap(aRaw, token),
    buildAuthenticatedRecap(bRaw, token),
  ])

  if (resultA.status !== 200) {
    sendJsonError(res, resultA.status, resultA.body)
    return
  }
  if (resultB.status !== 200) {
    sendJsonError(res, resultB.status, resultB.body)
    return
  }

  try {
    const [avatarA, avatarB] = await Promise.all([
      fetchAvatarDataUri(resultA.body.user.avatar_url, token),
      fetchAvatarDataUri(resultB.body.user.avatar_url, token),
    ])
    const element = buildCompareCardElement(
      resultA.body,
      resultB.body,
      avatarA,
      avatarB,
    )
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
    console.error('compare-image failed', error)
    sendJsonError(res, 500, { error: 'upstream' })
  }
}

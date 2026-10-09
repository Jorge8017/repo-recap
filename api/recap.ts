import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildAuthenticatedRecap } from './githubRecap.js'

function readUsernameQuery(req: VercelRequest): string | undefined {
  const raw = req.query.u
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]

  const path = req.url
  if (!path) return undefined
  try {
    return new URL(path, 'http://localhost').searchParams.get('u') ?? undefined
  } catch {
    return undefined
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'upstream' })
    return
  }

  const result = await buildAuthenticatedRecap(
    readUsernameQuery(req),
    process.env.GITHUB_TOKEN,
  )

  res.setHeader('Vary', 'Accept-Encoding')
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, String(value))
    }
  }

  res.status(result.status).json(result.body)
}

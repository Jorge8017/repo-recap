import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildAuthenticatedRecap } from './githubRecap.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'upstream' })
    return
  }

  const raw = req.query.u
  const username = Array.isArray(raw) ? raw[0] : raw
  const result = await buildAuthenticatedRecap(
    username,
    process.env.GITHUB_TOKEN,
  )

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, String(value))
    }
  }

  res.status(result.status).json(result.body)
}

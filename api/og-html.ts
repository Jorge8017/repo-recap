import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildAuthenticatedRecap } from './_lib/github.js'
import { assignPersonality } from '../src/lib/personality.js'
import { buildRecapStats } from '../src/lib/stats.js'

const SITE = 'https://recap.jordanshears.com'

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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sendPlain(res: VercelResponse, status: number, body: string): void {
  res.status(status)
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.send(body)
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    sendPlain(res, 405, 'Method Not Allowed')
    return
  }

  const token = process.env.GITHUB_TOKEN
  const result = await buildAuthenticatedRecap(readQuery(req, 'u'), token)

  if (result.status === 400) {
    sendPlain(res, 400, 'Bad Request')
    return
  }
  if (result.status === 404) {
    sendPlain(res, 404, 'Not Found')
    return
  }
  if (result.status === 429) {
    sendPlain(res, 429, 'Too Many Requests')
    return
  }
  if (result.status !== 200) {
    sendPlain(res, 404, 'Not Found')
    return
  }

  const stats = buildRecapStats(
    result.body.user,
    result.body.repos,
    result.body.events,
    new Date(),
    result.body.contributions ?? null,
  )
  const personality = assignPersonality(stats)
  const name = stats.displayName || stats.username
  const username = stats.username
  const title = `${name}'s Repo Recap`
  const description = personality.title
  const image = `${SITE}/api/share-image?u=${encodeURIComponent(username)}`
  const pageUrl = `${SITE}/u/${encodeURIComponent(username)}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${escapeHtml(pageUrl)}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(description)}"/>
<meta property="og:image" content="${escapeHtml(image)}"/>
<meta property="og:image:width" content="1080"/>
<meta property="og:image:height" content="1350"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(description)}"/>
<meta name="twitter:image" content="${escapeHtml(image)}"/>
<link rel="canonical" href="${escapeHtml(pageUrl)}"/>
</head>
<body>
<p>${escapeHtml(title)}</p>
</body>
</html>`

  res.status(200)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=21600, stale-while-revalidate=86400',
  )
  res.send(html)
}

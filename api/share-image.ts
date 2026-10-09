import { ImageResponse } from '@vercel/og'
import { fetchAvatarDataUri } from './_lib/avatarDataUri.js'
import { buildAuthenticatedRecap } from './_lib/github.js'
import {
  buildShareCardElement,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
} from './_lib/shareCardElement.js'
import { loadShareFonts } from './_lib/shareFonts.js'

export const config = { runtime: 'edge' }

const CACHE_OK = 'public, s-maxage=21600, stale-while-revalidate=86400'

function errorResponse(status: 400 | 404 | 429 | 405 | 500): Response {
  const body =
    status === 400
      ? 'Bad Request'
      : status === 404
        ? 'Not Found'
        : status === 429
          ? 'Too Many Requests'
          : status === 405
            ? 'Method Not Allowed'
            : 'Internal Server Error'
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return errorResponse(405)
  }

  const token = process.env.GITHUB_TOKEN
  const username = new URL(req.url).searchParams.get('u') ?? undefined
  const result = await buildAuthenticatedRecap(username, token)

  if (result.status === 400) return errorResponse(400)
  if (result.status === 404) return errorResponse(404)
  if (result.status === 429) return errorResponse(429)
  if (result.status !== 200) return errorResponse(404)

  try {
    const avatarDataUri = await fetchAvatarDataUri(
      result.body.user.avatar_url,
      token,
    )
    const element = buildShareCardElement(result.body, avatarDataUri)
    const fonts = await loadShareFonts()

    return new ImageResponse(element, {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      fonts,
      headers: {
        'Cache-Control': CACHE_OK,
        Vary: 'Accept-Encoding',
      },
    })
  } catch (error) {
    console.error('share-image failed', error)
    return errorResponse(500)
  }
}

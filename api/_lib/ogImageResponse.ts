import { createRequire } from 'node:module'
import type { ReactElement } from 'react'

const require = createRequire(import.meta.url)

// @vercel/og's ESM entry breaks under Node ESM (dynamic require of fs).
// createRequire loads the Node build the same way Vercel serverless does.
const { ImageResponse } = require('@vercel/og') as typeof import('@vercel/og')

export type { ImageResponse }

export function createOgImageResponse(
  element: ReactElement,
  options: ConstructorParameters<typeof ImageResponse>[1],
): InstanceType<typeof ImageResponse> {
  return new ImageResponse(element, options)
}

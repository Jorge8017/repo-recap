import type { ReactElement } from 'react'
import type { ImageResponse as ImageResponseType } from '@vercel/og'

type ImageResponseOptions = ConstructorParameters<typeof ImageResponseType>[1]

/**
 * Load @vercel/og via dynamic import.
 * Vercel compiles api/ to CJS; createRequire() cannot load the ESM-only package
 * (ERR_REQUIRE_ESM). Dynamic import() works from that CJS wrapper.
 */
export async function createOgImageResponse(
  element: ReactElement,
  options: ImageResponseOptions,
): Promise<InstanceType<typeof ImageResponseType>> {
  const { ImageResponse } = await import('@vercel/og')
  return new ImageResponse(element, options)
}

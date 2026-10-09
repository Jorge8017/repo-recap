import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import type { ReactElement } from 'react'
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
} from './shareCardElement.js'
import { loadShareFonts } from './shareFonts.js'

/** Render the share card React tree to a PNG via Satori + resvg (Node). */
export async function renderSharePng(element: ReactElement): Promise<Buffer> {
  const svg = await satori(element, {
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    fonts: loadShareFonts(),
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: SHARE_IMAGE_WIDTH,
    },
  })
  return Buffer.from(resvg.render().asPng())
}

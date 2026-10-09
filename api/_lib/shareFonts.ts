import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ShareFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 500 | 700
  style: 'normal'
}

let cached: ShareFont[] | null = null

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength)
  copy.set(buffer)
  return copy.buffer
}

/** Load bundled TTFs once (no network font loading). */
export function loadShareFonts(): ShareFont[] {
  if (cached) return cached

  const fontsDir = join(dirname(fileURLToPath(import.meta.url)), '../_fonts')
  const read = (name: string) => toArrayBuffer(readFileSync(join(fontsDir, name)))

  cached = [
    {
      name: 'Space Grotesk',
      data: read('SpaceGrotesk-400.ttf'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Space Grotesk',
      data: read('SpaceGrotesk-500.ttf'),
      weight: 500,
      style: 'normal',
    },
    {
      name: 'Space Grotesk',
      data: read('SpaceGrotesk-700.ttf'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: read('JetBrainsMono-500.ttf'),
      weight: 500,
      style: 'normal',
    },
  ]

  return cached
}

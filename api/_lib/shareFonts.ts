import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Font } from 'satori'

let cached: Font[] | null = null

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength)
  copy.set(buffer)
  return copy.buffer
}

function resolveFontsDir(): string {
  const besideLib = join(dirname(fileURLToPath(import.meta.url)), '../_fonts')
  try {
    readFileSync(join(besideLib, 'SpaceGrotesk-400.ttf'))
    return besideLib
  } catch {
    return join(process.cwd(), 'api/_fonts')
  }
}

/** Load bundled TTFs once (no network font loading). */
export function loadShareFonts(): Font[] {
  if (cached) return cached

  const fontsDir = resolveFontsDir()
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

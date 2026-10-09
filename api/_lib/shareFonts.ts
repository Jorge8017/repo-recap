export type ShareFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 500 | 700
  style: 'normal'
}

let cached: ShareFont[] | null = null

async function readFont(fileName: string): Promise<ArrayBuffer> {
  const response = await fetch(new URL(`../_fonts/${fileName}`, import.meta.url))
  if (!response.ok) {
    throw new Error(`Missing font file: ${fileName}`)
  }
  return response.arrayBuffer()
}

/** Load bundled TTFs once (no network font loading). */
export async function loadShareFonts(): Promise<ShareFont[]> {
  if (cached) return cached

  const [regular, medium, bold, mono] = await Promise.all([
    readFont('SpaceGrotesk-400.ttf'),
    readFont('SpaceGrotesk-500.ttf'),
    readFont('SpaceGrotesk-700.ttf'),
    readFont('JetBrainsMono-500.ttf'),
  ])

  cached = [
    { name: 'Space Grotesk', data: regular, weight: 400, style: 'normal' },
    { name: 'Space Grotesk', data: medium, weight: 500, style: 'normal' },
    { name: 'Space Grotesk', data: bold, weight: 700, style: 'normal' },
    { name: 'JetBrains Mono', data: mono, weight: 500, style: 'normal' },
  ]

  return cached
}

export const MIN_PNG_BYTES = 50_000
export const IMAGE_CREATE_TOAST = "Couldn't create the image — try again"

export class InvalidPngError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'InvalidPngError'
  }
}

export function assertPngBlob(blob: Blob | null): Blob {
  if (!blob) {
    throw new InvalidPngError('Capture returned no blob')
  }
  if (blob.type !== 'image/png') {
    throw new InvalidPngError(`Unexpected blob type: ${blob.type || 'empty'}`)
  }
  if (blob.size <= MIN_PNG_BYTES) {
    throw new InvalidPngError(`Blob too small: ${blob.size} bytes`)
  }
  return blob
}

export function downloadPngBlob(
  blob: Blob | null,
  filename: string,
  doc?: Document,
): void {
  const png = assertPngBlob(blob)
  const target = doc ?? globalThis.document
  const objectUrl = URL.createObjectURL(png)
  const link = target.createElement('a')
  link.download = filename
  link.href = objectUrl
  link.rel = 'noopener'
  target.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function waitForAnimationFrame(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') return
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export async function waitForExportReady(avatarSrc: string): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }
  if (!avatarSrc.startsWith('data:')) {
    throw new InvalidPngError('Avatar data URL is not ready')
  }
  await waitForAnimationFrame()
}

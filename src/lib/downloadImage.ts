export const MIN_PNG_BYTES = 50_000
export const IMAGE_CREATE_TOAST = "Couldn't create the image — try again"
export const IMAGE_API_TOAST =
  'Image download needs the deployed API — run npm run dev:api'

export class InvalidPngError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'InvalidPngError'
  }
}

export class ShareImageApiUnavailableError extends Error {
  constructor(message = IMAGE_API_TOAST) {
    super(message)
    this.name = 'ShareImageApiUnavailableError'
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

export async function fetchShareImagePng(username: string): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(
      `/api/share-image?u=${encodeURIComponent(username)}`,
    )
  } catch {
    throw new ShareImageApiUnavailableError()
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    throw new ShareImageApiUnavailableError()
  }

  if (!response.ok) {
    throw new InvalidPngError(`share-image HTTP ${response.status}`)
  }

  const raw = await response.blob()
  const png =
    raw.type === 'image/png'
      ? raw
      : new Blob([await raw.arrayBuffer()], { type: 'image/png' })
  return assertPngBlob(png)
}

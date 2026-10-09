/** Edge-safe base64 helpers (no Node Buffer required). */

export function stringToBase64(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64')
  }
  const bytes = new TextEncoder().encode(value)
  return bytesToBase64(bytes)
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

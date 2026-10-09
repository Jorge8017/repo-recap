import { bytesToBase64 } from './base64.js'

/** Fetch a GitHub avatar and return a data URI (Edge + Node safe). */
export async function fetchAvatarDataUri(
  avatarUrl: string,
  token: string | undefined,
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'image/*',
      'User-Agent': 'repo-recap-card',
    }
    if (token) headers.Authorization = `Bearer ${token}`
    const response = await fetch(avatarUrl, { headers })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') ?? 'image/png'
    if (!contentType.startsWith('image/')) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength === 0 || bytes.byteLength > 1_500_000) return null
    return `data:${contentType};base64,${bytesToBase64(bytes)}`
  } catch {
    return null
  }
}

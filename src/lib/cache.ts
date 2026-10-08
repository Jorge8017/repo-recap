const PREFIX = 'repo-recap:v1:'
const TTL_MS = 60 * 60 * 1000

interface CacheEnvelope<T> {
  expiresAt: number
  value: T
}

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null
    }
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return parsed.value
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      expiresAt: Date.now() + TTL_MS,
      value,
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(envelope))
  } catch {
    // Storage may be blocked, quota-exceeded, or unavailable.
  }
}

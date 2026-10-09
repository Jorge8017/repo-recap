export const SITE_NAME = 'Repo Recap'
export const LIVE_ORIGIN = 'https://recap.jordanshears.com'

export function siteOrigin(): string {
  if (typeof window === 'undefined') return LIVE_ORIGIN
  return window.location.origin
}

export function recapPath(username: string): string {
  return `/u/${encodeURIComponent(username)}`
}

export function recapHref(username: string): string {
  return `${siteOrigin()}${recapPath(username)}`
}

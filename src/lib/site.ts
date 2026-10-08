export const SITE_NAME = 'Repo Recap'

export function siteHost(): string {
  if (typeof window === 'undefined') return 'reporecap.app'
  return window.location.host
}

export function recapPath(username: string): string {
  return `/u/${encodeURIComponent(username)}`
}

export function recapHref(username: string): string {
  if (typeof window === 'undefined') return recapPath(username)
  return `${window.location.origin}${recapPath(username)}`
}

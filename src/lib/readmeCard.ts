import { LIVE_ORIGIN } from './site'

export type ReadmeCardTheme = 'dark' | 'light'

export function readmeCardPath(
  username: string,
  theme: ReadmeCardTheme = 'dark',
): string {
  const params = new URLSearchParams({
    u: username,
    theme,
  })
  return `/api/card?${params.toString()}`
}

export function readmeCardAbsoluteUrl(
  username: string,
  theme: ReadmeCardTheme = 'dark',
  origin: string = LIVE_ORIGIN,
): string {
  return `${origin.replace(/\/$/, '')}${readmeCardPath(username, theme)}`
}

export function readmeMarkdownSnippet(
  username: string,
  theme: ReadmeCardTheme = 'dark',
  origin: string = LIVE_ORIGIN,
): string {
  const base = origin.replace(/\/$/, '')
  const card = readmeCardAbsoluteUrl(username, theme, base)
  const href = `${base}/u/${encodeURIComponent(username)}`
  return `[![Repo Recap](${card})](${href})`
}

export function readmeHint(username: string): string {
  return `Paste this into the README.md of your ${username}/${username} repo.`
}

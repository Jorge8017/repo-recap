/** GitHub login: 1–39 chars, alphanumeric or hyphen, no leading/trailing/double hyphen. */
export const GITHUB_USERNAME_PATTERN =
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export function isValidGitHubUsername(value: string): boolean {
  return GITHUB_USERNAME_PATTERN.test(value.trim())
}

export function normalizeUsername(value: string): string {
  return value.trim()
}

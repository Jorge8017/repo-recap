import { describe, expect, it } from 'vitest'
import {
  readmeCardAbsoluteUrl,
  readmeHint,
  readmeMarkdownSnippet,
} from '../lib/readmeCard'

describe('readmeCard helpers', () => {
  it('builds the markdown snippet with absolute card and profile URLs', () => {
    expect(readmeMarkdownSnippet('octocat', 'dark', 'https://recap.jordanshears.com')).toBe(
      '[![Repo Recap](https://recap.jordanshears.com/api/card?u=octocat&theme=dark)](https://recap.jordanshears.com/u/octocat)',
    )
    expect(readmeCardAbsoluteUrl('octocat', 'light')).toContain('theme=light')
    expect(readmeHint('octocat')).toContain('octocat/octocat')
  })
})

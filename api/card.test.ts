import { describe, expect, it } from 'vitest'
import {
  buildRecapCardSvg,
  parseCardTheme,
  statusCardSvg,
  svgContainsSecret,
  themeColors,
} from './_lib/cardSvg.js'
import { escapeXml, truncateEllipsis } from './_lib/xml.js'
import type { CachedRecapPayload } from '../src/types.js'

const TOKEN = 'ghp_secret_token_must_never_appear'

function samplePayload(overrides: Partial<CachedRecapPayload['user']> = {}): CachedRecapPayload {
  return {
    user: {
      login: 'octocat',
      name: 'The <Octocat> & Co',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      bio: null,
      created_at: '2011-01-25T00:00:00Z',
      public_repos: 2,
      html_url: 'https://github.com/octocat',
      ...overrides,
    },
    repos: [
      {
        id: 1,
        name: 'hello<script>',
        full_name: 'octocat/hello',
        description: null,
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 1,
        pushed_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/octocat/hello',
        fork: false,
      },
      {
        id: 2,
        name: 'world',
        full_name: 'octocat/world',
        description: null,
        language: 'Go',
        stargazers_count: 4,
        forks_count: 0,
        pushed_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/octocat/world',
        fork: false,
      },
      {
        id: 3,
        name: 'notes',
        full_name: 'octocat/notes',
        description: null,
        language: 'Python',
        stargazers_count: 2,
        forks_count: 0,
        pushed_at: '2024-01-03T00:00:00Z',
        html_url: 'https://github.com/octocat/notes',
        fork: false,
      },
    ],
    events: [],
    contributions: {
      totalCommitContributions: 40,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 0,
      restrictedContributionsCount: 0,
      contributionCalendar: {
        totalContributions: 120,
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-01', contributionCount: 5, weekday: 1 },
              { date: '2024-01-02', contributionCount: 5, weekday: 2 },
            ],
          },
        ],
      },
    },
  }
}

describe('card SVG helpers', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`Tom & Jerry <"'>`)).toBe(
      'Tom &amp; Jerry &lt;&quot;&apos;&gt;',
    )
  })

  it('truncates long names with an ellipsis', () => {
    expect(truncateEllipsis('abcdefghijklmnopqrstuvwxyz', 10)).toBe(
      'abcdefghi…',
    )
    expect(truncateEllipsis('short', 10)).toBe('short')
  })

  it('parses theme query values', () => {
    expect(parseCardTheme('light')).toBe('light')
    expect(parseCardTheme('dark')).toBe('dark')
    expect(parseCardTheme(undefined)).toBe('dark')
  })
})

describe('buildRecapCardSvg', () => {
  it('embeds escaped name/login, data-URI avatar, and no external image URLs', () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const svg = buildRecapCardSvg({
      payload: samplePayload(),
      theme: 'dark',
      avatarDataUri: dataUri,
    })

    expect(svg).toContain('The &lt;Octocat&gt; &amp; Co')
    expect(svg).toContain('@octocat')
    expect(svg).toContain(`href="${dataUri}"`)
    expect(svg).not.toMatch(/https?:\/\/avatars\.githubusercontent\.com/)
    expect(svg).not.toMatch(/href="https?:\/\//)
    expect(svg).toContain('recap.jordanshears.com')
    expect(svg).toContain('contributions')
    expect(svgContainsSecret(svg, TOKEN)).toBe(false)
  })

  it('applies dark and light theme colours', () => {
    const dark = buildRecapCardSvg({
      payload: samplePayload(),
      theme: 'dark',
      avatarDataUri: null,
    })
    const light = buildRecapCardSvg({
      payload: samplePayload(),
      theme: 'light',
      avatarDataUri: null,
    })
    expect(dark).toContain(themeColors('dark').gold)
    expect(dark).toContain(themeColors('dark').text)
    expect(light).toContain(themeColors('light').gold)
    expect(light).toContain(themeColors('light').text)
    expect(light).toContain('#FFFFFF')
  })

  it('truncates very long display names in the SVG', () => {
    const long = 'A'.repeat(40)
    const svg = buildRecapCardSvg({
      payload: samplePayload({ name: long }),
      theme: 'dark',
      avatarDataUri: null,
    })
    expect(svg).toContain(`${'A'.repeat(21)}…`)
    expect(svg).not.toContain(long)
  })

  it('right-aligns the personality badge as a pill at the top-right padding edge', () => {
    const svg = buildRecapCardSvg({
      payload: samplePayload(),
      theme: 'dark',
      avatarDataUri: null,
      now: new Date('2024-06-15T12:00:00.000Z'),
    })

    expect(svg).toContain('text-anchor="end"')
    expect(svg).toContain('fill-opacity="0.15"')
    expect(svg).toMatch(
      /<rect x="[\d.]+" y="20" width="[\d.]+" height="34" rx="17" fill="#F2C46D" fill-opacity="0\.15"\/>/,
    )
    expect(svg).toMatch(
      /<text x="475" y="[\d.]+" text-anchor="end"[^>]*>Builder<\/text>/,
    )
    expect(svg).toMatchSnapshot()
  })
})

describe('statusCardSvg', () => {
  it('returns a User not found card suitable for HTTP 200', () => {
    const svg = statusCardSvg('User not found', 'dark')
    expect(svg).toContain('User not found')
    expect(svg.startsWith('<?xml')).toBe(true)
    expect(svgContainsSecret(svg, TOKEN)).toBe(false)
  })
})

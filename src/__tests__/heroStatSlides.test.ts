import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AgeSlide } from '../components/slides/AgeSlide'
import { BusiestSlide } from '../components/slides/BusiestSlide'
import { StreakSlide } from '../components/slides/StreakSlide'
import type { Personality, RecapStats, SlideProps } from '../types'

const personality: Personality = {
  id: 'builder',
  title: 'The Builder',
  description: 'Ships in public.',
  emoji: '🧱',
}

function props(overrides: Partial<RecapStats> = {}): SlideProps {
  const stats: RecapStats = {
    username: 'gaearon',
    displayName: 'Dan',
    avatarUrl: 'https://example.com/a.png',
    profileUrl: 'https://example.com/gaearon',
    accountAgeYears: 15,
    joinYear: 2011,
    totalRepos: 4,
    totalStars: 10,
    totalForks: 1,
    mostStarredRepo: null,
    topLanguages: [],
    languageCount: 1,
    mostRecentlyActiveRepo: null,
    busiestDay: 'Friday',
    busiestHour: 22,
    totalPushEvents: 8,
    totalCommitsPushed: 12,
    longestStreak: 2,
    currentStreak: 1,
    mostActiveRepoInWindow: { name: 'overreacted.io', eventCount: 9 },
    hasEventStats: true,
    hasContributionStats: false,
    totalContributions: 0,
    privateContributions: 0,
    bestMonth: null,
    contributionWeeks: [],
    isEmptyProfile: false,
    ...overrides,
  }

  return {
    stats,
    personality,
    reducedMotion: true,
    avatarSrc: stats.avatarUrl,
  }
}

describe('hero stat slides', () => {
  it('renders account age value and joined details', () => {
    const html = renderToStaticMarkup(createElement(AgeSlide, props()))
    expect(html).toContain('Building in public for')
    expect(html).toContain('>15<')
    expect(html).toContain('years')
    expect(html).toContain('Joined')
    expect(html).toContain('2011')
    expect(html).toContain('<dt')
  })

  it('renders busiest day value and peak hour details', () => {
    const html = renderToStaticMarkup(createElement(BusiestSlide, props()))
    expect(html).toContain('You light up on')
    expect(html).toContain('Fridays')
    expect(html).toContain('Peak hour')
    expect(html).toContain('10:00 PM')
    expect(html).toContain('<dt')
  })

  it('renders streak value and details for repo and commits', () => {
    const html = renderToStaticMarkup(createElement(StreakSlide, props()))
    expect(html).toContain('Longest active streak')
    expect(html).toContain('>2<')
    expect(html).toContain('days')
    expect(html).toContain('Most active repo')
    expect(html).toContain('overreacted.io')
    expect(html).toContain('Current streak')
    expect(html).toContain('1 day')
    expect(html).toContain('<dt')
  })
})

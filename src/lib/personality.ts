import type { Personality, PersonalityId, RecapStats } from '../types'

interface PersonalityRule {
  id: PersonalityId
  title: string
  description: string
  emoji: string
  match: (stats: RecapStats) => boolean
}

const STAR_COLLECTOR_THRESHOLD = 100

/**
 * First matching rule wins. Order is the product's priority for ties.
 */
const RULES: PersonalityRule[] = [
  {
    id: 'ghost-mode',
    title: 'Ghost Mode',
    description: 'Building in private. Mysterious.',
    emoji: '👻',
    match: (stats) => stats.isEmptyProfile,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Your best work happens after the world goes quiet.',
    emoji: '🌙',
    match: (stats) =>
      stats.busiestHour !== null &&
      (stats.busiestHour >= 22 || stats.busiestHour < 4),
  },
  {
    id: 'polyglot',
    title: 'Polyglot',
    description: 'You collect languages the way others collect stickers.',
    emoji: '🧬',
    match: (stats) => stats.languageCount >= 4,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Weekdays are for the world. Weekends are for shipping.',
    emoji: '🌅',
    match: (stats) =>
      stats.busiestDay === 'Saturday' || stats.busiestDay === 'Sunday',
  },
  {
    id: 'star-collector',
    title: 'Star Collector',
    description: 'People keep starring the things you leave in public.',
    emoji: '✨',
    match: (stats) => stats.totalStars >= STAR_COLLECTOR_THRESHOLD,
  },
  {
    id: 'marathon-coder',
    title: 'Marathon Coder',
    description: "You don't dip in — you stay in the chair.",
    emoji: '🔥',
    match: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'builder',
    title: 'Builder',
    description: 'You show up, you ship, you stack another brick.',
    emoji: '🧱',
    match: () => true,
  },
]

export function assignPersonality(stats: RecapStats): Personality {
  const rule = RULES.find((candidate) => candidate.match(stats)) ?? RULES[RULES.length - 1]
  if (!rule) {
    return {
      id: 'builder',
      title: 'Builder',
      description: 'You show up, you ship, you stack another brick.',
      emoji: '🧱',
    }
  }
  return {
    id: rule.id,
    title: rule.title,
    description: rule.description,
    emoji: rule.emoji,
  }
}

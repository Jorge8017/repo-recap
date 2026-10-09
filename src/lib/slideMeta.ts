import type { SlideId } from '../types.js'

export const SLIDE_CATALOG: Record<SlideId, string> = {
  intro: 'Repo Recap',
  age: 'Account age',
  year: 'Your year',
  quiet: 'Quiet Mode',
  totals: 'Public catalog',
  languages: 'Languages',
  busiest: 'Last 12 months',
  streak: 'Last 12 months',
  starred: 'Crowd favorite',
  personality: 'The reveal',
  summary: 'Your card',
}

export const SLIDE_STAGE_GLOW: Record<SlideId, string> = {
  intro:
    'radial-gradient(700px 520px at 50% 40%, rgba(122,45,74,0.38), transparent 70%)',
  age: 'radial-gradient(700px 520px at 50% 50%, rgba(42,143,134,0.32), transparent 70%)',
  year: 'radial-gradient(700px 520px at 50% 50%, rgba(217,94,60,0.34), transparent 70%)',
  quiet:
    'radial-gradient(700px 520px at 50% 50%, rgba(92,107,136,0.28), transparent 70%)',
  totals:
    'radial-gradient(700px 520px at 50% 50%, rgba(201,90,44,0.32), transparent 70%)',
  languages:
    'radial-gradient(700px 520px at 50% 50%, rgba(107,58,201,0.32), transparent 70%)',
  busiest:
    'radial-gradient(700px 520px at 50% 50%, rgba(61,110,201,0.32), transparent 70%)',
  streak:
    'radial-gradient(700px 520px at 50% 50%, rgba(196,59,92,0.32), transparent 70%)',
  starred:
    'radial-gradient(700px 520px at 50% 50%, rgba(196,154,42,0.32), transparent 70%)',
  personality:
    'radial-gradient(700px 520px at 50% 50%, rgba(176,58,209,0.34), transparent 70%)',
  summary:
    'radial-gradient(760px 560px at 35% 50%, rgba(140,50,170,0.32), transparent 70%)',
}

export function slideKicker(index: number, count: number, id: SlideId): string {
  const n = String(index + 1).padStart(2, '0')
  const total = String(count).padStart(2, '0')
  return `${n} / ${total} · ${SLIDE_CATALOG[id]}`
}

export const LANGUAGE_BAR_COLORS = ['#F2C46D', '#F08A6C', '#6FD3B8', '#8AA4FF', '#D9A8FF']

/** Stable per-language colours so the same language matches across compare bars. */
const LANGUAGE_COLOR_BY_NAME: Record<string, string> = {
  javascript: '#F2C46D',
  typescript: '#F08A6C',
  css: '#6FD3B8',
  html: '#E8A0BF',
  python: '#8AA4FF',
  go: '#6FD3B8',
  rust: '#F08A6C',
  java: '#F2C46D',
  ruby: '#E8A0BF',
  php: '#8AA4FF',
  c: '#D9A8FF',
  'c++': '#D9A8FF',
  'c#': '#8AA4FF',
  swift: '#F08A6C',
  kotlin: '#D9A8FF',
  shell: '#6FD3B8',
  vue: '#6FD3B8',
  svelte: '#F08A6C',
}

export function languageBarColor(name: string): string {
  const key = name.trim().toLowerCase()
  const known = LANGUAGE_COLOR_BY_NAME[key]
  if (known) return known
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return LANGUAGE_BAR_COLORS[hash % LANGUAGE_BAR_COLORS.length] ?? LANGUAGE_BAR_COLORS[0]!
}

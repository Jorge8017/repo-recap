import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PersonalityIcon } from '../components/PersonalityIcon'
import type { PersonalityId } from '../types'

const IDS: PersonalityId[] = [
  'ghost-mode',
  'night-owl',
  'polyglot',
  'weekend-warrior',
  'star-collector',
  'marathon-coder',
  'builder',
]

describe('PersonalityIcon', () => {
  it('renders gold SVG marks for every personality', () => {
    for (const id of IDS) {
      const html = renderToStaticMarkup(createElement(PersonalityIcon, { id, size: 24 }))
      expect(html).toContain('#F2C46D')
      expect(html).toContain('aria-hidden="true"')
      expect(html).not.toMatch(/🌙|👻|🧬|🌅|✨|🔥|🧱|🔍|🛰️|⏳/)
    }
  })

  it('uses the crescent path for Night Owl', () => {
    const html = renderToStaticMarkup(
      createElement(PersonalityIcon, { id: 'night-owl' }),
    )
    expect(html).toContain('M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5')
  })
})

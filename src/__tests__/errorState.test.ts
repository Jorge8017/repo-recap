import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ErrorState } from '../components/ErrorState'
import type { RecapErrorKind } from '../lib/errorCopy'

const KINDS: RecapErrorKind[] = ['not_found', 'rate_limit', 'network']

describe('ErrorState', () => {
  it('renders gold stroke SVG icons with no emoji on every error screen', () => {
    for (const kind of KINDS) {
      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement(ErrorState, { kind }),
        ),
      )
      expect(html).toContain('#F2C46D')
      expect(html).toContain('<svg')
      expect(html).toContain('aria-hidden="true"')
      expect(html).not.toMatch(/🔍|🛰️|⏳|🌙|👻|🧬|🌅|✨|🔥|🧱/)
    }
  })
})

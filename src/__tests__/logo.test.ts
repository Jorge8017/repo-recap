import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Logo } from '../components/Logo'

describe('Logo', () => {
  it('renders a unique gradient and the dark chevron by default', () => {
    const html = renderToStaticMarkup(createElement(Logo))
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('#F4EDE2')
    expect(html).toMatch(/url\(#c1-echo-/)
  })

  it('uses the light chevron and exposes a title when provided', () => {
    const html = renderToStaticMarkup(
      createElement(Logo, { variant: 'light', title: 'C1 Echo' }),
    )
    expect(html).toContain('#1A0B22')
    expect(html).toContain('role="img"')
    expect(html).toContain('<title>C1 Echo</title>')
  })
})

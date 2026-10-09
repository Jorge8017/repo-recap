/** @vitest-environment jsdom */
import { createElement, useMemo } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { MonthlyBars } from '../components/MonthlyBars'
import { buildMonthlyBars } from '../lib/monthlyBars'

let renders = 0
const trackRender = () => {
  renders += 1
}

function Parent({ progress }: { progress: number }) {
  const months = useMemo(
    () => buildMonthlyBars([], new Date('2024-06-15T00:00:00.000Z')),
    [],
  )
  return createElement(
    'div',
    null,
    createElement('span', { 'data-testid': 'progress' }, String(progress)),
    createElement(MonthlyBars, {
      months,
      totalContributions: 12,
      bestMonthLabel: 'April 2024',
      reducedMotion: true,
      onRender: trackRender,
    }),
  )
}

describe('MonthlyBars memoisation', () => {
  let container: HTMLDivElement
  let root: Root

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('does not re-render when parent progress updates', async () => {
    renders = 0
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
      root.render(createElement(Parent, { progress: 0 }))
    })
    const afterMount = renders
    expect(afterMount).toBeGreaterThan(0)

    await act(async () => {
      root.render(createElement(Parent, { progress: 0.42 }))
    })

    expect(renders).toBe(afterMount)
    expect(container.querySelector('[data-testid="progress"]')?.textContent).toBe(
      '0.42',
    )
  })
})

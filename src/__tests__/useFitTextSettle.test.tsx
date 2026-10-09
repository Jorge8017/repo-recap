/** @vitest-environment jsdom */
import { createElement, useRef } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFitText } from '../hooks/useFitText'

function Probe({ onUpdate }: { onUpdate: (size: number) => void }) {
  const ref = useRef<HTMLSpanElement>(null)
  const size = useFitText(ref, 96, 40, false, onUpdate)
  return createElement(
    'div',
    { style: { width: 200 } },
    createElement(
      'span',
      {
        ref,
        style: {
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: size,
        },
      },
      'Wednesdays',
    ),
  )
}

describe('useFitText settle', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
    class ResizeObserverStub {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve() },
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  })

  it('settles font-size with no more than 2 updates after mount', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    const updates: number[] = []
    const onUpdate = (size: number) => {
      updates.push(size)
    }

    await act(async () => {
      root.render(createElement(Probe, { onUpdate }))
    })
    await act(async () => {
      await Promise.resolve()
      await document.fonts.ready
      await Promise.resolve()
    })

    expect(updates.length).toBeLessThanOrEqual(2)
  })
})

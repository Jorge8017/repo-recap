import { describe, expect, it } from 'vitest'
import { fitTextSize } from '../hooks/useFitText'

describe('fitTextSize', () => {
  it('keeps maxSize when the text already fits', () => {
    expect(fitTextSize(96, 40, 400, 400)).toBe(96)
    expect(fitTextSize(96, 40, 400, 200)).toBe(96)
  })

  it('scales down with the parent/scroll ratio', () => {
    expect(fitTextSize(96, 40, 200, 400)).toBe(48)
    expect(fitTextSize(96, 40, 250, 400)).toBe(60)
  })

  it('never goes below minSize', () => {
    expect(fitTextSize(96, 40, 50, 400)).toBe(40)
  })

  it('keeps maxSize when the parent has no width yet', () => {
    expect(fitTextSize(96, 40, 0, 800)).toBe(96)
  })
})

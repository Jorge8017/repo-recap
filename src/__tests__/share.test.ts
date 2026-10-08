import { describe, expect, it, vi } from 'vitest'
import {
  isTouchPrimary,
  planShareMethod,
  toastForShareError,
  withShareTimeout,
} from '../lib/share'

describe('planShareMethod', () => {
  it('uses the clipboard on desktop even when canShare files is true', () => {
    expect(planShareMethod(false, true)).toBe('clipboard')
    expect(isTouchPrimary(() => ({ matches: false }))).toBe(false)
  })

  it('uses native share only on touch-primary devices that can share files', () => {
    expect(planShareMethod(true, true)).toBe('native')
    expect(planShareMethod(true, false)).toBe('clipboard')
  })
})

describe('toastForShareError', () => {
  it('treats AbortError as a silent cancel', () => {
    expect(toastForShareError({ name: 'AbortError' })).toBeNull()
    const abort = new Error('cancelled')
    abort.name = 'AbortError'
    expect(toastForShareError(abort)).toBeNull()
  })

  it('returns a toast for any other error', () => {
    expect(toastForShareError(new Error('boom'))).toBe('Could not share just now.')
  })
})

describe('withShareTimeout', () => {
  it('resolves the work when it settles first', async () => {
    const result = await withShareTimeout(Promise.resolve('copied'), 50)
    expect(result).toEqual({ status: 'ok', value: 'copied' })
  })

  it('reports timeout so callers can reset sharing state', async () => {
    const hung = new Promise<string>(() => undefined)
    const result = await withShareTimeout(hung, 20)
    expect(result).toEqual({ status: 'timeout' })
  })

  it('captures rejections without leaving the race pending', async () => {
    const result = await withShareTimeout(
      Promise.reject(new Error('fail')),
      50,
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error).toBeInstanceOf(Error)
    }
  })
})

describe('desktop share fallback', () => {
  it('copies the recap URL instead of calling navigator.share', async () => {
    const share = vi.fn(async () => undefined)
    const copyText = vi.fn(async (_url: string) => undefined)
    const pointerCoarse = false
    const method = planShareMethod(pointerCoarse, true)

    if (method === 'clipboard') {
      await copyText('https://example.test/u/gaearon')
    } else {
      await share()
    }

    expect(copyText).toHaveBeenCalledWith('https://example.test/u/gaearon')
    expect(share).not.toHaveBeenCalled()
  })
})

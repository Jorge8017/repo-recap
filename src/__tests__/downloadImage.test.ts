import { describe, expect, it } from 'vitest'
import {
  assertPngBlob,
  downloadPngBlob,
  InvalidPngError,
  MIN_PNG_BYTES,
} from '../lib/downloadImage'

describe('download helper', () => {
  it('rejects empty or non-PNG blobs', () => {
    expect(() => assertPngBlob(null)).toThrow(InvalidPngError)
    expect(() =>
      downloadPngBlob(new Blob([], { type: 'image/png' }), 'repo-recap-octo.png'),
    ).toThrow(/too small/i)
    expect(() =>
      downloadPngBlob(
        new Blob([new Uint8Array(MIN_PNG_BYTES + 1)], { type: 'text/plain' }),
        'repo-recap-octo.png',
      ),
    ).toThrow(/Unexpected blob type/i)
    expect(() =>
      downloadPngBlob(
        new Blob([new Uint8Array(100)], { type: 'image/png' }),
        'repo-recap-octo.png',
      ),
    ).toThrow(InvalidPngError)
  })

  it('accepts a PNG blob over the minimum size', () => {
    const blob = new Blob([new Uint8Array(MIN_PNG_BYTES + 1)], {
      type: 'image/png',
    })
    expect(assertPngBlob(blob)).toBe(blob)
  })
})

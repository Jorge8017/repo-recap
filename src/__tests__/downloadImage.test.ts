import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertPngBlob,
  downloadPngBlob,
  fetchShareImagePng,
  IMAGE_API_TOAST,
  InvalidPngError,
  MIN_PNG_BYTES,
  ShareImageApiUnavailableError,
} from '../lib/downloadImage'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

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

  it('fetches /api/share-image and asserts PNG size', async () => {
    const bytes = new Uint8Array(MIN_PNG_BYTES + 10)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(bytes, {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )

    const blob = await fetchShareImagePng('octocat')
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(MIN_PNG_BYTES)
    expect(fetch).toHaveBeenCalledWith('/api/share-image?u=octocat')
  })

  it('surfaces the local-dev API toast when the SPA HTML is returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<!doctype html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }),
      ),
    )

    await expect(fetchShareImagePng('octocat')).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ShareImageApiUnavailableError &&
        error.message === IMAGE_API_TOAST,
    )
  })
})

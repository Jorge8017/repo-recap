import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRecapFromApi,
  shouldFallbackToDirectGitHub,
  shouldUseRecapApi,
  RecapApiError,
} from '../api/recapClient'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('shouldUseRecapApi', () => {
  it('uses the API in production or when VITE_USE_API=true', () => {
    expect(shouldUseRecapApi({ PROD: true })).toBe(true)
    expect(shouldUseRecapApi({ PROD: false, VITE_USE_API: 'true' })).toBe(true)
    expect(shouldUseRecapApi({ PROD: false, VITE_USE_API: 'false' })).toBe(false)
    expect(shouldUseRecapApi({ PROD: false })).toBe(false)
  })
})

describe('fetchRecapFromApi', () => {
  it('treats HTML/non-JSON responses as upstream failures for fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    await expect(fetchRecapFromApi('octocat')).rejects.toMatchObject({
      name: 'RecapApiError',
      status: 502,
      code: 'upstream',
    })
  })

  it('treats invalid JSON as an upstream failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('{not-json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(fetchRecapFromApi('octocat')).rejects.toBeInstanceOf(RecapApiError)
  })
})

describe('shouldFallbackToDirectGitHub', () => {
  it('falls back on network and 502 upstream errors', () => {
    expect(
      shouldFallbackToDirectGitHub(new RecapApiError('x', 502, 'upstream')),
    ).toBe(true)
    expect(
      shouldFallbackToDirectGitHub(new RecapApiError('x', 0, 'upstream')),
    ).toBe(true)
  })
})

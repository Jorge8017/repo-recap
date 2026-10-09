import { useQuery } from '@tanstack/react-query'
import { fetchRecapData, shouldRetryGitHubQuery } from '../api/github'
import {
  fetchRecapFromApi,
  shouldFallbackToDirectGitHub,
  shouldUseRecapApi,
} from '../api/recapClient'
import { readCache, writeCache } from '../lib/cache'
import { assignPersonality } from '../lib/personality'
import { buildRecapStats } from '../lib/stats'
import { isValidGitHubUsername, normalizeUsername } from '../lib/username'
import type { CachedRecapPayload, RecapResult } from '../types'

function assemble(payload: CachedRecapPayload): RecapResult {
  const stats = buildRecapStats(
    payload.user,
    payload.repos,
    payload.events,
    new Date(),
    payload.contributions ?? null,
  )
  return {
    stats,
    personality: assignPersonality(stats),
  }
}

export async function loadRecap(username: string): Promise<RecapResult> {
  const key = username.toLowerCase()
  const cached = readCache<CachedRecapPayload>(key)
  if (cached) {
    return assemble(cached)
  }

  if (shouldUseRecapApi()) {
    try {
      const payload = await fetchRecapFromApi(username)
      writeCache(key, payload)
      return assemble(payload)
    } catch (error) {
      if (!shouldFallbackToDirectGitHub(error)) {
        throw error
      }
    }
  }

  const payload = await fetchRecapData(username)
  writeCache(key, payload)
  return assemble(payload)
}

export function useRecap(username: string | undefined) {
  const normalized = normalizeUsername(username ?? '')
  const valid = isValidGitHubUsername(normalized)

  return useQuery({
    queryKey: ['recap', normalized.toLowerCase()],
    queryFn: () => loadRecap(normalized),
    enabled: valid,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: shouldRetryGitHubQuery,
    throwOnError: false,
    refetchOnWindowFocus: false,
  })
}

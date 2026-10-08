import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { PhoneFrame } from '../components/PhoneFrame'
import { StoryPlayer } from '../components/StoryPlayer'
import { useRecap } from '../hooks/useRecap'
import { avatarToDataUrl } from '../lib/avatar'
import { SITE_NAME } from '../lib/site'
import { isValidGitHubUsername, normalizeUsername } from '../lib/username'

export function Recap() {
  const { username: rawUsername } = useParams()
  const username = normalizeUsername(rawUsername ?? '')
  const valid = isValidGitHubUsername(username)
  const query = useRecap(valid ? username : undefined)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [avatarReady, setAvatarReady] = useState(false)

  useEffect(() => {
    const display = query.data?.stats.displayName ?? username
    document.title = valid && display ? `${display} · ${SITE_NAME}` : SITE_NAME
    return () => {
      document.title = SITE_NAME
    }
  }, [query.data, username, valid])

  useEffect(() => {
    const url = query.data?.stats.avatarUrl
    if (!url) {
      setAvatarSrc(null)
      setAvatarReady(false)
      return
    }

    let cancelled = false
    setAvatarReady(false)
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setAvatarSrc(url)
        setAvatarReady(true)
      }
    }, 4000)
    void avatarToDataUrl(url).then((dataUrl) => {
      if (!cancelled) {
        window.clearTimeout(timeout)
        setAvatarSrc(dataUrl)
        setAvatarReady(true)
      }
    })
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [query.data?.stats.avatarUrl])

  const recapReady = Boolean(query.data) && avatarReady

  return (
    <PhoneFrame>
      {!valid ? (
        <ErrorState kind="not_found" />
      ) : recapReady && query.data ? (
        <StoryPlayer
          recap={query.data}
          avatarSrc={avatarSrc ?? query.data.stats.avatarUrl}
        />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LoadingState />
      )}
    </PhoneFrame>
  )
}

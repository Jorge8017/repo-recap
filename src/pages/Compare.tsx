import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { ComparePlayer } from '../components/ComparePlayer'
import { BrandLink } from '../components/Logo'
import { UiButton } from '../components/UiButton'
import { useRecap } from '../hooks/useRecap'
import { avatarToDataUrl } from '../lib/avatar'
import { isSameUser } from '../lib/compare'
import { SITE_NAME } from '../lib/site'
import { isValidGitHubUsername, normalizeUsername } from '../lib/username'
import { GitHubApiError } from '../api/github'

export function Compare() {
  const { userA: rawA = '', userB: rawB = '' } = useParams()
  const userA = normalizeUsername(rawA)
  const userB = normalizeUsername(rawB)

  const validA = isValidGitHubUsername(userA)
  const validB = isValidGitHubUsername(userB)
  const same = validA && validB && isSameUser(userA, userB)

  const queryA = useRecap(validA && !same ? userA : undefined)
  const queryB = useRecap(validB && !same ? userB : undefined)

  const [avatarA, setAvatarA] = useState<string | null>(null)
  const [avatarB, setAvatarB] = useState<string | null>(null)
  const [avatarsReady, setAvatarsReady] = useState(false)

  useEffect(() => {
    document.title =
      validA && validB && !same
        ? `@${userA} vs @${userB} · ${SITE_NAME}`
        : SITE_NAME
    return () => {
      document.title = SITE_NAME
    }
  }, [userA, userB, validA, validB, same])

  useEffect(() => {
    const urlA = queryA.data?.stats.avatarUrl
    const urlB = queryB.data?.stats.avatarUrl
    if (!urlA || !urlB) {
      setAvatarA(null)
      setAvatarB(null)
      setAvatarsReady(false)
      return
    }

    let cancelled = false
    setAvatarsReady(false)
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setAvatarA(urlA)
        setAvatarB(urlB)
        setAvatarsReady(true)
      }
    }, 4000)

    void Promise.all([avatarToDataUrl(urlA), avatarToDataUrl(urlB)]).then(
      ([a, b]) => {
        if (!cancelled) {
          window.clearTimeout(timeout)
          setAvatarA(a)
          setAvatarB(b)
          setAvatarsReady(true)
        }
      },
    )

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [queryA.data?.stats.avatarUrl, queryB.data?.stats.avatarUrl])

  if (!validA || !validB) {
    const bad = !validA ? userA || 'that username' : userB || 'that username'
    return (
      <ErrorState
        kind="not_found"
        failedUsername={bad}
        headlineOverride={`We couldn't find @${bad.replace(/^@/, '')}`}
      />
    )
  }

  if (same) {
    return <SameUserState username={userA} />
  }

  if (queryA.isError) {
    return (
      <CompareUserError
        username={userA}
        error={queryA.error}
        onRetry={() => void queryA.refetch()}
        otherUsername={userB}
        side="a"
      />
    )
  }

  if (queryB.isError) {
    return (
      <CompareUserError
        username={userB}
        error={queryB.error}
        onRetry={() => void queryB.refetch()}
        otherUsername={userA}
        side="b"
      />
    )
  }

  if (queryA.data && queryB.data && avatarsReady) {
    return (
      <ComparePlayer
        a={queryA.data}
        b={queryB.data}
        avatarA={avatarA ?? queryA.data.stats.avatarUrl}
        avatarB={avatarB ?? queryB.data.stats.avatarUrl}
      />
    )
  }

  return <LoadingState />
}

function SameUserState({ username }: { username: string }) {
  const navigate = useNavigate()
  const [other, setOther] = useState('')
  const [error, setError] = useState<string | null>(null)

  const go = () => {
    const trimmed = other.trim().replace(/^@/, '')
    if (!isValidGitHubUsername(trimmed)) {
      setError('Use a valid GitHub username.')
      return
    }
    if (isSameUser(username, trimmed)) {
      setError('Pick a different developer to compare.')
      return
    }
    navigate(`/vs/${encodeURIComponent(username)}/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{
        background:
          'radial-gradient(700px 520px at 50% 40%, rgba(124,44,140,0.3), transparent 70%), #0B0812',
      }}
    >
      <header className="flex items-center justify-between px-5 py-5 lg:px-10">
        <BrandLink />
      </header>
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-6 pb-16">
        <p className="font-mono text-[11px] tracking-[0.16em] text-[#F2C46D] uppercase">
          Same developer
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          @{username} vs @{username}?
        </h1>
        <p className="mt-3 text-[#C9BFD6]">
          Pick someone else to put them side by side.
        </p>
        <label className="mt-8 text-sm text-[#C9BFD6]" htmlFor="compare-other">
          Compare with
        </label>
        <input
          id="compare-other"
          value={other}
          onChange={(event) => {
            setOther(event.target.value)
            if (error) setError(null)
          }}
          placeholder="gaearon"
          className="mt-2 h-12 rounded-[14px] border border-[rgba(244,237,226,0.16)] bg-white/[0.06] px-4 text-[#F4EDE2] outline-none focus:border-[#F2C46D]"
        />
        {error ? (
          <p className="mt-2 text-sm text-[#ffc2c2]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <UiButton onClick={go}>Start compare</UiButton>
          <Link
            to="/"
            className="inline-flex items-center rounded-[14px] border border-[rgba(244,237,226,0.22)] bg-white/[0.04] px-5 py-3 font-semibold text-[#F4EDE2]"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}

function CompareUserError({
  username,
  error,
  onRetry,
  otherUsername,
  side,
}: {
  username: string
  error: unknown
  onRetry: () => void
  otherUsername: string
  side: 'a' | 'b'
}) {
  const navigate = useNavigate()
  const notFound =
    error instanceof GitHubApiError && error.code === 'not_found'
  const [draft, setDraft] = useState(username)

  const fix = () => {
    const trimmed = draft.trim().replace(/^@/, '')
    if (!isValidGitHubUsername(trimmed)) return
    if (side === 'a') {
      navigate(`/vs/${encodeURIComponent(trimmed)}/${encodeURIComponent(otherUsername)}`)
    } else {
      navigate(`/vs/${encodeURIComponent(otherUsername)}/${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <ErrorState
      error={error}
      failedUsername={username}
      headlineOverride={
        notFound ? `We couldn't find @${username}` : undefined
      }
      onRetry={onRetry}
      extraActions={
        <div className="mt-4 flex w-full max-w-[320px] flex-col gap-2">
          <label htmlFor="fix-username" className="text-sm text-[#C9BFD6]">
            Fix @{username}
          </label>
          <input
            id="fix-username"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-12 rounded-[14px] border border-[rgba(244,237,226,0.16)] bg-white/[0.06] px-4 text-[#F4EDE2] outline-none"
          />
          <UiButton onClick={fix}>Try this username</UiButton>
        </div>
      }
    />
  )
}

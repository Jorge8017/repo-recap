import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneFrame } from '../components/PhoneFrame'
import { isValidGitHubUsername } from '../lib/username'

const EXAMPLES = ['gaearon', 'sindresorhus', 'torvalds'] as const

export function Landing() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  const go = (value: string) => {
    const trimmed = value.trim()
    if (!isValidGitHubUsername(trimmed)) {
      setError('Use a GitHub username: letters, numbers, and single hyphens.')
      return
    }
    setError(null)
    navigate(`/u/${encodeURIComponent(trimmed)}`)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    go(username)
  }

  return (
    <PhoneFrame>
      <div className="relative flex h-full min-h-dvh flex-col justify-end overflow-hidden bg-gradient-to-br from-[#140c24] via-[#2a1038] to-[#7a2d4a] px-6 pt-16 pb-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 80% 0%, rgba(240,194,122,0.18), transparent 42%)',
          }}
        />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0c27a]">
            A public-profile reel
          </p>
          <h1 className="mt-3 text-5xl leading-[0.95] font-bold tracking-tight">
            Repo
            <br />
            Recap
          </h1>
          <p className="mt-4 max-w-[22ch] text-lg text-white/75">
            A story-style recap for any public GitHub user — original look, no
            noise, no login.
          </p>

          <form onSubmit={onSubmit} className="mt-10">
            <label htmlFor="username" className="sr-only">
              GitHub username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                if (error) setError(null)
              }}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              placeholder="GitHub username"
              className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-lg text-[#f6efe4] outline-none placeholder:text-white/40 focus:border-[#f0c27a] focus:ring-2 focus:ring-[#f0c27a]/40"
            />
            {error ? (
              <p className="mt-2 text-sm text-[#ffb4b4]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-[#f6efe4] py-4 text-lg font-bold text-[#1a1020] transition hover:bg-white"
            >
              Generate recap
            </button>
          </form>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Try a profile
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => go(example)}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

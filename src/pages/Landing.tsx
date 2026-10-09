import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ArrowRightIcon, CheckIcon } from '../components/Icons'
import { PersonalityIcon } from '../components/PersonalityIcon'
import { SITE_NAME } from '../lib/site'
import { isValidGitHubUsername } from '../lib/username'

const EXAMPLES = ['gaearon', 'sindresorhus', 'torvalds'] as const
const SOURCE_URL = 'https://github.com/Jorge8017/repo-recap'
const GEORGE_URL = 'https://jordanshears.com'

export function Landing() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [vsUsername, setVsUsername] = useState('')
  const [compareOpen, setCompareOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = SITE_NAME
  }, [])

  const go = (value: string) => {
    const trimmed = value.trim().replace(/^@/, '')
    if (!isValidGitHubUsername(trimmed)) {
      setError('Use a GitHub username: letters, numbers, and single hyphens.')
      return
    }
    setError(null)
    navigate(`/u/${encodeURIComponent(trimmed)}`)
  }

  const goCompare = () => {
    const a = username.trim().replace(/^@/, '')
    const b = vsUsername.trim().replace(/^@/, '')
    if (!isValidGitHubUsername(a) || !isValidGitHubUsername(b)) {
      setError('Use two valid GitHub usernames.')
      return
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      setError('Pick two different developers to compare.')
      return
    }
    setError(null)
    navigate(`/vs/${encodeURIComponent(a)}/${encodeURIComponent(b)}`)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (compareOpen) {
      goCompare()
      return
    }
    go(username)
  }

  return (
    <div
      className="flex min-h-dvh flex-col overflow-x-hidden text-[#F4EDE2]"
      style={{
        background:
          'radial-gradient(900px 600px at 78% 40%, rgba(124,44,140,0.35), transparent 70%), radial-gradient(600px 500px at 10% 100%, rgba(217,94,60,0.18), transparent 70%), #0B0812',
      }}
    >
      <header className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10 sm:py-7">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <span className="text-[16px] font-bold tracking-[-0.01em]">{SITE_NAME}</span>
        </div>
        <nav className="hidden items-center gap-7 text-[15px] lg:flex">
          <a href="#how" className="text-[#B9AEC9] no-underline hover:text-[#F4EDE2]">
            How it works
          </a>
          <a
            href={SOURCE_URL}
            className="text-[#B9AEC9] no-underline hover:text-[#F4EDE2]"
          >
            Source code
          </a>
          <a
            href={GEORGE_URL}
            className="rounded-full border border-[rgba(244,237,226,0.18)] px-4 py-2.5 text-[#F4EDE2] no-underline hover:border-[rgba(244,237,226,0.4)]"
          >
            Made by George
          </a>
        </nav>
        <a
          href={GEORGE_URL}
          className="rounded-full border border-[rgba(244,237,226,0.18)] px-3.5 py-2.5 text-sm text-[#C9BFD6] no-underline lg:hidden"
        >
          By George
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-10 px-5 pb-16 sm:px-10 lg:min-h-[calc(100dvh-96px)] lg:flex-row lg:flex-wrap lg:items-center lg:gap-14 lg:pb-16">
        <PreviewCollage className="lg:order-2 lg:flex-1 lg:basis-[460px]" />

        <section className="flex min-w-0 flex-1 basis-[min(100%,480px)] flex-col gap-6 lg:order-1 lg:gap-7">
          <span className="font-mono text-[11px] tracking-[0.18em] text-[#F2C46D] uppercase lg:text-[13px]">
            A public-profile reel
          </span>
          <h1 className="text-[44px] leading-[1] font-bold tracking-[-0.035em] lg:text-[76px] lg:leading-[0.98]">
            Your code,
            <br />
            told as a story.
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-[#C9BFD6] lg:text-[20px] lg:leading-[1.5]">
            Type any public GitHub username and get a story-style recap: languages,
            streaks, peak hours and a personality card worth sharing.
          </p>

          <form
            id="generate"
            onSubmit={onSubmit}
            className="flex flex-col gap-2.5 lg:max-w-[560px]"
          >
            <label htmlFor="username" className="text-sm text-[#C9BFD6] lg:sr-only">
              GitHub username
            </label>
            <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:rounded-[18px] lg:border lg:border-[rgba(244,237,226,0.14)] lg:bg-white/5 lg:p-2">
              <div className="flex h-14 items-center gap-1 rounded-[14px] border border-[rgba(244,237,226,0.16)] bg-white/[0.06] px-4 lg:h-[52px] lg:min-w-0 lg:flex-1 lg:rounded-none lg:border-0 lg:bg-transparent">
                <span className="text-[17px] text-[#8F84A0] lg:hidden">@</span>
                <span className="hidden text-lg text-[#8F84A0] lg:inline">github.com/</span>
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
                  placeholder="gaearon"
                  className="h-12 min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium text-[#F4EDE2] outline-none placeholder:text-[#8F84A0] lg:text-lg"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-14 items-center justify-center gap-2.5 rounded-[14px] bg-[#F4EDE2] px-6 text-[17px] font-bold text-[#1A0B22] transition-transform duration-150 hover:bg-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D] lg:h-14 lg:rounded-xl lg:px-[26px]"
              >
                {compareOpen ? 'Compare' : 'Generate recap'}
                <ArrowRightIcon width={18} height={18} />
              </button>
            </div>
            {compareOpen ? (
              <div className="flex h-14 items-center gap-1 rounded-[14px] border border-[rgba(244,237,226,0.16)] bg-white/[0.06] px-4 lg:h-[52px]">
                <span className="font-mono text-xs tracking-[0.14em] text-[#F2C46D] uppercase">
                  vs
                </span>
                <input
                  id="vs-username"
                  value={vsUsername}
                  onChange={(event) => {
                    setVsUsername(event.target.value)
                    if (error) setError(null)
                  }}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="sindresorhus"
                  aria-label="Compare with GitHub username"
                  className="h-12 min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium text-[#F4EDE2] outline-none placeholder:text-[#8F84A0] lg:text-lg"
                />
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-[#ffc2c2]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCompareOpen((open) => !open)
                setError(null)
              }}
              className="text-left text-sm font-semibold text-[#F2C46D] hover:text-[#FFE2A6]"
            >
              {compareOpen ? 'Single recap instead' : 'Compare two developers'}
            </button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto lg:flex-wrap">
            <span className="mr-1 hidden font-mono text-xs tracking-[0.14em] text-[#8F84A0] uppercase lg:inline">
              Try
            </span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => go(example)}
                className="shrink-0 rounded-full bg-white/[0.07] px-3.5 py-3 text-sm text-[#F4EDE2] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D] lg:px-4 lg:py-2.5 lg:text-[15px]"
              >
                @{example}
              </button>
            ))}
          </div>

          <div className="hidden flex-wrap gap-6 pt-2 text-sm text-[#8F84A0] lg:flex">
            {['No login', 'Public data only', 'Nothing stored'].map((label) => (
              <span key={label} className="inline-flex items-center gap-2">
                <CheckIcon width={16} height={16} className="text-[#6FD3B8]" />
                {label}
              </span>
            ))}
          </div>
        </section>
      </main>

      <section
        id="how"
        className="mx-auto hidden w-full max-w-[1280px] scroll-mt-8 grid-cols-3 gap-8 px-10 pb-20 lg:grid"
      >
        {[
          { n: '01', title: 'Pick a profile', body: 'Any public GitHub username. No OAuth, no token, no waitlist.' },
          { n: '02', title: 'Play the reel', body: 'Languages, streaks, peak hours, and a personality reveal — tailored to what their public profile shows.' },
          { n: '03', title: 'Share the card', body: 'Download a 1080 × 1350 image or copy a link back to the recap.' },
        ].map((step) => (
          <div key={step.n}>
            <p className="font-mono text-xs tracking-[0.16em] text-[#F2C46D]">{step.n}</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight">{step.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#C9BFD6]">{step.body}</p>
          </div>
        ))}
      </section>

      <footer
        id="readme"
        className="mx-auto w-full max-w-[1280px] border-t border-[rgba(244,237,226,0.1)] px-5 py-10 sm:px-10"
      >
        <p className="font-mono text-[11px] tracking-[0.16em] text-[#F2C46D] uppercase">
          Embed
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
          Add to your README
        </h2>
        <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-[#C9BFD6]">
          Generate a recap, open the final card slide, and copy a Markdown snippet
          that embeds a live SVG card on your GitHub profile README.
        </p>
        <a
          href="#generate"
          className="mt-4 inline-flex text-[15px] font-semibold text-[#F2C46D] no-underline hover:text-[#FFE2A6]"
        >
          Add to your README →
        </a>
      </footer>
    </div>
  )
}

function PreviewCollage({ className = '' }: { className?: string }) {
  return (
    <section
      aria-label="Preview of recap slides"
      className={`relative h-[230px] w-full lg:h-[620px] ${className}`}
    >
      <div
        className="absolute top-[30px] left-[30px] hidden h-[444px] w-[250px] flex-col justify-end gap-2 rounded-[28px] p-7 shadow-[0_30px_60px_rgba(0,0,0,0.5)] lg:flex"
        style={{
          background: 'linear-gradient(160deg, #1E4E52, #0E2A33)',
          transform: 'rotate(-9deg)',
        }}
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#9FE3D2] uppercase">
          Account age
        </span>
        <span className="text-[52px] leading-none font-bold tracking-[-0.04em]">15 yrs</span>
        <span className="text-sm text-[#BFE6DC]">Joined 2011</span>
      </div>
      <div
        className="absolute top-10 right-[2%] hidden h-[444px] w-[250px] flex-col justify-center gap-3.5 rounded-[28px] p-7 shadow-[0_30px_60px_rgba(0,0,0,0.5)] lg:flex"
        style={{
          background: 'linear-gradient(160deg, #3B2380, #22134F)',
          transform: 'rotate(8deg)',
        }}
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#C9B8FF] uppercase">
          Languages
        </span>
        <PreviewBar label="JavaScript" pct={67} color="#F2C46D" />
        <PreviewBar label="TypeScript" pct={15} color="#F08A6C" />
        <PreviewBar label="CSS" pct={6} color="#6FD3B8" />
      </div>
      <div
        className="absolute top-0 left-1/2 z-10 flex h-[222px] w-[132px] -translate-x-1/2 flex-col justify-end gap-1.5 rounded-[20px] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.6)] lg:h-[533px] lg:w-[300px] lg:justify-center lg:gap-3.5 lg:rounded-[32px] lg:px-[26px] lg:py-[18px]"
        style={{
          background:
            'radial-gradient(120px 100px at 70% 25%, rgba(199,92,255,0.45), transparent 70%), linear-gradient(170deg, #3A1250, #1B0A2B)',
          boxShadow:
            '0 24px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
        aria-hidden="true"
      >
        <div className="mb-auto hidden gap-1 lg:flex">
          {[0, 1, 2, 3, 4].map((slot) => (
            <div
              key={slot}
              className={`h-[3px] flex-1 rounded-full ${slot < 4 ? 'bg-[#F4EDE2]' : 'bg-[#F4EDE2]/25'}`}
            />
          ))}
        </div>
        <span className="hidden font-mono text-[10px] tracking-[0.16em] text-[#E6C8FF] uppercase lg:inline">
          The reveal
        </span>
        <span className="leading-none lg:hidden" aria-hidden="true">
          <PersonalityIcon id="night-owl" size={26} />
        </span>
        <span className="hidden leading-none lg:block" aria-hidden="true">
          <PersonalityIcon id="night-owl" size={56} />
        </span>
        <span className="text-xl leading-none font-bold tracking-[-0.03em] lg:text-[46px]">
          Night Owl
        </span>
        <span className="hidden text-[15px] leading-snug text-[#D7C7E6] lg:block">
          Your best work happens after the world goes quiet.
        </span>
      </div>
      <div
        className="absolute top-[30px] left-[30px] h-[190px] w-[120px] rounded-[18px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] lg:hidden"
        style={{
          background: 'linear-gradient(160deg, #1E4E52, #0E2A33)',
          transform: 'rotate(-10deg)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[22px] right-[30px] h-[190px] w-[120px] rounded-[18px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] lg:hidden"
        style={{
          background: 'linear-gradient(160deg, #6A2414, #2A0D0A)',
          transform: 'rotate(9deg)',
        }}
        aria-hidden="true"
      />
    </section>
  )
}

function PreviewBar({
  label,
  pct,
  color,
}: {
  label: string
  pct: number
  color: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex justify-between text-[13px]">
        {label}
        <span>{pct}%</span>
      </span>
      <div className="h-2 rounded bg-white/12">
        <div className="h-2 rounded" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

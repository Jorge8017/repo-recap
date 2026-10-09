import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isValidGitHubUsername } from '../../lib/username'
import { isSameUser } from '../../lib/compare'
import { useFitScale } from '../../hooks/useFitScale'
import { FittedText } from '../FittedText'
import {
  downloadPngBlob,
  fetchShareImagePng,
  IMAGE_API_TOAST,
  IMAGE_CREATE_TOAST,
  ShareImageApiUnavailableError,
} from '../../lib/downloadImage'
import {
  canShareFiles,
  isTouchPrimary,
  LINK_COPIED_TOAST,
  planShareMethod,
  SHARE_TIMEOUT_MS,
  toastForShareError,
  withShareTimeout,
} from '../../lib/share'
import { recapHref, siteOrigin } from '../../lib/site'
import { slideKicker } from '../../lib/slideMeta'
import type { SlideProps } from '../../types'
import {
  CloseIcon,
  DownloadIcon,
  LinkIcon,
  RewindIcon,
  SearchIcon,
  ShareArrowIcon,
} from '../Icons'
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  ShareCard,
} from '../ShareCard'
import { ReadmeCardDialog } from '../ReadmeCardDialog'
import { UiButton } from '../UiButton'

export function SummarySlide({
  stats,
  personality,
  avatarSrc,
  onReplay,
  slideCount = 9,
}: SlideProps & { onReplay: () => void; slideCount?: number }) {
  const navigate = useNavigate()
  const readmeTriggerRef = useRef<HTMLButtonElement>(null)
  const { ref: previewHostRef, scale } = useFitScale(
    SHARE_CARD_WIDTH,
    SHARE_CARD_HEIGHT,
  )
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [readmeOpen, setReadmeOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareUser, setCompareUser] = useState('')
  const [compareError, setCompareError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const compareInputRef = useRef<HTMLInputElement>(null)
  const origin = siteOrigin()

  useEffect(() => {
    if (compareOpen) {
      window.requestAnimationFrame(() => compareInputRef.current?.focus())
    }
  }, [compareOpen])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }

  const toastForImageError = (error: unknown) => {
    if (error instanceof ShareImageApiUnavailableError) {
      return IMAGE_API_TOAST
    }
    return IMAGE_CREATE_TOAST
  }

  const onDownload = async () => {
    setDownloading(true)
    try {
      const blob = await fetchShareImagePng(stats.username)
      downloadPngBlob(blob, `repo-recap-${stats.username}.png`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error('Could not create share image', reason)
      showToast(toastForImageError(error))
    } finally {
      setDownloading(false)
    }
  }

  const copyRecapLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    showToast(LINK_COPIED_TOAST)
  }

  const onShare = async () => {
    setSharing(true)
    const recapUrl = recapHref(stats.username)
    const title = `${stats.displayName}'s Repo Recap`

    const run = async () => {
      const pointerCoarse = isTouchPrimary()
      if (!pointerCoarse) {
        await copyRecapLink(recapUrl)
        return
      }

      const blob = await fetchShareImagePng(stats.username)
      const file = new File([blob], `repo-recap-${stats.username}.png`, {
        type: 'image/png',
      })
      const payload = {
        files: [file],
        title,
        text: `My Repo Recap: ${recapUrl}`,
      }
      if (
        planShareMethod(pointerCoarse, canShareFiles({ files: [file] })) ===
        'native'
      ) {
        await navigator.share(payload)
        return
      }
      await copyRecapLink(recapUrl)
    }

    try {
      const raced = await withShareTimeout(run(), SHARE_TIMEOUT_MS)
      if (raced.status === 'error') {
        if (
          raced.error instanceof ShareImageApiUnavailableError ||
          (raced.error instanceof Error &&
            raced.error.name === 'InvalidPngError')
        ) {
          showToast(toastForImageError(raced.error))
        } else {
          const message = toastForShareError(raced.error)
          if (message) showToast(message)
        }
      }
    } finally {
      setSharing(false)
    }
  }

  const previewWidth = SHARE_CARD_WIDTH * scale
  const previewHeight = SHARE_CARD_HEIGHT * scale
  const kicker = slideKicker(slideCount - 1, slideCount, 'summary')

  return (
    <section
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-5 pb-4 lg:px-10 lg:pb-5"
      aria-label={`Summary for ${stats.displayName}: ${personality.title}.`}
    >
      <div className="flex items-center justify-between pt-[max(0.85rem,env(safe-area-inset-top))] lg:hidden">
        <div className="flex w-full gap-1" aria-hidden="true">
          {Array.from({ length: slideCount }, (_, slot) => (
            <div key={slot} className="h-[3px] flex-1 rounded-full bg-[#F4EDE2]" />
          ))}
        </div>
      </div>
      <div className="mt-3 mb-4 flex items-center justify-between lg:hidden">
        <p className="font-mono text-[11px] tracking-[0.16em] text-[#F2C46D] uppercase">
          {kicker}
        </p>
        <button
          type="button"
          aria-label="Close recap"
          onClick={() => navigate('/')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4EDE2]"
        >
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-hidden lg:flex-row lg:flex-nowrap lg:gap-12">
        <div
          ref={previewHostRef}
          className="flex min-h-0 w-full max-w-[350px] flex-1 items-center justify-center lg:h-full lg:max-w-[min(440px,42vw)] lg:flex-none lg:self-stretch"
        >
          {scale > 0 ? (
            <div
              data-testid="share-card-preview"
              className="relative overflow-hidden rounded-[22px] shadow-[0_30px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10 lg:rounded-[28px]"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <div
                style={{
                  width: SHARE_CARD_WIDTH,
                  height: SHARE_CARD_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <ShareCard
                  stats={stats}
                  personality={personality}
                  avatarSrc={avatarSrc}
                  siteOrigin={origin}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex w-full max-w-[440px] shrink-0 flex-col gap-3 lg:gap-4">
          <p className="hidden font-mono text-[13px] tracking-[0.18em] text-[#F2C46D] uppercase lg:block">
            {kicker}
          </p>
          <h1 className="hidden min-w-0 font-bold tracking-[-0.03em] lg:block">
            <span className="block text-[clamp(2rem,5vh,3.25rem)] leading-[1.02]">
              That&apos;s a wrap,
            </span>
            <FittedText
              text={`${stats.displayName}.`}
              maxSize={52}
              minSize={24}
              testId="summary-heading-name"
              className="block leading-[1.02]"
            />
          </h1>
          <p className="hidden text-[15px] leading-relaxed text-[#C9BFD6] lg:block lg:text-base">
            Download your card as a 1080 × 1350 image, perfect for LinkedIn,
            Instagram or X.
          </p>
          <div className="flex gap-2.5 lg:flex-col lg:gap-3 lg:pt-1">
            <UiButton
              className="h-12 flex-1 text-base lg:h-14 lg:text-lg"
              onClick={() => void onDownload()}
              disabled={downloading || sharing}
            >
              <DownloadIcon width={20} height={20} />
              <span className="lg:hidden">{downloading ? 'Preparing…' : 'Save image'}</span>
              <span className="hidden lg:inline">
                {downloading ? 'Preparing…' : 'Download image'}
              </span>
            </UiButton>
            <UiButton
              variant="secondary"
              className="h-12 flex-1 text-base lg:h-14 lg:text-lg"
              onClick={() => void onShare()}
              disabled={sharing || downloading}
            >
              <span className="lg:hidden">
                <ShareArrowIcon width={18} height={18} />
              </span>
              <span className="hidden lg:inline">
                <LinkIcon width={20} height={20} />
              </span>
              <span className="lg:hidden">{sharing ? 'Sharing…' : 'Share'}</span>
              <span className="hidden lg:inline">
                {sharing ? 'Sharing…' : 'Copy recap link'}
              </span>
            </UiButton>
          </div>
          <button
            ref={readmeTriggerRef}
            type="button"
            data-testid="readme-open"
            onClick={() => setReadmeOpen(true)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] border border-[rgba(242,196,109,0.35)] bg-[rgba(242,196,109,0.08)] px-4 text-[15px] font-semibold text-[#F2C46D] hover:bg-[rgba(242,196,109,0.14)] lg:justify-start lg:text-base"
          >
            Add to your GitHub README
          </button>
          <button
            type="button"
            data-testid="compare-open"
            onClick={() => {
              setCompareOpen(true)
              setCompareError(null)
            }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.04] px-4 text-[15px] font-semibold text-[#F4EDE2] hover:bg-white/10 lg:justify-start lg:text-base"
          >
            Compare with someone
          </button>
          <div className="flex items-center justify-center gap-7 text-[15px] text-[#C9BFD6] lg:justify-start lg:gap-6 lg:text-base">
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex min-h-11 items-center gap-2 hover:text-[#F4EDE2]"
            >
              <RewindIcon width={18} height={18} className="hidden lg:inline" />
              Replay
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex min-h-11 items-center gap-2 hover:text-[#F4EDE2]"
            >
              <SearchIcon width={18} height={18} className="hidden lg:inline" />
              Try another username
            </button>
          </div>
        </div>
      </div>

      {toast ? (
        <p
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-center text-sm text-white"
        >
          {toast}
        </p>
      ) : null}

      <ReadmeCardDialog
        username={stats.username}
        open={readmeOpen}
        onClose={() => {
          setReadmeOpen(false)
          window.requestAnimationFrame(() => readmeTriggerRef.current?.focus())
        }}
      />

      {compareOpen ? (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-4 sm:items-center"
          data-testid="compare-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-dialog-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              setCompareOpen(false)
            }
          }}
        >
          <div className="w-full max-w-[400px] rounded-[20px] border border-white/10 bg-[#1B0A2B] p-5 shadow-2xl">
            <h2 id="compare-dialog-title" className="text-xl font-bold">
              Compare with someone
            </h2>
            <p className="mt-2 text-sm text-[#C9BFD6]">
              Put @{stats.username} side by side with another public profile.
            </p>
            <label htmlFor="compare-username" className="mt-4 block text-sm text-[#C9BFD6]">
              GitHub username
            </label>
            <input
              ref={compareInputRef}
              id="compare-username"
              value={compareUser}
              onChange={(event) => {
                setCompareUser(event.target.value)
                if (compareError) setCompareError(null)
              }}
              placeholder="gaearon"
              className="mt-2 h-12 w-full rounded-[14px] border border-white/15 bg-white/[0.06] px-4 text-[#F4EDE2] outline-none focus:border-[#F2C46D]"
            />
            {compareError ? (
              <p className="mt-2 text-sm text-[#ffc2c2]" role="alert">
                {compareError}
              </p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <UiButton
                className="flex-1"
                onClick={() => {
                  const trimmed = compareUser.trim().replace(/^@/, '')
                  if (!isValidGitHubUsername(trimmed)) {
                    setCompareError('Use a valid GitHub username.')
                    return
                  }
                  if (isSameUser(stats.username, trimmed)) {
                    setCompareError('Pick a different developer.')
                    return
                  }
                  navigate(
                    `/vs/${encodeURIComponent(stats.username)}/${encodeURIComponent(trimmed)}`,
                  )
                }}
              >
                Compare
              </UiButton>
              <UiButton
                variant="secondary"
                className="flex-1"
                onClick={() => setCompareOpen(false)}
              >
                Cancel
              </UiButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

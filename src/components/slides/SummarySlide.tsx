import * as htmlToImage from 'html-to-image'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFitScale } from '../../hooks/useFitScale'
import {
  assertPngBlob,
  downloadPngBlob,
  IMAGE_CREATE_TOAST,
  waitForExportReady,
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
import { recapHref, siteHost } from '../../lib/site'
import type { SlideProps } from '../../types'
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  ShareCard,
} from '../ShareCard'
import { UiButton } from '../UiButton'
import { Kicker, SlideShell } from './SlideShell'

export function SummarySlide({
  stats,
  personality,
  avatarSrc,
  onReplay,
}: SlideProps & { onReplay: () => void }) {
  const navigate = useNavigate()
  const exportRef = useRef<HTMLDivElement>(null)
  const { ref: previewHostRef, scale } = useFitScale(
    SHARE_CARD_WIDTH,
    SHARE_CARD_HEIGHT,
  )
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const host = siteHost()

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }

  const capturePngBlob = async (): Promise<Blob> => {
    await waitForExportReady(avatarSrc)
    const node = exportRef.current
    if (!node) throw new Error('Share card is not ready')
    const blob = await htmlToImage.toBlob(node, {
      pixelRatio: 1,
      cacheBust: true,
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      style: { transform: 'none', left: '0', position: 'relative' },
    })
    return assertPngBlob(blob)
  }

  const onDownload = async () => {
    setDownloading(true)
    try {
      const blob = await capturePngBlob()
      downloadPngBlob(blob, `repo-recap-${stats.username}.png`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error('Could not create share image', reason)
      showToast(IMAGE_CREATE_TOAST)
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

      const blob = await capturePngBlob()
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
        const message = toastForShareError(raced.error)
        if (message) showToast(message)
      }
    } finally {
      setSharing(false)
    }
  }

  const previewWidth = SHARE_CARD_WIDTH * scale
  const previewHeight = SHARE_CARD_HEIGHT * scale

  return (
    <SlideShell
      fill
      announcement={`Summary for ${stats.displayName}: ${personality.title}.`}
      gradient="bg-gradient-to-br from-[#0e1018] via-[#1a2238] to-[#2a3a5c]"
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          width: SHARE_CARD_WIDTH,
          height: SHARE_CARD_HEIGHT,
          transform: 'none',
          pointerEvents: 'none',
        }}
      >
        <div
          ref={exportRef}
          style={{ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }}
        >
          <ShareCard
            stats={stats}
            personality={personality}
            avatarSrc={avatarSrc}
            siteHost={host}
          />
        </div>
      </div>

      <div className="shrink-0">
        <Kicker>Your card</Kicker>
      </div>

      <div
        ref={previewHostRef}
        className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
      >
        {scale > 0 ? (
          <div
            data-testid="share-card-preview"
            className="relative overflow-hidden rounded-[24px] shadow-[0_24px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/15"
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
                siteHost={host}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        <UiButton
          className="py-2.5"
          onClick={() => void onDownload()}
          disabled={downloading}
        >
          {downloading ? 'Preparing…' : 'Download image'}
        </UiButton>
        <UiButton
          variant="secondary"
          className="py-2.5"
          onClick={() => void onShare()}
          disabled={sharing}
        >
          {sharing ? 'Sharing…' : 'Share'}
        </UiButton>
        <div className="flex gap-2">
          <UiButton variant="secondary" className="flex-1 py-2.5" onClick={onReplay}>
            Replay
          </UiButton>
          <UiButton
            variant="secondary"
            className="flex-1 py-2.5"
            onClick={() => navigate('/')}
          >
            Try another username
          </UiButton>
        </div>
      </div>

      {toast ? (
        <p
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-center text-sm text-white"
        >
          {toast}
        </p>
      ) : null}
    </SlideShell>
  )
}

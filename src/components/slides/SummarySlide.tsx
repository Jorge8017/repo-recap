import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [busy, setBusy] = useState<'download' | 'share' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const host = siteHost()

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }

  const capturePng = async (): Promise<string> => {
    const node = exportRef.current
    if (!node) throw new Error('Share card is not ready')
    return toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
    })
  }

  const onDownload = async () => {
    setBusy('download')
    try {
      const dataUrl = await capturePng()
      const link = document.createElement('a')
      link.download = `repo-recap-${stats.username}.png`
      link.href = dataUrl
      link.click()
    } catch {
      showToast('Could not export the image. Try again.')
    } finally {
      setBusy(null)
    }
  }

  const onShare = async () => {
    setBusy('share')
    const link = recapHref(stats.username)
    try {
      const dataUrl = await capturePng()
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `repo-recap-${stats.username}.png`, {
        type: 'image/png',
      })
      const payload = {
        files: [file],
        title: `${stats.displayName}'s Repo Recap`,
        text: `My Repo Recap: ${link}`,
      }
      if (typeof navigator.canShare === 'function' && navigator.canShare(payload)) {
        await navigator.share(payload)
        return
      }
      await navigator.clipboard.writeText(link)
      showToast('Recap link copied')
    } catch {
      try {
        await navigator.clipboard.writeText(link)
        showToast('Recap link copied')
      } catch {
        showToast('Could not share just now.')
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <SlideShell
      announcement={`Summary for ${stats.displayName}: ${personality.title}.`}
      gradient="bg-gradient-to-br from-[#0e1018] via-[#1a2238] to-[#2a3a5c]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-[-2000px]"
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

      <Kicker>Your card</Kicker>
      <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[28px] shadow-[0_24px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/15">
        <div className="aspect-[4/5]">
          <ShareCard
            stats={stats}
            personality={personality}
            avatarSrc={avatarSrc}
            siteHost={host}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <UiButton onClick={() => void onDownload()} disabled={busy !== null}>
          {busy === 'download' ? 'Preparing…' : 'Download image'}
        </UiButton>
        <UiButton
          variant="secondary"
          onClick={() => void onShare()}
          disabled={busy !== null}
        >
          {busy === 'share' ? 'Sharing…' : 'Share'}
        </UiButton>
        <div className="flex gap-2">
          <UiButton
            variant="secondary"
            className="flex-1"
            onClick={onReplay}
          >
            Replay
          </UiButton>
          <UiButton
            variant="secondary"
            className="flex-1"
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
          className="mt-3 rounded-full bg-black/40 px-4 py-2 text-center text-sm text-white"
        >
          {toast}
        </p>
      ) : null}
    </SlideShell>
  )
}

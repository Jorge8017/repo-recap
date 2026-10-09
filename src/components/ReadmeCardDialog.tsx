import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  readmeCardPath,
  readmeHint,
  readmeMarkdownSnippet,
  type ReadmeCardTheme,
} from '../lib/readmeCard'
import { LIVE_ORIGIN, siteOrigin } from '../lib/site'

interface ReadmeCardDialogProps {
  username: string
  open: boolean
  onClose: () => void
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function ReadmeCardDialog({
  username,
  open,
  onClose,
}: ReadmeCardDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const [theme, setTheme] = useState<ReadmeCardTheme>('dark')
  const [copied, setCopied] = useState(false)

  const origin =
    typeof window === 'undefined' ? LIVE_ORIGIN : siteOrigin()
  const previewSrc = readmeCardPath(username, theme)
  const snippet = readmeMarkdownSnippet(username, theme, origin)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => {
      closeRef.current?.focus()
    })
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    // Capture so StoryPlayer's Escape-to-close does not fire while open.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const nodes = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ].filter((el) => !el.hasAttribute('disabled'))
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const onBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onClick={onBackdropClick}
      data-testid="readme-dialog-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="readme-dialog"
        className="max-h-[min(90dvh,720px)] w-full max-w-[520px] overflow-y-auto rounded-[20px] border border-[rgba(244,237,226,0.14)] bg-[#1B0A2B] p-5 text-[#F4EDE2] shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:p-6"
        onKeyDown={onDialogKeyDown}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-bold tracking-tight">
            Add to your GitHub README
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-[#F4EDE2] hover:bg-white/14"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-[#C9BFD6]">Theme</span>
          <div
            className="inline-flex rounded-full bg-white/8 p-1"
            role="group"
            aria-label="Card theme"
          >
            {(['dark', 'light'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                data-testid={`readme-theme-${value}`}
                onClick={() => setTheme(value)}
                className={`rounded-full px-3.5 py-1.5 text-sm capitalize ${
                  theme === value
                    ? 'bg-[#F2C46D] font-semibold text-[#1A0B22]'
                    : 'text-[#C9BFD6] hover:text-[#F4EDE2]'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[12px] border border-[rgba(244,237,226,0.12)] bg-[#0B0812] p-3">
          <img
            src={previewSrc}
            alt={`Repo Recap card for ${username}`}
            width={495}
            height={200}
            data-testid="readme-card-preview"
            className="mx-auto h-auto w-full max-w-[495px]"
          />
        </div>

        <label className="mt-4 block text-sm text-[#C9BFD6]" htmlFor="readme-md">
          Markdown
        </label>
        <textarea
          id="readme-md"
          readOnly
          value={snippet}
          data-testid="readme-markdown"
          className="mt-1.5 min-h-[88px] w-full resize-none rounded-[12px] border border-[rgba(244,237,226,0.14)] bg-black/30 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[#F4EDE2]"
        />

        <button
          type="button"
          data-testid="readme-copy"
          onClick={() => void onCopy()}
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#F4EDE2] text-[15px] font-semibold text-[#1A0B22] hover:bg-white"
        >
          {copied ? 'Copied' : 'Copy markdown'}
        </button>

        <p className="mt-3 text-[13px] leading-relaxed text-[#C9BFD6]">
          {readmeHint(username)}
        </p>
      </div>
    </div>
  )
}

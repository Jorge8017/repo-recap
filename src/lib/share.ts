export const SHARE_TIMEOUT_MS = 15_000
export const LINK_COPIED_TOAST = 'Link copied'
export const SHARE_ERROR_TOAST = 'Could not share just now.'

export type ShareMethod = 'native' | 'clipboard'

export function isTouchPrimary(
  matchMedia: (query: string) => { matches: boolean } = (query) =>
    window.matchMedia(query),
): boolean {
  return matchMedia('(pointer: coarse)').matches
}

export function planShareMethod(
  pointerCoarse: boolean,
  canShareFiles: boolean,
): ShareMethod {
  return pointerCoarse && canShareFiles ? 'native' : 'clipboard'
}

export function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  )
}

export function toastForShareError(error: unknown): string | null {
  if (isAbortError(error)) return null
  return SHARE_ERROR_TOAST
}

export type ShareRaceResult<T> =
  | { status: 'ok'; value: T }
  | { status: 'timeout' }
  | { status: 'error'; error: unknown }

export async function withShareTimeout<T>(
  work: Promise<T>,
  timeoutMs: number = SHARE_TIMEOUT_MS,
): Promise<ShareRaceResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<ShareRaceResult<T>>((resolve) => {
    timer = setTimeout(() => resolve({ status: 'timeout' }), timeoutMs)
  })
  const workPromise: Promise<ShareRaceResult<T>> = work
    .then((value) => ({ status: 'ok' as const, value }))
    .catch((error: unknown) => ({ status: 'error' as const, error }))

  try {
    return await Promise.race([workPromise, timeoutPromise])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export { waitForExportReady as waitForCardAssets } from './downloadImage'

export function canShareFiles(
  payload: { files: File[] },
  canShare: Navigator['canShare'] | undefined = navigator.canShare?.bind(navigator),
): boolean {
  return typeof canShare === 'function' && canShare(payload)
}

import type { ReactNode } from 'react'
import type { CompareSide } from '../../lib/compare'

export function CompareSplit({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden min-[600px]:flex-row min-[600px]:gap-0">
      {children}
    </div>
  )
}

export function CompareHalf({
  side,
  winner,
  showWinnerChip,
  children,
}: {
  side: 'a' | 'b'
  winner?: CompareSide
  showWinnerChip?: boolean
  children: ReactNode
}) {
  const isWinner = showWinnerChip && winner === side
  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden px-1 min-[600px]:px-4 ${
        side === 'a'
          ? 'min-[600px]:border-r min-[600px]:border-white/10'
          : ''
      }`}
    >
      {isWinner ? (
        <span className="mb-2 inline-flex w-fit rounded-full bg-[#F2C46D]/20 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-[#F2C46D] uppercase">
          Winner
        </span>
      ) : (
        <span className="mb-2 inline-flex h-[26px]" aria-hidden="true" />
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

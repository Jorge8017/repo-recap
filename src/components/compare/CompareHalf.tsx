import type { ReactNode } from 'react'
import {
  COMPARE_COLOR_A,
  COMPARE_COLOR_B,
  type CompareSide,
  type VerdictPart,
} from '../../lib/compare'
import { CrownIcon } from '../Icons'

export function playerColor(side: 'a' | 'b'): string {
  return side === 'a' ? COMPARE_COLOR_A : COMPARE_COLOR_B
}

export function CompareSplit({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-col gap-5 min-[600px]:flex-row min-[600px]:items-stretch min-[600px]:gap-0">
      {children}
    </div>
  )
}

export function LeadsChip({
  side,
  label,
}: {
  side: 'a' | 'b'
  label: 'LEADS' | 'TIED'
}) {
  const color = playerColor(side)
  return (
    <span
      data-testid="compare-leads-chip"
      data-chip={label}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase"
      style={{ color, background: `${color}29` }}
    >
      <CrownIcon width={11} height={11} />
      {label}
    </span>
  )
}

export function PlayerAvatar({
  src,
  side,
  size = 44,
}: {
  src: string
  side: 'a' | 'b'
  size?: number
}) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="rounded-full object-cover bg-[#5B3A6E]"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 2px ${playerColor(side)}`,
      }}
    />
  )
}

export function VsBadge({ size = 72 }: { size?: number }) {
  return (
    <div
      data-testid="compare-vs"
      className="mx-auto flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-mono text-xs tracking-[0.16em] text-[#F4EDE2] uppercase"
      style={{ width: size, height: size }}
    >
      VS
    </div>
  )
}

export function VsDivider() {
  return (
    <div className="flex w-full items-center gap-3 py-1 min-[600px]:hidden">
      <div className="h-px flex-1 bg-white/15" />
      <span className="font-mono text-[11px] tracking-[0.16em] text-[#C9BFD6] uppercase">
        VS
      </span>
      <div className="h-px flex-1 bg-white/15" />
    </div>
  )
}

export function VerdictLine({
  parts,
  testId = 'compare-hero',
}: {
  parts: VerdictPart[]
  testId?: string
}) {
  return (
    <p
      data-testid={testId}
      className="text-center text-[22px] leading-snug text-[#F4EDE2]"
    >
      {parts.map((part, index) => {
        const color =
          part.tone === 'a'
            ? COMPARE_COLOR_A
            : part.tone === 'b'
              ? COMPARE_COLOR_B
              : part.tone === 'muted'
                ? '#8F84A0'
                : undefined
        return (
          <span
            key={`${part.text}-${index}`}
            className={part.tone === 'a' || part.tone === 'b' ? 'font-bold' : undefined}
            style={color ? { color } : undefined}
          >
            {part.text}
          </span>
        )
      })}
    </p>
  )
}

export function ProportionBar({
  aPercent,
  bPercent,
}: {
  aPercent: number
  bPercent: number
}) {
  return (
    <div className="w-full" data-testid="compare-proportion-bar">
      <div className="flex h-[14px] gap-[3px] overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${aPercent}%`, background: COMPARE_COLOR_A }}
        />
        <div
          className="h-full rounded-full"
          style={{ width: `${bPercent}%`, background: COMPARE_COLOR_B }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-[#C9BFD6]">
        <span>{aPercent}%</span>
        <span>{bPercent}%</span>
      </div>
    </div>
  )
}

export function SideStatus({
  side,
  winner,
  comparable,
}: {
  side: 'a' | 'b'
  winner: CompareSide
  comparable: boolean
}) {
  if (!comparable) return <span className="inline-flex h-[22px]" aria-hidden="true" />
  if (winner === 'tie') return <LeadsChip side={side} label="TIED" />
  if (winner === side) return <LeadsChip side={side} label="LEADS" />
  return <span className="inline-flex h-[22px]" aria-hidden="true" />
}

export function sideOpacity(
  side: 'a' | 'b',
  winner: CompareSide,
  comparable: boolean,
): number {
  if (!comparable || winner === 'tie' || winner === side) return 1
  return 0.55
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
        <LeadsChip side={side} label="LEADS" />
      ) : (
        <span className="mb-2 inline-flex h-[22px]" aria-hidden="true" />
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

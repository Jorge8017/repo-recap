import { useRef, type ReactNode } from 'react'
import { useFitTextOnce } from '../../hooks/useFitText'
import { CountUp } from '../CountUp'

interface HeroStatSlideProps {
  lead: string
  value: string
  unit?: string
  details?: Array<{ label: string; value: string }>
  children?: ReactNode
  /** When set, count up to this number once per visit; `value` is the final formatted text used for sizing. */
  countTo?: number
  reducedMotion?: boolean
  visitKey?: string
}

export function HeroStatSlide({
  lead,
  value,
  unit,
  details,
  children,
  countTo,
  reducedMotion = true,
  visitKey,
}: HeroStatSlideProps) {
  const sizerRef = useRef<HTMLSpanElement>(null)
  const {
    size: valueSize,
    ready: fitReady,
    reservedWidth,
  } = useFitTextOnce(sizerRef, value, 96, 40)
  const unitSize = Math.max(18, valueSize / 3)
  const items = details?.filter((item) => item.value.length > 0) ?? []

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="shrink-0">
        <p
          data-testid="hero-stat-lead"
          className="text-[24px] font-normal text-[#C9BFD6]"
        >
          {lead}
        </p>
        <div
          className="mt-2 flex min-w-0 max-w-full items-start gap-3"
          style={{ minHeight: 96 }}
        >
          <span className="relative min-w-0 flex-1 basis-0 overflow-hidden">
            <span
              ref={sizerRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 font-bold tracking-[-0.04em] whitespace-nowrap"
              style={{ fontSize: 96, visibility: 'hidden' }}
            >
              {value}
            </span>
            <span
              data-testid="hero-stat-value"
              className="inline-block max-w-full leading-none font-bold tracking-[-0.04em] text-[#F4EDE2] tabular-nums"
              style={{
                fontSize: valueSize,
                fontVariantNumeric: 'tabular-nums',
                // Avoid flashing maxSize before the final-value measure commits.
                visibility: fitReady ? 'visible' : 'hidden',
                minWidth: reservedWidth > 0 ? reservedWidth : undefined,
              }}
            >
              {countTo != null ? (
                fitReady ? (
                  <CountUp
                    value={countTo}
                    reducedMotion={reducedMotion}
                    visitKey={visitKey ?? value}
                  />
                ) : (
                  value
                )
              ) : (
                value
              )}
            </span>
          </span>
          {unit ? (
            <span
              className="shrink-0 self-end leading-none font-bold text-[#F4EDE2]"
              style={{
                fontSize: unitSize,
                marginBottom: 6,
                visibility: fitReady ? 'visible' : 'hidden',
              }}
            >
              {unit}
            </span>
          ) : null}
        </div>
        {items.length > 0 ? (
          <dl
            data-testid="hero-stat-details"
            className="mt-8 flex gap-8 border-t border-current/18 pt-4"
          >
            {items.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="font-mono text-[12px] tracking-[0.14em] text-[#C9BFD6] uppercase">
                  {item.label}
                </dt>
                <dd className="text-[22px] font-semibold break-words text-[#F4EDE2]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {children ? (
        <div className="monthly-bars-slot" data-testid="chart-slot">
          {children}
        </div>
      ) : null}
    </div>
  )
}

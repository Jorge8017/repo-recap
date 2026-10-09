import { useRef, type ReactNode } from 'react'
import { useFitText } from '../../hooks/useFitText'

interface HeroStatSlideProps {
  lead: string
  value: string
  unit?: string
  details?: Array<{ label: string; value: string }>
  children?: ReactNode
}

export function HeroStatSlide({
  lead,
  value,
  unit,
  details,
  children,
}: HeroStatSlideProps) {
  const valueRef = useRef<HTMLSpanElement>(null)
  const valueSize = useFitText(valueRef, 96, 40)
  const unitSize = Math.max(18, valueSize / 3)
  const items = details?.filter((item) => item.value.length > 0) ?? []

  return (
    <div className="w-full min-w-0">
      <p className="text-[24px] font-normal text-[#C9BFD6]">{lead}</p>
      <div className="mt-2 flex min-w-0 max-w-full items-baseline gap-3">
        <span className="min-w-0 flex-1 basis-0 overflow-hidden">
          <span
            ref={valueRef}
            data-testid="hero-stat-value"
            className="leading-none font-bold tracking-[-0.04em] text-[#F4EDE2]"
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              fontSize: valueSize,
            }}
          >
            {value}
          </span>
        </span>
        {unit ? (
          <span
            className="shrink-0 leading-none font-bold text-[#F4EDE2]"
            style={{ fontSize: unitSize }}
          >
            {unit}
          </span>
        ) : null}
      </div>
      {items.length > 0 ? (
        <dl className="mt-8 flex gap-8 border-t border-current/18 pt-4">
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
      {children}
    </div>
  )
}

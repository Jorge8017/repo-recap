interface HeroStatSlideProps {
  lead: string
  value: string
  unit?: string
  details?: Array<{ label: string; value: string }>
}

export function HeroStatSlide({
  lead,
  value,
  unit,
  details,
}: HeroStatSlideProps) {
  const compact = value.length > 6
  const items = details?.filter((item) => item.value.length > 0) ?? []

  return (
    <div className="shrink-0">
      <p className="text-[24px] font-normal text-[#C9BFD6]">{lead}</p>
      <p className="mt-2 flex items-baseline gap-3 whitespace-nowrap">
        <span
          className={`leading-none font-bold tracking-[-0.04em] text-[#F4EDE2] ${
            compact ? 'text-[72px]' : 'text-[96px]'
          }`}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-[32px] leading-none font-bold text-[#F4EDE2]">
            {unit}
          </span>
        ) : null}
      </p>
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
    </div>
  )
}

import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface LogoProps {
  size?: number
  variant?: 'dark' | 'light'
  title?: string
}

export function Logo({ size = 28, variant = 'dark', title }: LogoProps) {
  const rawId = useId()
  const gradientId = `c1-echo-${rawId.replace(/:/g, '')}`
  const chevronColor = variant === 'dark' ? '#F4EDE2' : '#1A0B22'
  const labelled = Boolean(title)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#FBDD95" />
          <stop offset="0.55" stopColor="#F2A65E" />
          <stop offset="1" stopColor="#E5664A" />
        </linearGradient>
      </defs>
      <path
        d="M19 15.5 L6 24 L19 32.5"
        fill="none"
        stroke={chevronColor}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 14.6 Q24 10.9 27.2 12.8 L41.3 21.4 Q44.3 23.3 41.3 25.2 L27.2 34 Q24 35.9 24 32.2 Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

export function BrandLink({ children = 'Repo Recap' }: { children?: ReactNode }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 text-[16px] font-bold tracking-[-0.01em] text-[#F4EDE2] no-underline"
    >
      <Logo size={30} />
      {children}
    </Link>
  )
}

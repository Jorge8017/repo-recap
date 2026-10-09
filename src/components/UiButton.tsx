import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary'

interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function UiButton({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}: UiButtonProps) {
  const palette =
    variant === 'primary'
      ? 'bg-[#F4EDE2] text-[#1A0B22] hover:bg-white'
      : 'border border-[rgba(244,237,226,0.22)] bg-white/[0.04] text-[#F4EDE2] hover:bg-white/10'

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2.5 rounded-[14px] px-5 py-3 font-semibold transition-transform duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C46D] disabled:pointer-events-none disabled:opacity-60 ${palette} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

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
      ? 'bg-[#f6efe4] text-[#1a1020] hover:bg-white'
      : 'border border-white/25 bg-white/10 text-white hover:bg-white/20'

  return (
    <button
      type={type}
      className={`rounded-full px-5 py-3 font-semibold transition-transform duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0c27a] disabled:pointer-events-none disabled:opacity-60 ${palette} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

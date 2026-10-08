import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#07060c]">
      <div className="relative h-dvh min-h-dvh w-full max-w-[430px] overflow-hidden shadow-[0_0_80px_rgba(80,40,90,0.35)]">
        {children}
      </div>
    </div>
  )
}

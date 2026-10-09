import type { PersonalityId } from '../types'

const GOLD = '#F2C46D'

interface PersonalityIconProps {
  id: PersonalityId
  size?: number
}

export function PersonalityIcon({ id, size = 64 }: PersonalityIconProps) {
  const svg = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'night-owl':
      return (
        <svg {...svg} fill={GOLD}>
          <path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.6 6.6 0 0 0 10.8 10.8z" />
        </svg>
      )
    case 'ghost-mode':
      return (
        <svg {...svg} fill="none" stroke={GOLD} strokeWidth="1.7" strokeLinejoin="round">
          <path d="M5 9.2a7 7 0 0 1 14 0V20.8l-3.5-2.4-3.5 2.4-3.5-2.4L5 20.8z" />
          <circle cx="9.4" cy="11.4" r="1.15" fill={GOLD} stroke="none" />
          <circle cx="14.6" cy="11.4" r="1.15" fill={GOLD} stroke="none" />
        </svg>
      )
    case 'polyglot':
      return (
        <svg {...svg} fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinejoin="round">
          <path d="M4.5 6.5h10.5a1.8 1.8 0 0 1 1.8 1.8v5.2a1.8 1.8 0 0 1-1.8 1.8H9.5L5 18.2V8.3A1.8 1.8 0 0 1 6.8 6.5z" />
          <path d="M16 9.2h3.2A1.6 1.6 0 0 1 20.8 10.8v4.4a1.6 1.6 0 0 1-1.6 1.6h-1.4v2.1l-2.6-2.1" />
        </svg>
      )
    case 'weekend-warrior':
      return (
        <svg
          {...svg}
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5.5v2.2M7.4 7.4l1.4 1.4M16.6 7.4l-1.4 1.4M5 12.5h2.2M16.8 12.5H19" />
          <path d="M8.2 16.2a5 5 0 0 1 7.6 0" />
          <path d="M3.8 19.2h16.4" />
        </svg>
      )
    case 'star-collector':
      return (
        <svg {...svg} fill={GOLD}>
          <path d="M12 3.2l2.15 6.5h6.85l-5.55 4.05 2.12 6.55L12 16.35 6.43 20.3l2.12-6.55L3 9.7h6.85z" />
        </svg>
      )
    case 'marathon-coder':
      return (
        <svg {...svg} fill={GOLD}>
          <path d="M12 3.2c2.4 3.6 1.1 5.8 1.1 7.6 0 1.2.7 2.2 2.4 3A5.7 5.7 0 1 1 8.2 9.4c1.7.1 2.6-1.6 3.8-6.2z" />
        </svg>
      )
    case 'builder':
      return (
        <svg {...svg} fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinejoin="round">
          <rect x="4" y="14.2" width="16" height="5.2" rx="1" />
          <rect x="7" y="8.4" width="10" height="4.8" rx="1" />
          <rect x="9.4" y="3.4" width="5.2" height="4.2" rx="1" />
        </svg>
      )
  }
}

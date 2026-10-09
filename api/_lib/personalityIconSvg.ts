import type { PersonalityId } from '../../src/types.js'

/** Inline SVG mark for a personality, positioned at (x, y) with given size. */
export function personalityIconMarkup(
  id: PersonalityId,
  color: string,
  size: number,
  x: number,
  y: number,
): string {
  const scale = size / 24
  const common = `transform="translate(${x} ${y}) scale(${scale})"`

  switch (id) {
    case 'night-owl':
      return `<g ${common} fill="${color}"><path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.6 6.6 0 0 0 10.8 10.8z"/></g>`
    case 'ghost-mode':
      return `<g ${common} fill="none" stroke="${color}" stroke-width="1.7" stroke-linejoin="round"><path d="M5 9.2a7 7 0 0 1 14 0V20.8l-3.5-2.4-3.5 2.4-3.5-2.4L5 20.8z"/><circle cx="9.4" cy="11.4" r="1.15" fill="${color}" stroke="none"/><circle cx="14.6" cy="11.4" r="1.15" fill="${color}" stroke="none"/></g>`
    case 'polyglot':
      return `<g ${common} fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><path d="M4.5 6.5h10.5a1.8 1.8 0 0 1 1.8 1.8v5.2a1.8 1.8 0 0 1-1.8 1.8H9.5L5 18.2V8.3A1.8 1.8 0 0 1 6.8 6.5z"/><path d="M16 9.2h3.2A1.6 1.6 0 0 1 20.8 10.8v4.4a1.6 1.6 0 0 1-1.6 1.6h-1.4v2.1l-2.6-2.1"/></g>`
    case 'weekend-warrior':
      return `<g ${common} fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.5v2.2M7.4 7.4l1.4 1.4M16.6 7.4l-1.4 1.4M5 12.5h2.2M16.8 12.5H19"/><path d="M8.2 16.2a5 5 0 0 1 7.6 0"/><path d="M3.8 19.2h16.4"/></g>`
    case 'star-collector':
      return `<g ${common} fill="${color}"><path d="M12 3.2l2.15 6.5h6.85l-5.55 4.05 2.12 6.55L12 16.35 6.43 20.3l2.12-6.55L3 9.7h6.85z"/></g>`
    case 'marathon-coder':
      return `<g ${common} fill="${color}"><path d="M12 3.2c2.4 3.6 1.1 5.8 1.1 7.6 0 1.2.7 2.2 2.4 3A5.7 5.7 0 1 1 8.2 9.4c1.7.1 2.6-1.6 3.8-6.2z"/></g>`
    case 'builder':
      return `<g ${common} fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="14.2" width="16" height="5.2" rx="1"/><rect x="7" y="8.4" width="10" height="4.8" rx="1"/><rect x="9.4" y="3.4" width="5.2" height="4.2" rx="1"/></g>`
  }
}

export function c1LogoMarkup(
  x: number,
  y: number,
  size: number,
  chevronColor = '#F4EDE2',
): string {
  const scale = size / 48
  return `<g transform="translate(${x} ${y}) scale(${scale})">
  <defs>
    <linearGradient id="c1CardGrad" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#FBDD95"/>
      <stop offset="0.55" stop-color="#F2A65E"/>
      <stop offset="1" stop-color="#E5664A"/>
    </linearGradient>
  </defs>
  <path d="M19 15.5 L6 24 L19 32.5" fill="none" stroke="${chevronColor}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24 14.6 Q24 10.9 27.2 12.8 L41.3 21.4 Q44.3 23.3 41.3 25.2 L27.2 34 Q24 35.9 24 32.2 Z" fill="url(#c1CardGrad)"/>
</g>`
}

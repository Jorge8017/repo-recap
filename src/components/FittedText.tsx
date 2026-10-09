import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useFitTextOnce } from '../hooks/useFitText'

interface FittedTextProps {
  text: string
  maxSize: number
  minSize: number
  wrapAtMin?: boolean
  as?: ElementType
  className?: string
  style?: CSSProperties
  testId?: string
  children?: ReactNode
}

/**
 * Renders `text` at a font-size fitted once from a hidden final-value sizer.
 * Visible content stays hidden until that measure commits, so callers never
 * flash maxSize then snap.
 */
export function FittedText({
  text,
  maxSize,
  minSize,
  wrapAtMin = false,
  as: Tag = 'span',
  className = '',
  style,
  testId,
  children,
}: FittedTextProps) {
  const sizerRef = useRef<HTMLSpanElement>(null)
  const { size, ready, reservedWidth, wrap } = useFitTextOnce(
    sizerRef,
    text,
    maxSize,
    minSize,
    wrapAtMin,
  )

  return (
    <span className="relative block min-w-0 max-w-full">
      <span
        ref={sizerRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 font-bold whitespace-nowrap"
        style={{
          fontSize: maxSize,
          visibility: 'hidden',
          letterSpacing: style?.letterSpacing,
        }}
      >
        {text}
      </span>
      <Tag
        data-testid={testId}
        className={`min-w-0 max-w-full ${className}`}
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          whiteSpace: wrap ? 'normal' : 'nowrap',
          overflowWrap: wrap ? 'anywhere' : undefined,
          fontSize: size,
          visibility: ready ? 'visible' : 'hidden',
          minWidth: !wrap && reservedWidth > 0 ? reservedWidth : undefined,
          ...style,
        }}
      >
        {children ?? text}
      </Tag>
    </span>
  )
}

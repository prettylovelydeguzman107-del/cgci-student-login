import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { buttonClassName, type ButtonVariant } from './buttonStyles'

export type { ButtonVariant }

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  block?: boolean
  loading?: boolean
  /** Announced by screen readers while `loading` is true. */
  loadingLabel?: string
  children: ReactNode
}

/**
 * The one button in the app. `loading` both disables the control and swaps in a
 * spinner, which is what prevents the duplicate-submission problem.
 */
export function Button({
  variant = 'primary',
  block = false,
  loading = false,
  loadingLabel,
  disabled = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={buttonClassName(variant, { block, loading, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner size="sm" /> : null}
      <span>{children}</span>
      {loading && loadingLabel !== undefined ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Progress indicator. Announced as a live status for assistive technology, so
 * callers that provide their own text should pass `decorative` instead.
 */
export function Spinner({ size = 'md', className, decorative = false }: SpinnerProps & { decorative?: boolean }) {
  if (decorative) {
    return <span className={['spinner', `spinner--${size}`, className].filter(Boolean).join(' ')} />
  }

  return (
    <span
      className={['spinner', `spinner--${size}`, className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading"
    />
  )
}
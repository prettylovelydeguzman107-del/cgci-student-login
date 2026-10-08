import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import { buttonClassName, type ButtonVariant } from './buttonStyles'

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
  block?: boolean
  className?: string
  children: ReactNode
}

/**
 * A navigation target that looks like a button.
 *
 * Preferred over wrapping a `<button>` inside a `<Link>`: anchors cannot be
 * disabled, and nesting interactive elements confuses both keyboard navigation
 * and screen readers.
 */
export function LinkButton({ variant = 'primary', block = false, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link {...rest} className={buttonClassName(variant, { block, className })}>
      {children}
    </Link>
  )
}
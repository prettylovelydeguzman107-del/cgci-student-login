/**
 * Button styling shared by {@link Button} and {@link LinkButton}.
 *
 * Kept apart from the component module so that a navigation anchor can reuse
 * the same class composition without importing the button implementation.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'on-dark'

export interface ButtonStyleOptions {
  block?: boolean
  loading?: boolean
  className?: string | undefined
}

export function buttonClassName(variant: ButtonVariant, options: ButtonStyleOptions = {}): string {
  const classes = [
    'btn',
    `btn--${variant}`,
    options.block === true ? 'btn--block' : '',
    options.loading === true ? 'btn--loading' : '',
    options.className,
  ]
  return classes.filter(Boolean).join(' ')
}
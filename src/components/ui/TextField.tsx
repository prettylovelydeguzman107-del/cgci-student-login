import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: ReactNode
  error?: string | undefined
  /** Leading decorative icon; hidden from assistive technology. */
  icon?: ReactNode
  /** Trailing control, e.g. the password reveal button. */
  trailing?: ReactNode
  /** Visually de-emphasise the label while keeping it available to screen readers. */
  optionalLabel?: string | undefined
}

/**
 * Labelled input with wired-up `aria-describedby` / `aria-invalid`.
 *
 * The error message is associated through `aria-describedby` rather than
 * `aria-live` so it is announced when the field receives focus, which is when
 * a student who just failed validation needs it.
 */
export function TextField({
  label,
  hint,
  error,
  icon,
  trailing,
  optionalLabel,
  className,
  ...rest
}: TextFieldProps) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const describedBy = [hint !== undefined ? hintId : null, error !== undefined ? errorId : null]
    .filter(Boolean)
    .join(' ')

  const classes = [
    'field__input',
    error !== undefined ? 'field__input--invalid' : '',
    trailing !== undefined ? 'field__input--with-trailing' : '',
    icon !== undefined ? 'field__input--with-leading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        <span>{label}</span>
        {optionalLabel !== undefined ? <span className="field__optional">{optionalLabel}</span> : null}
      </label>

      <div className="field__control">
        {icon !== undefined ? (
          <span className="field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <input
          {...rest}
          id={inputId}
          className={classes}
          aria-invalid={error !== undefined ? true : undefined}
          aria-describedby={describedBy === '' ? undefined : describedBy}
        />

        {trailing}
      </div>

      {hint !== undefined ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error !== undefined ? (
        <p className="field__error" id={errorId}>
          <svg
            className="field__error-icon"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4.2M8 11.1v.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
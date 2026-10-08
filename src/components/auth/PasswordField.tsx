import { useState } from 'react'

import { TextField } from '../ui/TextField'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | undefined
  hint?: string | undefined
  autoComplete?: string
  disabled?: boolean
  placeholder?: string | undefined
  required?: boolean
}

/**
 * Password input with a visibility toggle.
 *
 * The toggle is a real <button type="button"> rather than a styled span so it
 * is reachable by keyboard, and it carries `aria-pressed` plus an accessible
 * name so a screen-reader user knows whether the password is currently shown.
 */
export function PasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = 'current-password',
  disabled = false,
  placeholder,
  required = true,
}: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <TextField
      label={label}
      type={revealed ? 'text' : 'password'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      hint={hint}
      autoComplete={autoComplete}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      name="password"
      spellCheck={false}
      trailing={
        <button
          type="button"
          className="field__trailing"
          onClick={() => setRevealed((current) => !current)}
          aria-pressed={revealed}
          disabled={disabled}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
          <span className="sr-only">{revealed ? 'Hide password' : 'Show password'}</span>
        </button>
      }
    />
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M1.8 10S4.7 4.9 10 4.9 18.2 10 18.2 10 15.3 15.1 10 15.1 1.8 10 1.8 10z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 5.3A8 8 0 0 1 10 4.9c5.3 0 8.2 5.1 8.2 5.1a15 15 0 0 1-2.4 3.1M12.4 13.9a8 8 0 0 1-2.4.3c-5.3 0-8.2-5.1-8.2-5.1a15 15 0 0 1 3.4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
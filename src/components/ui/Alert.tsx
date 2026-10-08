import type { FeedbackTone } from '../../types/auth'

interface AlertProps {
  tone: FeedbackTone | 'warning'
  title: string
  message?: string
  /** Optional trailing action, e.g. "Forgot password?". */
  action?: { label: string; onClick: () => void }
}

/**
 * Status message.
 *
 * Success and failure are never signalled by colour alone — each carries an
 * icon, an explicit title ("Login successful" / "Unable to sign in"), and a
 * `role` that announces it. Errors use `role="alert"` for an assertive
 * announcement; successes use `role="status"` so they do not interrupt.
 */
export function Alert({ tone, title, message, action }: AlertProps) {
  const icon = tone === 'success' ? <SuccessIcon /> : tone === 'error' ? <ErrorIcon /> : <InfoIcon />

  return (
    <div
      className={`alert alert--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <span className="alert__icon" aria-hidden="true">
        {icon}
      </span>

      <div className="alert__body">
        <p className="alert__title">{title}</p>
        {message !== undefined ? <p className="alert__message">{message}</p> : null}
        {action !== undefined ? (
          <p style={{ marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn--ghost" onClick={action.onClick}>
              {action.label}
            </button>
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SuccessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.4 10.3l2.4 2.4 4.8-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 5.8v4.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.95" fill="currentColor" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9.2v4.9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10" cy="6.6" r="0.95" fill="currentColor" />
    </svg>
  )
}
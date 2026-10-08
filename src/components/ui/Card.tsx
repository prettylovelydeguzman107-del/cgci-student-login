import type { AccountStatus } from '../../types/student'
import { ACCOUNT_STATUS_LABELS } from '../../types/student'

interface StatusBadgeProps {
  status: AccountStatus
  /** Appends an accessible description of the status. */
  withDescription?: boolean
}

export function StatusBadge({ status, withDescription = false }: StatusBadgeProps) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden="true" />
      <span>
        {ACCOUNT_STATUS_LABELS[status]}
        {withDescription ? <span className="sr-only"> account status</span> : null}
      </span>
    </span>
  )
}

interface CardProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  flush?: boolean
  footer?: React.ReactNode
  children: React.ReactNode
}

export function Card({ title, subtitle, icon, flush = false, footer, children }: CardProps) {
  return (
    <section className={`card${flush ? ' card--flush' : ''}`}>
      <header className="card__header">
        {icon !== undefined ? (
          <span className="card__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="card__heading">{title}</h2>
          {subtitle !== undefined ? <p className="card__subtitle">{subtitle}</p> : null}
        </div>
      </header>
      <div className="card__body">{children}</div>
      {footer !== undefined ? <div className="card__footer">{footer}</div> : null}
    </section>
  )
}
import { Link } from 'react-router-dom'

import { Wordmark } from './Wordmark'
import { INSTITUTION_NAME, PORTAL_NAME, PROJECT_COURSE, formatDeveloperCredit } from '../../config/project'

interface PortalFooterProps {
  /**
   * Secondary navigation shown only on signed-in pages. Public screens omit it
   * because the footer there must not link to routes that redirect away.
   */
  links?: ReadonlyArray<{ to: string; label: string }>
  /** Marks the footer as belonging to the dark institutional panel. */
  variant?: 'light' | 'dark'
}

/**
 * Institutional footer carrying the project credit.
 *
 * Rendered on every screen — signed in and signed out — so the developers are
 * credited on the login page a visitor sees first, not only after sign-in.
 */
export function PortalFooter({ links = [], variant = 'light' }: PortalFooterProps) {
  return (
    <footer className={`app-footer app-footer--${variant}`}>
      <div className="app-footer__inner">
        <div className="app-footer__brand">
          <Wordmark compact />
          <p className="app-footer__tagline">
            {INSTITUTION_NAME} · {PORTAL_NAME} Authentication
          </p>
        </div>

        {links.length > 0 ? (
          <nav className="app-footer__links" aria-label="Footer">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      <p className="app-footer__credit">
        <span className="app-footer__credit-label">Developed by</span>{' '}
        <span className="app-footer__credit-names">{formatDeveloperCredit()}</span>
        <span className="app-footer__credit-sep" aria-hidden="true">
          ·
        </span>
        <span className="app-footer__credit-course">{PROJECT_COURSE}</span>
      </p>
    </footer>
  )
}

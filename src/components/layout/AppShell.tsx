import { NavLink, Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Wordmark } from './Wordmark'
import { PortalFooter } from './PortalFooter'
import { useAuth } from '../../hooks/useAuth'
import { initials } from '../../utils/format'

/**
 * App shell for authenticated screens.
 *
 * Navigation is always rendered — no disclosure menu — because there are only
 * two destinations. On small screens it moves to its own full-width row under
 * the brand, which keeps both tabs reachable by thumb without JavaScript.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="appbar">
        <div className="appbar__row">
          <Link to="/dashboard" aria-label="CGCI Student Portal — dashboard">
            <Wordmark />
          </Link>

          <div className="appbar__spacer" />

          {profile !== null ? (
            <div className="appbar__identity">
              <span className="appbar__avatar" aria-hidden="true">
                {initials(profile.fullName)}
              </span>
              <span className="appbar__identity-text">
                <span className="appbar__identity-name">{profile.fullName}</span>
                <span className="appbar__identity-id">{profile.studentId}</span>
              </span>
            </div>
          ) : null}

          <button type="button" className="appbar__signout" onClick={() => void signOut()}>
            <SignOutIcon />
            <span className="appbar__signout-label">Log out</span>
            <span className="sr-only">and end this session</span>
          </button>
        </div>

        <nav className="appnav" aria-label="Portal">
          <ul className="appnav__list">
            <li>
              <NavLink className="appnav__link" to="/dashboard">
                <DashboardIcon />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink className="appnav__link" to="/profile">
                <ProfileIcon />
                Profile
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <main className="page" id="main-content">
        {children}
      </main>

      <PortalFooter
        links={[
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/profile', label: 'Profile' },
        ]}
      />
    </div>
  )
}

function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12 5.5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 4 4v12a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 12 16v-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 10H16m0 0-2.6-2.6M16 10l-2.6 2.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg className="appnav__icon" width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.8" y="2.8" width="6.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.8" width="6.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.8" y="11" width="6.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="appnav__icon" width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.6" r="3.1" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.4 16.4c.5-2.7 2.8-4.4 5.6-4.4s5.1 1.7 5.6 4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
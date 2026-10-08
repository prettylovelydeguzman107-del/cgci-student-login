import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { BootScreen } from '../components/layout/BootScreen'

/**
 * Route guard for unauthenticated screens.
 *
 * A student who is already signed in has no business on the login form, so
 * they are sent to the dashboard. `initializing` renders the boot screen for
 * the same reason as in {@link ProtectedRoute}.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'initializing') return <BootScreen />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

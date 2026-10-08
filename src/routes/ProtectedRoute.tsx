import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { BootScreen } from '../components/layout/BootScreen'

/**
 * Route guard for authenticated screens.
 *
 * While Firebase is restoring an existing session the guard renders a neutral
 * boot screen rather than redirecting. Redirecting during `initializing` is
 * what produces the flash of the login page on every hard refresh, which is
 * both ugly and misleading — it tells a signed-in student that they are signed
 * out.
 *
 * This guard is user-experience only. The actual protection of the student
 * records is Firestore Security Rules, which hold even if a request is forged.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'initializing') return <BootScreen />

  if (status === 'unauthenticated') {
    // Remember where the student was heading so sign-in can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <>{children}</>
}

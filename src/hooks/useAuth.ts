import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '../contexts/authStore'

export type { AuthContextValue, AuthStatus, ProfileStatus, SignInResult } from '../contexts/authStore'

/**
 * Access to the authentication state.
 * Throws when used outside {@link AuthProvider} so a misplaced provider fails
 * loudly in development instead of silently rendering an unauthenticated app.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
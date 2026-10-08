/**
 * The authentication context object and its value shape.
 *
 * Kept in its own module so that `AuthContext.tsx` exports nothing but a
 * component. Mixing the two disables React Fast Refresh for the provider, which
 * is a needless tax during development.
 */

import { createContext } from 'react'
import type { User } from 'firebase/auth'

import type { CredentialRegistry, LoginEvaluation } from '../domain/credentialAlgebra'
import type { Feedback } from '../types/auth'
import type { StudentProfile } from '../types/student'

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated'

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export interface SignInResult {
  readonly ok: boolean
  /** Present when `ok` is false. */
  readonly title?: string
  readonly message?: string
  /** Formal evaluation of `LoginSuccess(u, p)` for this attempt. */
  readonly evaluation: LoginEvaluation
}

export interface AuthContextValue {
  readonly status: AuthStatus
  readonly user: User | null
  readonly profile: StudentProfile | null
  readonly profileStatus: ProfileStatus
  readonly feedback: Feedback | null
  readonly registry: CredentialRegistry | null
  /** Formal evaluation of the most recent attempt, kept across the redirect. */
  readonly evaluation: LoginEvaluation | null
  readonly signIn: (identifier: string, password: string) => Promise<SignInResult>
  readonly signOut: () => Promise<void>
  readonly sendPasswordReset: (identifier: string) => Promise<boolean>
  readonly setFeedback: (feedback: Feedback | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
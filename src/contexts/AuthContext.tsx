/**
 * Centralised authentication state.
 *
 * Explicitly models the three states the specification calls for —
 * `initializing`, `authenticated`, `unauthenticated` — because collapsing the
 * first one into the third is what produces the classic "logged out flash"
 * before Firebase finishes restoring an existing session.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'

import { AuthContext, type AuthContextValue, type SignInResult } from './authStore'
import { evaluateLogin, type CredentialRegistry, type LoginEvaluation } from '../domain/credentialAlgebra'
import { resolveAuthEmail } from '../domain/identifier'
import {
  observeAuthState,
  requestPasswordReset,
  signInWithCredentials,
  signOutCurrentUser,
} from '../services/authService'
import { configureSessionPersistence } from '../services/firebase'
import { StudentRecordNotFoundError, fetchStudentProfile, stampLastSignIn } from '../services/studentService'
import { loadCredentialRegistry } from '../services/directoryService'
import type { Feedback } from '../types/auth'
import type { StudentProfile } from '../types/student'
import { authFailureFor, describeAuthFailure, isOffline } from '../utils/authErrors'
import { debugLog, debugWarn } from '../utils/logger'

/** Outcome of loading one student's private record. */
type ProfileOutcome =
  | { readonly profile: StudentProfile }
  | { readonly failure: 'missing' | 'error' }

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [status, setStatus] = useState<'initializing' | 'authenticated' | 'unauthenticated'>('initializing')
  const [user, setUser] = useState<User | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [registry, setRegistry] = useState<CredentialRegistry | null>(null)
  const [evaluation, setEvaluation] = useState<LoginEvaluation | null>(null)

  /**
   * Loaded records, keyed by Firebase UID.
   *
   * Keying rather than storing one value means a sign-in by a different account
   * can never briefly display the previous student's data, and the loading
   * state is derived during render instead of being pushed with a synchronous
   * `setState` inside the effect.
   */
  const [profiles, setProfiles] = useState<Record<string, ProfileOutcome>>({})

  useEffect(() => {
    let cancelled = false

    void configureSessionPersistence()

    const unsubscribe = observeAuthState((nextUser) => {
      if (cancelled) return
      setUser(nextUser)
      setStatus(nextUser === null ? 'unauthenticated' : 'authenticated')
    })

    void loadCredentialRegistry().then((loaded) => {
      if (!cancelled) setRegistry(loaded)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  // Load the private student record whenever a session becomes active.
  useEffect(() => {
    if (user === null) return

    const uid = user.uid
    let cancelled = false

    void fetchStudentProfile(uid)
      .then((profile) => {
        if (cancelled) return
        setProfiles((current) => ({ ...current, [uid]: { profile } }))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        debugWarn('auth', `Could not load the student record for ${uid}`, error)
        const failure: ProfileOutcome = {
          failure: error instanceof StudentRecordNotFoundError ? 'missing' : 'error',
        }
        setProfiles((current) => ({ ...current, [uid]: failure }))
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const outcome = user === null ? undefined : profiles[user.uid]

  const profileStatus: AuthContextValue['profileStatus'] =
    user === null ? 'idle' : outcome === undefined ? 'loading' : 'failure' in outcome ? outcome.failure : 'ready'

  const profile = outcome !== undefined && 'profile' in outcome ? outcome.profile : null

  const signIn = useCallback(
    async (identifier: string, password: string): Promise<SignInResult> => {
      const email = resolveAuthEmail(identifier)
      const activeRegistry = registry ?? (await loadCredentialRegistry())
      const username = identifier.trim()

      let relationMembership = false
      let failure: { title: string; message: string } | null = null

      try {
        const credentialUser = await signInWithCredentials(email, password)
        relationMembership = true

        // The password is now verified, but access also depends on the account
        // state held in Firestore. Checking it here keeps the rejection on the
        // login screen instead of half-way into the portal.
        try {
          const record = await fetchStudentProfile(credentialUser.uid)

          if (record.status !== 'active') {
            const mapped = authFailureFor(
              record.status === 'disabled' ? 'account-disabled' : 'account-pending',
            )
            await signOutCurrentUser()
            relationMembership = false
            failure = { title: mapped.title, message: mapped.message }
          } else {
            void stampLastSignIn(credentialUser.uid)
          }
        } catch (error) {
          // Authenticated, but no usable student record: end the session so the
          // student is never left in a half-authenticated state.
          await signOutCurrentUser()
          relationMembership = false
          debugWarn('auth', 'Sign-in succeeded but the student record is unusable', error)
          const mapped = authFailureFor('missing-profile')
          failure = { title: mapped.title, message: mapped.message }
        }
      } catch (error) {
        relationMembership = false
        const mapped = describeAuthFailure(error)
        failure = { title: mapped.title, message: mapped.message }
        debugLog('auth', `Sign-in failed (${mapped.reason}/${isOffline(error) ? 'offline' : 'online'})`, error)
      }

      const result = evaluateLogin(username, relationMembership, activeRegistry)
      setEvaluation(result)

      if (failure !== null) {
        setFeedback({ tone: 'error', title: failure.title, message: failure.message })
        return { ok: false, title: failure.title, message: failure.message, evaluation: result }
      }

      setFeedback({
        tone: 'success',
        title: 'Login successful',
        message: 'Redirecting to your student portal…',
      })
      return { ok: true, evaluation: result }
    },
    [registry],
  )

  const signOut = useCallback(async (): Promise<void> => {
    await signOutCurrentUser()
    setProfiles({})
    setEvaluation(null)
    setFeedback(null)
  }, [])

  const sendPasswordReset = useCallback(async (identifier: string): Promise<boolean> => {
    try {
      await requestPasswordReset(resolveAuthEmail(identifier))
      setFeedback({
        tone: 'success',
        title: 'Reset link sent',
        message:
          'If that account exists, a password reset link is on its way. Check your inbox, including the spam folder.',
      })
      return true
    } catch (error) {
      const mapped = describeAuthFailure(error)
      debugLog('auth', `Password reset request failed (${mapped.reason})`, error)
      // Deliberately does not confirm whether the account exists.
      setFeedback({
        tone: 'error',
        title: 'Could not send the reset link',
        message:
          'We could not process that request. Please confirm your Student ID and try again, or contact the registrar’s office.',
      })
      return false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      profileStatus,
      feedback,
      registry,
      evaluation,
      signIn,
      signOut,
      sendPasswordReset,
      setFeedback,
    }),
    [
      status,
      user,
      profile,
      profileStatus,
      feedback,
      registry,
      evaluation,
      signIn,
      signOut,
      sendPasswordReset,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
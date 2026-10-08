/**
 * Firebase error codes → copy a student can act on.
 *
 * Two rules drive this module:
 *
 *  1. Never leak a raw code or Firebase message into the UI. Students are not
 *     debugging Identity Platform, and raw codes invite enumeration probing.
 *
 *  2. Never distinguish "no such account" from "wrong password" in what the
 *     user sees. Both collapse to the same generic message so the login form
 *     cannot be used to discover which student IDs exist.
 */

import type { AuthFailure, AuthFailureReason } from '../types/auth'

interface FailureCopy {
  readonly title: string
  readonly message: string
}

const COPY: Record<AuthFailureReason, FailureCopy> = {
  'invalid-credentials': {
    title: 'Unable to sign in',
    message: 'The student ID or password you entered is incorrect. Please check your credentials and try again.',
  },
  'unknown-account': {
    // Rendered with the same wording as invalid-credentials on purpose; kept as a
    // distinct reason so logs can tell the two apart during the demo.
    title: 'Unable to sign in',
    message: 'The student ID or password you entered is incorrect. Please check your credentials and try again.',
  },
  'account-disabled': {
    title: 'Account suspended',
    message:
      'This student account has been disabled. Please visit the CGCI registrar’s office to have your account reactivated.',
  },
  'account-pending': {
    title: 'Account not yet verified',
    message:
      'This student account is still awaiting verification. Please complete registration before signing in.',
  },
  'missing-profile': {
    title: 'Student record not found',
    message:
      'Your sign-in was successful, but no student record is linked to this account. Please contact the CGCI registrar’s office.',
  },
  'too-many-requests': {
    title: 'Too many attempts',
    message:
      'Too many failed sign-in attempts were made from this device. Please wait a few minutes before trying again.',
  },
  'network-unavailable': {
    title: 'No internet connection',
    message:
      'We could not reach the CGCI authentication server. Please check your internet connection and try again.',
  },
  'service-unavailable': {
    title: 'Service temporarily unavailable',
    message:
      'The CGCI authentication service is not responding at the moment. Please try again in a few minutes.',
  },
  'session-expired': {
    title: 'Session expired',
    message: 'Your session has ended. Please sign in again to continue.',
  },
  unexpected: {
    title: 'Something went wrong',
    message:
      'An unexpected error occurred while signing you in. Please try again, and contact the registrar if the problem continues.',
  },
}

/** Build a presentation-ready failure directly from a known reason. */
export function authFailureFor(reason: AuthFailureReason): AuthFailure {
  return { reason, ...COPY[reason], debug: reason }
}

/** Error codes surfaced by the Firebase JS SDK v10+ and Identity Platform. */
const CODE_REASONS: Record<string, AuthFailureReason> = {
  'auth/invalid-credential': 'invalid-credentials',
  'auth/invalid-email': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/user-not-found': 'unknown-account',
  'auth/user-disabled': 'account-disabled',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network-unavailable',
  'auth/internal-error': 'service-unavailable',
  'auth/operation-not-allowed': 'service-unavailable',
  'auth/requires-recent-login': 'session-expired',
  'auth/missing-password': 'invalid-credentials',
}

function readFirebaseCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

export function isOffline(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const code = readFirebaseCode(error)
  return code === 'auth/network-request-failed'
}

/**
 * Translate any thrown value into a presentation-ready failure.
 * Always returns something: an unrecognised error becomes `unexpected` rather
 * than propagating raw internals to the interface.
 */
export function describeAuthFailure(error: unknown): AuthFailure {
  const code = readFirebaseCode(error)

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return authFailureFor('network-unavailable')
  }

  const reason = code !== undefined ? CODE_REASONS[code] : undefined

  if (reason !== undefined) {
    return { reason, ...COPY[reason], debug: code ?? 'unknown' }
  }

  const message = error instanceof Error ? error.message : String(error)
  return { reason: 'unexpected', ...COPY.unexpected, debug: message }
}

export const GENERIC_CREDENTIAL_FAILURE = authFailureFor('invalid-credentials')
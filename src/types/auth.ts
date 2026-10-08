/** Outcome of an authentication attempt, in terms the user can act on. */

export type FeedbackTone = 'success' | 'error' | 'info'

export interface Feedback {
  readonly tone: FeedbackTone
  readonly title: string
  readonly message: string
}

/**
 * Every failure mode the login flow can reach, already reduced to copy a
 * student can understand. Raw Firebase error codes never reach the UI.
 */
export type AuthFailureReason =
  | 'invalid-credentials'
  | 'unknown-account'
  | 'account-disabled'
  | 'account-pending'
  | 'missing-profile'
  | 'too-many-requests'
  | 'network-unavailable'
  | 'service-unavailable'
  | 'session-expired'
  | 'unexpected'

export interface AuthFailure {
  readonly reason: AuthFailureReason
  readonly title: string
  readonly message: string
  /** Technical detail, retained for the debug console only. */
  readonly debug: string
}
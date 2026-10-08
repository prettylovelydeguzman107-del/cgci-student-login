/**
 * Firebase Authentication access.
 *
 * This layer is the sole owner of the credential relation `R`. Nothing in the
 * application ever inspects, stores, or derives a password.
 */

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'

import { auth } from './firebase'

/**
 * Subscribe to session changes. Fires once with the restored session (or null)
 * before any subsequent change, which is how the app avoids flashing the login
 * screen while Firebase re-establishes state.
 */
export function observeAuthState(handler: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, handler)
}

export async function signInWithCredentials(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOutCurrentUser(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Email addresses are progressively masked by Firebase for accounts that have
 * not signed in since masking was enabled, so `user.email` can be absent even
 * for a signed-in user. Treat that as "not yet provided" rather than an error.
 */
export function readVerifiedEmail(user: User): string | null {
  return user.emailVerified && user.email !== null ? user.email : null
}
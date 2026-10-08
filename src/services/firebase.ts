/**
 * Firebase initialisation.
 *
 * The configuration is read from Vite environment variables so the same
 * bundle can be pointed at different Firebase projects without code changes.
 * Values come from the Firebase Console web-app SDK snippet and are public by
 * design — access is governed by Security Rules and the authorised-domain
 * allowlist, not by secrecy. See .env.example.
 */

import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

function readEnv(key: string): string {
  const value = import.meta.env[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Missing Firebase configuration: ${key}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  return value.trim()
}

function buildOptions(): FirebaseOptions {
  return {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  }
}

export const firebaseApp: FirebaseApp = initializeApp(buildOptions())

export const auth: Auth = getAuth(firebaseApp)
export const db: Firestore = getFirestore(firebaseApp)

/**
 * Keep the session in local storage so a reload does not force the student
 * back through the login form. Applied once, before any sign-in begins.
 */
export async function configureSessionPersistence(): Promise<void> {
  try {
    await setPersistence(auth, browserLocalPersistence)
  } catch (error) {
    // Persistence is an optimisation; a failure here must not block startup.
    console.warn('[cgci] Could not enable persistent sessions:', error)
  }
}
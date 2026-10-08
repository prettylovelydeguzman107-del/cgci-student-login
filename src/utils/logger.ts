/**
 * Development-time diagnostics.
 *
 * Technical detail (Firebase error codes, stack traces) must be available to a
 * developer without ever being shown to a student, so it is funnelled through
 * here: silent in production builds, prefixed and grouped in development.
 */

const isDev = import.meta.env.DEV

export function debugLog(scope: string, message: string, detail?: unknown): void {
  if (!isDev) return
  if (detail === undefined) {
    console.debug(`[cgci:${scope}] ${message}`)
  } else {
    console.debug(`[cgci:${scope}] ${message}`, detail)
  }
}

export function debugWarn(scope: string, message: string, detail?: unknown): void {
  if (!isDev) return
  if (detail === undefined) {
    console.warn(`[cgci:${scope}] ${message}`)
  } else {
    console.warn(`[cgci:${scope}] ${message}`, detail)
  }
}
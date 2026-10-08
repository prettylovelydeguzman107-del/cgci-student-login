/**
 * Identifier resolution.
 * ---------------------------------------------------------------------------
 * The presentation models the login field as a *username*, and `U` is the set
 * of registered usernames. At CGCI a student's username is their Student ID,
 * so that is what the form collects and what the Hash Map is keyed by.
 *
 * Firebase Authentication, however, identifies accounts by email address. The
 * gap is closed with a deterministic, reversible-by-the-server mapping:
 *
 *     2026-0001  ──>  2026-0001@student.cgci.edu.ph
 *
 * No lookup table is needed to reverse it, and no password material is
 * involved. The Student ID remains the canonical user-facing identity, the key
 * of the dictionary, and the document ID of the public directory.
 */

export const STUDENT_EMAIL_DOMAIN = 'student.cgci.edu.ph'

/** Firebase's minimum credential length. */
export const MIN_PASSWORD_LENGTH = 6

const STUDENT_ID_PATTERN = /^\d{4}-\d{4}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type IdentifierFormat = 'studentId' | 'email'

/** Trim, collapse internal whitespace, and upper-case so `2026-0001` matches `2026-0001`. */
export function normaliseUsername(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase()
}

export function detectFormat(raw: string): IdentifierFormat {
  const value = raw.trim()
  if (STUDENT_ID_PATTERN.test(value.toUpperCase())) return 'studentId'
  if (EMAIL_PATTERN.test(value)) return 'email'
  return 'studentId'
}

export function isValidStudentId(raw: string): boolean {
  return STUDENT_ID_PATTERN.test(normaliseUsername(raw))
}

export function isEmail(raw: string): boolean {
  return EMAIL_PATTERN.test(raw.trim())
}

/**
 * Map a user-facing identifier onto the Firebase Authentication email that
 * owns the account.
 */
export function resolveAuthEmail(identifier: string): string {
  const value = identifier.trim()
  if (isEmail(value)) return value.toLowerCase()
  return `${normaliseUsername(value).toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`
}

/** Human-facing hint shown under the identifier field. */
export function identifierHint(raw: string): string | undefined {
  if (raw.trim() === '') return undefined
  return detectFormat(raw) === 'email'
    ? 'Recognised as an email address.'
    : 'Recognised as a Student ID in the form NNNN-NNNN.'
}

export interface CredentialInput {
  readonly identifier: string
  readonly password: string
}

export type IdentifierValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string }

export type CredentialValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly field: 'identifier' | 'password'; readonly message: string }

/** Shape rules for the identifier, shared by sign-in and password recovery. */
export function validateIdentifier(raw: string): IdentifierValidation {
  const value = raw.trim()

  if (value === '') return { valid: false, message: 'Please enter your Student ID.' }

  if (!isValidStudentId(value) && !isEmail(value)) {
    return {
      valid: false,
      message: 'Enter your Student ID in the format 2026-0001, or your email address.',
    }
  }

  return { valid: true }
}

/**
 * Client-side gate. Runs before any network request so obviously invalid
 * input never reaches Firebase.
 */
export function validateCredentials(input: CredentialInput): CredentialValidation {
  const hasIdentifier = input.identifier.trim() !== ''
  const hasPassword = input.password !== ''

  if (!hasIdentifier && !hasPassword) {
    return {
      valid: false,
      field: 'identifier',
      message: 'Please enter your student ID and password.',
    }
  }

  const identifierCheck = validateIdentifier(input.identifier)
  if (!identifierCheck.valid) {
    return { valid: false, field: 'identifier', message: identifierCheck.message }
  }

  if (!hasPassword) {
    return { valid: false, field: 'password', message: 'Please enter your password.' }
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      field: 'password',
      message: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    }
  }

  return { valid: true }
}
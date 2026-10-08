import type { AccountStatus, DirectoryEntry } from '../domain/credentialAlgebra'

export type { AccountStatus, DirectoryEntry }

/**
 * Canonical student record, stored privately at `students/{firebaseUid}`.
 * Never returned to any client other than its owner.
 */
export interface StudentProfile {
  readonly studentId: string
  readonly fullName: string
  readonly email: string
  readonly program: string
  readonly yearLevel: string
  readonly section: string
  readonly status: AccountStatus
  readonly isDemo: boolean
  readonly createdAt: Date | null
  readonly updatedAt: Date | null
  readonly lastLoginAt: Date | null
}

/** Fields a student may change about themselves. Currently only this one. */
export type EditableProfileField = 'lastLoginAt'

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
  pending: 'Pending verification',
}

export const ACCOUNT_STATUS_DESCRIPTIONS: Record<AccountStatus, string> = {
  active: 'Full portal access is granted.',
  disabled: 'This account has been suspended and cannot sign in.',
  pending: 'This account is awaiting verification by the registrar.',
}
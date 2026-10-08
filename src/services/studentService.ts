/**
 * Private student records at `students/{firebaseUid}`.
 *
 * The document ID is the Firebase Authentication UID, so ownership is decided
 * by document identity rather than by a field that could be edited — Firestore
 * Security Rules compare `request.auth.uid` against the path, and no student
 * document ever stores its own owner reference.
 */

import { doc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore'

import { db } from './firebase'
import type { AccountStatus, StudentProfile } from '../types/student'
import { debugWarn } from '../utils/logger'

const STUDENTS_COLLECTION = 'students'

export const STUDENT_COLLECTION_PATH = STUDENTS_COLLECTION

const ACCOUNT_STATUSES: ReadonlySet<string> = new Set(['active', 'disabled', 'pending'])

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function asStatus(value: unknown): AccountStatus {
  return typeof value === 'string' && ACCOUNT_STATUSES.has(value) ? (value as AccountStatus) : 'pending'
}

function asDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

export class StudentRecordNotFoundError extends Error {
  readonly uid: string

  constructor(uid: string) {
    super(`No student record is linked to the authenticated account (uid ${uid}).`)
    this.name = 'StudentRecordNotFoundError'
    this.uid = uid
  }
}

function toProfile(data: Record<string, unknown>): StudentProfile {
  return {
    studentId: asString(data.studentId),
    fullName: asString(data.fullName, 'Unnamed student'),
    email: asString(data.email),
    program: asString(data.program, 'Unassigned'),
    yearLevel: asString(data.yearLevel, '—'),
    section: asString(data.section, '—'),
    status: asStatus(data.status),
    isDemo: asBoolean(data.isDemo),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    lastLoginAt: asDate(data.lastLoginAt),
  }
}

export async function fetchStudentProfile(uid: string): Promise<StudentProfile> {
  const snapshot = await getDoc(doc(db, STUDENTS_COLLECTION, uid))

  // `getDoc` resolves with exists === false when the caller is not permitted to
  // read, so a missing record and a denied record are indistinguishable — which
  // is exactly the behaviour we want to surface as one clear message.
  if (!snapshot.exists()) throw new StudentRecordNotFoundError(uid)

  return toProfile(snapshot.data() as Record<string, unknown>)
}

/**
 * Record the sign-in timestamp. Security Rules permit exactly this one field to
 * be written by the account owner (`updatedAt` is deliberately excluded — it is
 * maintained by the provisioning pipeline, not the browser). A denial here is
 * non-fatal and is logged rather than surfaced, since the student has already
 * authenticated.
 */
export async function stampLastSignIn(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, STUDENTS_COLLECTION, uid), {
      lastLoginAt: serverTimestamp(),
    })
  } catch (error) {
    debugWarn('studentService', `Could not record sign-in time for ${uid}`, error)
  }
}
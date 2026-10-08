/**
 * Public student directory at `studentDirectory/{studentId}`.
 *
 * Backs the presentation's required "List of registered users" feature and
 * supplies the set `U` for the login predicate.
 *
 * Two properties make this safe to read without authentication:
 *
 *  - the collection holds no email address, no Firebase UID, and no credential
 *    material of any kind, so there is nothing here worth protecting;
 *  - every document is keyed by Student ID, which means the collection *is* the
 *    dictionary of the CS model rather than a copy of one.
 *
 * Firestore returns one batched read rather than N per-student reads, and the
 * result is cached in memory for the lifetime of the tab because registered
 * students change rarely and never mid-session.
 */

import { collection, getDocs } from 'firebase/firestore'

import { db } from './firebase'
import { CredentialRegistry, type DirectoryEntry } from '../domain/credentialAlgebra'
import { debugWarn } from '../utils/logger'

const DIRECTORY_COLLECTION = 'studentDirectory'

export const DIRECTORY_COLLECTION_PATH = DIRECTORY_COLLECTION

const ACCOUNT_STATUSES: ReadonlySet<string> = new Set(['active', 'disabled', 'pending'])

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toEntry(id: string, data: Record<string, unknown>): DirectoryEntry | null {
  // The document ID is the canonical username; a field copy that disagrees with
  // it would break the Hash Map key invariant, so the path wins.
  const studentId = asString(data.studentId, id).trim().toUpperCase()
  if (studentId === '') return null

  const rawStatus = asString(data.status, 'pending')
  return {
    studentId,
    name: asString(data.name, 'Unnamed student'),
    program: asString(data.program, 'Unassigned'),
    yearLevel: asString(data.yearLevel, '—'),
    section: asString(data.section, '—'),
    status: typeof rawStatus === 'string' && ACCOUNT_STATUSES.has(rawStatus) ? (rawStatus as DirectoryEntry['status']) : 'pending',
    isDemo: data.isDemo === true,
  }
}

let cachedRegistry: CredentialRegistry | null = null
let pendingRequest: Promise<CredentialRegistry> | null = null

async function loadEntries(): Promise<DirectoryEntry[]> {
  const snapshot = await getDocs(collection(db, DIRECTORY_COLLECTION))
  const entries: DirectoryEntry[] = []

  for (const docSnapshot of snapshot.docs) {
    const entry = toEntry(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    if (entry !== null) entries.push(entry)
  }

  // Sorted by Student ID so the rendered directory is stable across reloads.
  entries.sort((a, b) => a.studentId.localeCompare(b.studentId))
  return entries
}

/**
 * Fetch the directory and index it into a {@link CredentialRegistry}.
 *
 * Concurrent callers (the login page and the directory page can mount together)
 * share a single in-flight request so the collection is read once.
 */
export async function loadCredentialRegistry(): Promise<CredentialRegistry> {
  if (cachedRegistry !== null) return cachedRegistry
  if (pendingRequest !== null) return pendingRequest

  pendingRequest = loadEntries()
    .then((entries) => {
      cachedRegistry = new CredentialRegistry(entries)
      return cachedRegistry
    })
    .catch((error: unknown) => {
      // A directory outage must not make the login form unusable: the predicate
      // can still be evaluated by Firebase Authentication alone.
      debugWarn('directoryService', 'Student directory unavailable', error)
      cachedRegistry = new CredentialRegistry([])
      return cachedRegistry
    })
    .finally(() => {
      pendingRequest = null
    })

  return pendingRequest
}

export function invalidateDirectoryCache(): void {
  cachedRegistry = null
}
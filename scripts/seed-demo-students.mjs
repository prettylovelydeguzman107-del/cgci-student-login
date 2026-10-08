#!/usr/bin/env node
/**
 * Seeds the CGCI Student Login project with fictional demo accounts.
 *
 * Writes, for every record:
 *   · a Firebase Authentication user  (owns the password, never exposed to the client)
 *   · students/{uid}                   (private profile)
 *   · studentDirectory/{studentId}     (public-safe roster entry)
 *
 * The Firebase Admin SDK is deliberately avoided. It needs a service-account
 * private key sitting on disk, and a long-lived key on a student's laptop is a
 * worse trade than a script that borrows the CLI's existing OAuth session.
 * The Firebase REST APIs are used directly instead, with the short-lived access
 * token that `firebase login` already obtained.
 *
 * Usage
 *   npm run seed
 *   FIREBASE_PROJECT_ID=other-project npm run seed
 *
 * Runs against whichever project `firebase use` selects; set FIREBASE_PROJECT_ID
 * to override. Safe to re-run: existing accounts are updated, not duplicated.
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ?? readSelectedProjectId() ?? 'cgci-student-login'
const DATABASE = '(default)'
const DEMO_PASSWORD = 'CGCI@2026'
const EMAIL_DOMAIN = 'student.cgci.edu.ph'

/**
 * FICTIONAL SAMPLE DATA.
 * These are not real students and do not represent real academic records.
 * `status` values are chosen so each authentication scenario in the project
 * brief can be demonstrated from the login screen.
 */
const STUDENTS = [
  {
    studentId: '2026-0001',
    fullName: 'Juan Dela Cruz',
    program: 'BS Computer Science',
    yearLevel: '1st Year',
    section: 'Section A',
    status: 'active',
  },
  {
    studentId: '2026-0002',
    fullName: 'Maria Santos',
    program: 'BS Computer Science',
    yearLevel: '2nd Year',
    section: 'Section B',
    status: 'active',
  },
  {
    studentId: '2026-0003',
    fullName: 'Angelo Reyes',
    program: 'BS Information Technology',
    yearLevel: '1st Year',
    section: 'Section A',
    status: 'active',
  },
  {
    studentId: '2026-0004',
    fullName: 'Bea Villanueva',
    program: 'BS Computer Science',
    yearLevel: '3rd Year',
    section: 'Section A',
    status: 'disabled',
  },
  {
    studentId: '2026-0005',
    fullName: 'Carlos Mendoza',
    program: 'BS Information Technology',
    yearLevel: '2nd Year',
    section: 'Section C',
    status: 'pending',
  },
]

// ── Firebase REST plumbing ────────────────────────────────────────────────

async function request(url, { method = 'GET', body, token }) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  const text = await response.text()
  const payload = text === '' ? {} : JSON.parse(text)

  if (!response.ok) {
    const detail = payload?.error?.message ?? text
    throw new Error(`${method} ${url}\n  → ${response.status} ${detail}`)
  }
  return payload
}

/** Short-lived access token from `firebase login`, reused rather than re-authenticating. */
function readAccessToken() {
  if (process.env.FIREBASE_ACCESS_TOKEN) return process.env.FIREBASE_ACCESS_TOKEN

  const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json')
  const store = JSON.parse(readFileSync(configPath, 'utf8'))
  const tokens = store.tokens

  if (typeof tokens?.access_token !== 'string') {
    throw new Error('No Firebase access token found. Run `firebase login` first.')
  }
  if (typeof tokens.expires_at === 'number' && Date.now() > tokens.expires_at - 60_000) {
    throw new Error('The cached Firebase token has expired. Run `firebase login` again.')
  }
  return tokens.access_token
}

function readSelectedProjectId() {
  try {
    const firebaserc = JSON.parse(readFileSync(join(process.cwd(), '.firebaserc'), 'utf8'))
    return firebaserc.projects?.default
  } catch {
    return undefined
  }
}

// ── Firestore encoding ────────────────────────────────────────────────────

const encodeValue = (value) => {
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (value === null) return { nullValue: null }
  throw new Error(`Unsupported Firestore value: ${String(value)}`)
}

const encodeFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encodeValue(value)]))

async function writeDocument(token, collection, documentId, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/${collection}/${documentId}`
  return request(url, { method: 'PATCH', token, body: { fields: encodeFields(fields) } })
}

// ── Seeding ───────────────────────────────────────────────────────────────

/** Deterministic localId keeps re-runs idempotent instead of creating duplicates. */
const localIdFor = (studentId) => `cgci${studentId.replace(/-/g, '')}`

async function upsertAuthUser(token, student) {
  const email = `${student.studentId}@${EMAIL_DOMAIN}`
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`
  const payload = {
    localId: localIdFor(student.studentId),
    email,
    password: DEMO_PASSWORD,
    displayName: student.fullName,
    emailVerified: true,
    disabled: student.status === 'disabled',
  }

  try {
    const created = await request(base, { method: 'POST', token, body: payload })
    return { uid: created.localId, email, action: 'created' }
  } catch (error) {
    if (!String(error.message).includes('EMAIL_EXISTS') && !String(error.message).includes('DUPLICATE_LOCAL_ID')) {
      throw error
    }
  }

  // The account already exists: refresh its password and status instead.
  const updated = await request(`${base}:update`, { method: 'POST', token, body: payload })
  return { uid: updated.localId, email, action: 'updated' }
}

async function main() {
  const token = readAccessToken()
  const now = new Date()

  console.log(`\nSeeding demo students into Firebase project "${PROJECT_ID}"\n`)

  for (const student of STUDENTS) {
    const { uid, email, action } = await upsertAuthUser(token, student)

    await writeDocument(token, 'students', uid, {
      studentId: student.studentId,
      fullName: student.fullName,
      email,
      program: student.program,
      yearLevel: student.yearLevel,
      section: student.section,
      status: student.status,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    })

    // Document ID === Student ID: the roster collection *is* the hash map
    // from the CS model, with no email or UID anywhere in it.
    await writeDocument(token, 'studentDirectory', student.studentId, {
      studentId: student.studentId,
      name: student.fullName,
      program: student.program,
      yearLevel: student.yearLevel,
      section: student.section,
      status: student.status,
      isDemo: true,
    })

    console.log(`  ${student.studentId}  ${student.fullName.padEnd(20)} ${student.status.padEnd(9)} ${action}`)
  }

  console.log(`\nDone. ${STUDENTS.length} sample accounts provisioned.`)
  console.log(`Shared demo password: ${DEMO_PASSWORD}`)
  console.log(`Sign in with the Student ID, for example: ${STUDENTS[0].studentId}\n`)
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error.message}\n`)
  process.exitCode = 1
})

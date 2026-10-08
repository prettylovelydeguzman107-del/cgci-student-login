import { describe, expect, it } from 'vitest'

import {
  CredentialRegistry,
  evaluateLogin,
  type DirectoryEntry,
} from '../credentialAlgebra'
import { normaliseUsername, resolveAuthEmail, validateCredentials, validateIdentifier } from '../identifier'

function entry(overrides: Partial<DirectoryEntry> & { studentId: string }): DirectoryEntry {
  return {
    name: 'Test Student',
    program: 'BS Computer Science',
    yearLevel: '1st Year',
    section: 'A',
    status: 'active',
    isDemo: false,
    ...overrides,
  }
}

const DIRECTORY: DirectoryEntry[] = [
  entry({ studentId: '2026-0001', name: 'Juan Dela Cruz' }),
  entry({ studentId: '2026-0002', name: 'Maria Santos', status: 'disabled' }),
  entry({ studentId: '2026-0003', name: 'Angelo Reyes', status: 'pending' }),
]

const registry = new CredentialRegistry(DIRECTORY)

describe('CredentialRegistry', () => {
  it('indexes every username so u ∈ U is a single lookup', () => {
    expect(registry.size).toBe(3)
    expect(registry.contains('2026-0001')).toBe(true)
    expect(registry.contains('2026-9999')).toBe(false)
  })

  it('resolves a username to its account record', () => {
    expect(registry.lookup('2026-0002')?.name).toBe('Maria Santos')
    expect(registry.lookup('2026-0002')?.status).toBe('disabled')
    expect(registry.lookup('2026-9999')).toBeUndefined()
  })

  it('exposes U as a set of exactly the registered usernames', () => {
    expect([...registry.usernames()].sort()).toEqual(['2026-0001', '2026-0002', '2026-0003'])
  })

  it('lists records ordered by username', () => {
    expect(registry.list().map((e) => e.studentId)).toEqual(['2026-0001', '2026-0002', '2026-0003'])
  })

  it('is empty when the directory could not be read', () => {
    expect(new CredentialRegistry().size).toBe(0)
  })
})

describe('LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)', () => {
  it('is true when the username is registered and the credentials are valid', () => {
    const result = evaluateLogin('2026-0001', true, registry)

    expect(result.result).toBe(true)
    expect(result.conjuncts[0].value).toBe(true)
    expect(result.conjuncts[1].value).toBe(true)
    expect(result.shortCircuited).toBe(false)
  })

  it('is false when the username is registered but the password is wrong', () => {
    const result = evaluateLogin('2026-0001', false, registry)

    expect(result.result).toBe(false)
    // The first conjunct still holds — this is the case worth demonstrating.
    expect(result.conjuncts[0].value).toBe(true)
    expect(result.conjuncts[1].value).toBe(false)
  })

  it('is false and short-circuits when the username is not registered', () => {
    const result = evaluateLogin('2026-9999', true, registry)

    expect(result.result).toBe(false)
    expect(result.conjuncts[0].value).toBe(false)
    // The right operand is never consulted, so it must not claim a value.
    expect(result.conjuncts[1].value).toBe('pending')
    expect(result.shortCircuited).toBe(true)
  })

  it('attributes each conjunct to the component that evaluated it', () => {
    const result = evaluateLogin('2026-0001', true, registry)

    expect(result.conjuncts[0].owner).toBe('client')
    expect(result.conjuncts[1].owner).toBe('firebase')
  })

  it('notes a non-active status on the domain conjunct', () => {
    const result = evaluateLogin('2026-0002', false, registry)

    expect(result.conjuncts[0].explanation).toContain('disabled')
  })

  it('records the submitted username on the evaluation', () => {
    expect(evaluateLogin('2026-0001', true, registry).username).toBe('2026-0001')
  })
})

describe('identifier handling', () => {
  it('normalises whitespace and casing so lookup is stable', () => {
    expect(normaliseUsername('  2026-0001 ')).toBe('2026-0001')
    expect(normaliseUsername('2026 0001')).toBe('20260001')
    expect(normaliseUsername('2026-0001'.toLowerCase())).toBe('2026-0001')
  })

  it('maps a student ID onto its authentication address', () => {
    expect(resolveAuthEmail('2026-0001')).toBe('2026-0001@student.cgci.edu.ph')
    expect(resolveAuthEmail(' 2026-0001 ')).toBe('2026-0001@student.cgci.edu.ph')
  })

  it('passes an email address through untouched', () => {
    expect(resolveAuthEmail('juan@cgci.edu.ph')).toBe('juan@cgci.edu.ph')
  })

  it('rejects identifiers in the wrong shape', () => {
    expect(validateIdentifier('20260001').valid).toBe(false)
    expect(validateIdentifier('2026-001').valid).toBe(false)
    expect(validateIdentifier('').valid).toBe(false)
    expect(validateIdentifier('2026-0001').valid).toBe(true)
    expect(validateIdentifier('registrar@cgci.edu.ph').valid).toBe(true)
  })

  it('reports both fields missing when the form is empty', () => {
    const result = validateCredentials({ identifier: '', password: '' })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.field).toBe('identifier')
      expect(result.message).toBe('Please enter your student ID and password.')
    }
  })

  it('rejects a password shorter than the Firebase minimum', () => {
    const result = validateCredentials({ identifier: '2026-0001', password: 'short' })

    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.field).toBe('password')
  })

  it('accepts a well-formed credential pair', () => {
    expect(validateCredentials({ identifier: '2026-0001', password: 'CGCI@2026' }).valid).toBe(true)
  })
})

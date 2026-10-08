/**
 * Credential algebra — the formal model from the presentation, as code.
 * ---------------------------------------------------------------------------
 * Slide 3 of the Discrete Structures 1 presentation assigns this system:
 *
 *   1. Sets & Domains
 *        U = Set of all registered usernames
 *        P = Set of valid encrypted passwords
 *   2. Cartesian Relation
 *        Valid credential relation R ⊆ U × P where (u, p) ∈ R denotes an
 *        active, valid user account.
 *   3. Predicate & Boolean Conjunction
 *        LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)
 *        Evaluates to True (1) iff both conditions hold.
 *   4. Time Complexity & Lookup
 *        Hash maps resolve the binary relation membership check (u, p) ∈ R
 *        in O(1) average time.
 *
 * HONEST IMPLEMENTATION NOTE
 * --------------------------
 * A tempting shortcut is to hold every password in the browser and test the
 * predicate locally. That would be a security failure, so this module never
 * sees a password. Instead each conjunct is evaluated by the layer that
 * legitimately owns it:
 *
 *   (u ∈ U)      decided here, against the public directory, through a
 *                HashMap<String, Account> — O(1) average.
 *
 *   ((u, p) ∈ R) decided by Firebase Authentication, which owns the credential
 *                relation R and resolves it with its own internal
 *                O(1) dictionary lookup. The boolean is handed in.
 *
 * The conjunction itself is evaluated here. That split is what keeps the
 * mathematics exact *and* the passwords off the client.
 */

import { HashMap } from './hashMap'

export const LOGIN_PREDICATE = 'LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)'

export type AccountStatus = 'active' | 'disabled' | 'pending'

export interface DirectoryEntry {
  readonly studentId: string
  readonly name: string
  readonly program: string
  readonly yearLevel: string
  readonly section: string
  readonly status: AccountStatus
  readonly isDemo: boolean
}

/** Outcome of one conjunct. `pending` means short-circuit evaluation stopped before it. */
export type ConjunctValue = boolean | 'pending'

export type ConjunctId = 'domain' | 'relation'

export interface Conjunct {
  readonly id: ConjunctId
  /** The mathematical expression as it appears in the presentation. */
  readonly expression: string
  readonly label: string
  readonly value: ConjunctValue
  /** Which component of the system is authoritative for this conjunct. */
  readonly owner: 'client' | 'firebase'
  readonly explanation: string
}

export interface LoginEvaluation {
  readonly username: string
  readonly conjuncts: readonly [Conjunct, Conjunct]
  readonly result: boolean
  /** True when `∧` short-circuited on a false left operand. */
  readonly shortCircuited: boolean
  readonly formula: string
  readonly conclusion: string
}

export interface RegistryMetrics {
  readonly usernames: number
  readonly capacity: number
  readonly loadFactor: number
  readonly averageProbeLength: number
  readonly collisions: number
}

const ACTIVE_STATUSES = new Set<AccountStatus>(['active'])

/**
 * The registered set `U`, indexed by username.
 *
 * Backed by {@link HashMap} so that `(u, p) ∈ R` reduces to a single
 * average-O(1) dictionary resolution, exactly as the presentation describes.
 */
export class CredentialRegistry {
  readonly #index: HashMap<DirectoryEntry>

  constructor(entries: Iterable<DirectoryEntry> = []) {
    this.#index = new HashMap<DirectoryEntry>(16)
    for (const entry of entries) {
      this.#index.set(entry.studentId, entry)
    }

    // Building the table is construction work, not lookup work. Clearing the
    // counters means the reported probe average measures only the `u ∈ U`
    // checks made by the predicate, which is the claim being demonstrated.
    this.#index.resetMetrics()
  }

  /** |U| — the cardinality of the registered-username set. */
  get size(): number {
    return this.#index.size
  }

  /** `U` as a read-only set. */
  usernames(): ReadonlySet<string> {
    return new Set(this.#index.keys())
  }

  /** Average-O(1) dictionary resolution of a single username. */
  lookup(username: string): DirectoryEntry | undefined {
    return this.#index.get(username)
  }

  /** `u ∈ U` */
  contains(username: string): boolean {
    return this.#index.has(username)
  }

  list(): DirectoryEntry[] {
    return this.#index.values().sort((a, b) => a.studentId.localeCompare(b.studentId))
  }

  metrics(): RegistryMetrics {
    const m = this.#index.metrics()
    return {
      usernames: this.#index.size,
      capacity: m.capacity,
      loadFactor: m.loadFactor,
      averageProbeLength: m.averageProbeLength,
      collisions: m.collisions,
    }
  }
}

function domainConjunct(username: string, registry: CredentialRegistry): Conjunct {
  const isMember = registry.contains(username)

  if (!isMember) {
    return {
      id: 'domain',
      expression: 'u ∈ U',
      label: 'Username is registered',
      value: false,
      owner: 'client',
      explanation: `"${username}" is not an element of U, the set of registered usernames.`,
    }
  }

  const entry = registry.lookup(username)
  const qualifier =
    entry !== undefined && !ACTIVE_STATUSES.has(entry.status)
      ? ` The account exists but its status is "${entry.status}".`
      : ''

  return {
    id: 'domain',
    expression: 'u ∈ U',
    label: 'Username is registered',
    value: true,
    owner: 'client',
    explanation: `"${username}" was found in U via one average-O(1) hash-table lookup.${qualifier}`,
  }
}

function relationConjunct(value: ConjunctValue): Conjunct {
  return {
    id: 'relation',
    expression: '(u, p) ∈ R',
    label: 'Credentials are valid',
    value,
    owner: 'firebase',
    explanation: value
      ? 'Firebase Authentication confirmed the submitted pair (u, p) is an element of R.'
      : 'Firebase Authentication rejected (u, p); the pair is not an element of R.',
  }
}

/**
 * Evaluate `LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)`.
 *
 * `relationMembership` is the boolean handed back by Firebase Authentication.
 * When `u ∉ U` the right operand is not evaluated, mirroring the short-circuit
 * semantics of Boolean conjunction.
 *
 * Note on ordering: this function runs *after* the credential has been checked,
 * not before. Skipping the Firebase call for an unknown username would make the
 * response time and the error text depend on whether an account exists, turning
 * the login form into a student-ID enumeration oracle. The short circuit
 * therefore describes the evaluation order of the predicate, not a network
 * saving — and the interface says exactly that.
 */
export function evaluateLogin(
  username: string,
  relationMembership: ConjunctValue,
  registry: CredentialRegistry,
): LoginEvaluation {
  const left = domainConjunct(username, registry)

  if (left.value === false) {
    return {
      username,
      conjuncts: [left, relationConjunct('pending')],
      result: false,
      shortCircuited: true,
      formula: LOGIN_PREDICATE,
      conclusion:
        'False — the conjunction short-circuits on its first operand, so the second is not evaluated.',
    }
  }

  const right = relationConjunct(relationMembership === 'pending' ? 'pending' : relationMembership)

  return {
    username,
    conjuncts: [left, right],
    result: left.value === true && right.value === true,
    shortCircuited: false,
    formula: LOGIN_PREDICATE,
    conclusion:
      left.value === true && right.value === true
        ? 'True — both operands hold, so portal access is granted.'
        : 'False — the first operand held but the second did not.',
  }
}

/** Truth table for `p ∧ q`, used as the on-screen legend for the evaluation trace. */
export const CONJUNCTION_TRUTH_TABLE: ReadonlyArray<{
  readonly p: boolean
  readonly q: boolean
  readonly result: boolean
}> = [
  { p: false, q: false, result: false },
  { p: false, q: true, result: false },
  { p: true, q: false, result: false },
  { p: true, q: true, result: true },
]
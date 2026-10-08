# Discrete Mathematics of the Student Login System

This document connects the formal model in the project presentation to the code
that implements it, and gives the demo script for presenting that part.

---

## 1. The model

From the presentation (slide 3), this system is assigned:

> **Discrete Math Focus:** Sets, Cartesian Relations, Conjunction
> **CS:** Validates credentials against registered sets in O(1) time

### 1.1 Sets and domains

```text
U = { u₁, u₂, …, uₙ }   set of all registered usernames
P = { p₁, p₂, …, pₙ }   set of valid encrypted passwords
```

`U` is the roster of students registered with the portal. At CGCI a student's
username is their Student ID, so in practice:

```text
U = { 2026-0001, 2026-0002, 2026-0003, … }        with |U| = 5 in the demo data
```

`P` is never materialised in this system, and that is deliberate — see §3.

### 1.2 The Cartesian product and the relation

The Cartesian product `U × P` is the set of **all** ordered pairs:

```text
U × P = { (u, p) | u ∈ U and p ∈ P }
```

Its cardinality is `|U| × |P|`. This is the space of *hypotheses*: every
credential pair that could possibly be submitted.

The valid credential relation `R` is a **subset** of that product:

```text
R ⊆ U × P        where  (u, p) ∈ R  denotes an active, valid user account
```

`R` is therefore far smaller than `U × P`. Only genuine pairs are in it.

### 1.3 Predicate and Boolean conjunction

```text
LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)
```

The conjunction `∧` is true **only when both operands are true**. Concretely:

| Case | `u ∈ U` | `(u,p) ∈ R` | `LoginSuccess` |
|---|---|---|---|
| Registered student, correct password | true | true | **1** |
| Registered student, wrong password | true | false | **0** |
| Unregistered identifier | false | — | **0** |

Truth table for `p ∧ q`:

| `p` | `q` | `p ∧ q` |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

### 1.4 Short-circuit evaluation

Row 2 is the operationally interesting one. `∧` **short-circuits**: when the left
operand is false the right operand is not evaluated. For this system that means
an unregistered identifier fails the first conjunct, and the credential
relation `R` is never consulted for it.

The login screen reports this explicitly rather than showing a bare "false".

**A deliberate deviation, stated plainly.** The implementation calls Firebase
*before* evaluating the predicate, so the short circuit does not save a network
round-trip. If it did skip the call, both the error text and the response time
would differ between "no such account" and "wrong password", turning the login
form into a **student-ID enumeration oracle**. Correctness of the security
property outranked a cosmetic reading of the operator, and the interface says
so on screen:

> *Short-circuit: because `(u ∈ U)` evaluated to false, `((u, p) ∈ R)` is not
> evaluated. The credential is still checked by Firebase Authentication, so the
> response does not reveal whether an account exists.*

---

## 2. Time complexity and lookup

The presentation states:

> Hash maps resolve the binary relation membership check `(u, p) ∈ R` in
> **O(1) average** time.

A linear scan of `U` would cost `O(|U|)`. A hash map keyed by username turns
membership into one dictionary resolution.

### 2.1 The implementation is real

`src/domain/hashMap.ts` is not a wrapper around the native `Map`. It is an
actual hash table:

| Aspect | Choice |
|---|---|
| Hash function | FNV-1a, 32-bit |
| Collision handling | Open addressing with linear probing |
| Deletion | Tombstones, preserving probe-chain integrity |
| Resize | At load factor > 0.75; doubles, or compacts tombstones |
| Keys | Strings — the key space is `U` |

Because every operation is a bounded scan over an array, the complexity claim is
inspectable rather than asserted.

### 2.2 The claim is tested, not claimed

`src/domain/__tests__/hashMap.test.ts` asserts that growing the table from 50
to 5,000 keys does not grow the average probe length. If the implementation
regressed toward linear behaviour, the suite would fail.

### 2.3 The claim is visible

The login screen reports live instrumentation for the table holding `U`:

```text
|U|  5      Buckets  16      Load factor  0.31      Avg probes/lookup  1.00
```

Average probes per lookup of 1.00 is the observable form of O(1) average:
growing the table changes the bucket count, not the cost of a lookup.

---

## 3. Where the passwords are

The model names `P` as "the set of valid **encrypted** passwords". This
implementation never constructs `P` in the browser.

A prototype that downloads credentials and tests `(u, p) ∈ R` locally would be
straightforward and completely wrong: every visitor would hold the password
database. So `P` exists only inside Firebase Authentication, where passwords
are hashed with **SCRYPT** (memory-hard; 8 rounds, memory cost 14, as configured
on this project) and never transmitted to a client.

The relation `R` is likewise owned by Identity Platform, which resolves
`(u, p)` with its own internal O(1) dictionary lookup and returns a single
boolean. The client receives the verdict, never the operands.

**This is the central architectural decision of the project**, and the reason
`src/domain/` has no Firebase import: the mathematics is separated from the
mechanism that is entitled to handle secrets.

---

## 4. Mapping table

| Mathematical concept | Where it lives | How it is visible |
|---|---|---|
| `U` — registered usernames | `studentDirectory` collection, keyed by Student ID | `|U|` in the evaluation panel; the roster page |
| `U × P` — possible pairs | never materialised | — |
| `R ⊆ U × P` — valid pairs | Firebase Authentication credential store | Second conjunct, "Firebase Auth" |
| `u ∈ U` | `CredentialRegistry.contains()` | First conjunct, "this app" |
| `p ∧ q` | `evaluateLogin()` | Result line and the on-screen truth table |
| Short circuit | `evaluateLogin()` early return | Short-circuit callout |
| Hash map / dictionary | `src/domain/hashMap.ts` | Bucket count, load factor, average probes |
| O(1) average | Open addressing + bounded load factor | "Avg probes / lookup ≈ 1" |

---

## 5. Presenting this

The fastest way to demonstrate the mathematics is to fail a login deliberately —
the evaluation panel fills in with a per-conjunct trace.

**Both operands true** (successful sign-in)

```text
LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)
u ∈ U        ✓  "2026-0001" was found in U via one average-O(1) hash-table lookup.
(u, p) ∈ R   ✓  Firebase Authentication confirmed the submitted pair is an element of R.
Result       1 (True)
```

**First true, second false** — correct ID, wrong password. The clearest case to
show, because it isolates the second conjunct:

```text
u ∈ U        ✓  found in U
(u, p) ∈ R   ✗  Firebase rejected (u, p)
Result       0 (False) — the first operand held but the second did not.
```

**Short circuit** — an unregistered ID such as `2026-9999`:

```text
u ∈ U        ✗  "2026-9999" is not an element of U.
(u, p) ∈ R   –  not evaluated
Result       0 (False) — the conjunction short-circuits on its first operand.
```

Then point at the instrumentation row and close with the complexity claim:

> `|U| = 5`, 16 buckets, load factor 0.31, **average 1.00 probes per lookup**.
> That is the O(1) average credential lookup from the brief — and it is being
> measured live, not asserted.

Open **Truth table for p ∧ q** underneath for the four-row justification.

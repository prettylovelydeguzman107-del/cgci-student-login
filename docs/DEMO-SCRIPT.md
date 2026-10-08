# Demonstration Script

For the final presentation. The five scenarios required by the brief, followed
by the discrete-mathematics walkthrough.

**Before you start**

```bash
npm run seed     # five fictional sample accounts
npm run dev      # or use https://cgci-student-login.web.app
```

Sample password for every account: `CGCI@2026`

| Student ID | Name | Status | Use for |
|---|---|---|---|
| 2026-0001 | Juan Dela Cruz | Active | Successful login |
| 2026-0002 | Maria Santos | Active | Second success, or a clean dashboard |
| 2026-0003 | Angelo Reyes | Active | Alternate |
| 2026-0004 | Bea Villanueva | **Disabled** | Suspended account |
| 2026-0005 | Carlos Mendoza | **Pending** | Unverified account |

All five are fictional and flagged as sample data in the interface.

---

## Scenario 1 — Successful login

1. Open the login page.
2. Expand **Demo accounts** and press **Use** on Juan Dela Cruz, or type
   `2026-0001` / `CGCI@2026`.
3. Press **Sign in**.

**What to say**

> The Student ID is resolved to `2026-0001@student.cgci.edu.ph` and handed to
> Firebase Authentication, which owns the credential relation. On success the
> interface reports *"Login successful — redirecting to your student portal"* and
> the dashboard confirms `u ∈ U` was true and `(u, p) ∈ R` was true.

**Show**

- Success alert, distinct from the failure style and announced to screen readers
- Dashboard: identity, programme, section, account status, session details
- **How this access was granted** — both conjuncts true, each attributed to the
  component that evaluated it

---

## Scenario 2 — Invalid password

1. Keep `2026-0001`; change the password to anything wrong.
2. Press **Sign in**.

**What to say**

> The first conjunct still holds — this student *is* an element of `U`. Only the
> second fails. This is the case that isolates Firebase's verdict, and it is why
> the two operands are shown separately rather than collapsed into "login
> failed".

**Show** — open **Formal evaluation**:

```text
u ∈ U        ✓  "2026-0001" was found in U via one average-O(1) hash-table lookup.
(u, p) ∈ R   ✗  Firebase Authentication rejected (u, p).
Result       0 (False) — the first operand held but the second did not.
```

**Worth mentioning:** the error text is deliberately identical to the unknown-ID
case, so the form cannot be used to discover which students are registered.

---

## Scenario 3 — Unknown account

1. Enter `2026-9999` with any password.
2. Press **Sign in**.

**What to say**

> `u ∉ U`, so the conjunction short-circuits and the second operand is not
> evaluated. Notice the marker on the right conjunct is a dash, not a cross —
> it was never consulted.

**Show**

```text
u ∈ U        ✗  "2026-9999" is not an element of U.
(u, p) ∈ R   –  not evaluated
Result       0 (False) — the conjunction short-circuits on its first operand.
```

**If asked why the credential is still sent:** skipping the check would make the
error text *and* the response time depend on whether the account exists, turning
the login form into an enumeration oracle. The interface states this in the
callout. Correctness of the security property outranked a literal reading of
short-circuit evaluation.

---

## Scenario 4 — Suspended account

1. Expand **Demo accounts** and press **Use** on Bea Villanueva
   (`2026-0004`), or type the ID with `CGCI@2026`.
2. Press **Sign in**.

**What to say**

> The password is valid, but the account is suspended in Firestore. The session
> is ended immediately, so the student is never left half-authenticated.

**Show**

- *"Account suspended — visit the CGCI registrar's office"* error
- The browser is still on `/login`, and no session remains

**Security point, if it comes up:** the student cannot fix this themselves.
Firestore rules restrict client writes to the single `lastLoginAt` field, so
`status` is immutable from the browser — a suspended student cannot write
`status: "active"`. Verified with a live 403 in `docs/SECURITY.md`.

`2026-0005` behaves the same way but reports *"Account not yet verified"*.

---

## Scenario 5 — Protected route

1. Press **Log out** (top right). You land on `/login` and the session clears.
2. Type `cgci-student-login.web.app/dashboard` directly, or paste `/dashboard`
   into the address bar, and press Enter.
3. You are redirected to `/login`.
4. Sign in again and press **Log out**; then open `/dashboard` again — you go
   straight through, because the session was restored.

**What to say**

> The redirect is a usability measure, not a security control. Firestore rules
> are the real boundary: signing in as one student and requesting another's
> record returns 403 regardless of what the interface does.

**Optional, if time allows:** show the 403 directly —

```bash
# in DevTools console, while signed in as 2026-0001
await fetch('https://firestore.googleapis.com/v1/projects/cgci-student-login/databases/(default)/documents/students/cgci20260002',
  { headers: { Authorization: 'Bearer ' + await firebase.auth().currentUser.getIdToken() } })
# → 403 Missing or insufficient permissions
```

---

## Extra — Registered users

1. From the login page, press **Registered students**.

**What to say**

> This is the list of registered users from the brief. It is the set `U`, served
> from a separate collection that contains no email address, no Firebase UID and
> no credential material — so it can be read publicly by construction rather than
> by permission. Filtering by status shows the suspended and pending accounts.

Also worth showing: `/registered-students` is reachable **while signed out**.
That is intentional. Knowing which students are registered is not a secret;
knowing anyone's password is, and nothing here exposes it.

---

## Discrete mathematics walkthrough

The **Formal evaluation** panel on the login page carries the whole argument.
After any attempt it shows:

1. The predicate, with each conjunct marked ✓, ✗ or "not evaluated"
2. Which component evaluated each one — *this app* or *Firebase Auth*
3. A one-line reason for each value
4. The result, with the truth-table justification
5. Live hash-map instrumentation:

```text
|U|  5      Buckets  16      Load factor  0.31      Avg probes / lookup  1.00
```

**The closing line**

> `|U| = 5` with an average of **1.00 probes per lookup**. That is the O(1)
> average credential lookup from the brief — and it is being measured live, not
> asserted. Growing the table changes the bucket count, not the cost of a lookup.

Expand **Truth table for p ∧ q** for the four-row justification that `∧` is
true only when both operands are.

Full derivation in [`DISCRETE-MATHEMATICS.md`](DISCRETE-MATHEMATICS.md).

---

## Likely questions

**"Where are the passwords stored?"**
In Firebase Authentication, hashed with SCRYPT. Not in Firestore, not in the
browser, never in a log. Firestore holds student information and account
metadata only.

**"Does the app check the password itself?"**
No. The application checks `u ∈ U` locally; Firebase Authentication decides
`(u, p) ∈ R`. A browser-side check would mean shipping every password to every
visitor.

**"Why is the hash map real code rather than a description?"**
Because the O(1) claim is the assigned contribution. `src/domain/hashMap.ts`
implements open addressing with linear probing, and a unit test asserts that
average probe length stays bounded as the table grows by three orders of
magnitude. It could fail.

**"Why two Firestore collections?"**
Firestore rules cannot strip fields on read. If the roster shared a collection
with private records, exposing it would depend on every future rules edit
leaking nothing. A separate collection with no sensitive fields is public by
construction.

**"Can a suspended student log in?"**
No, and they cannot undo it themselves. `status` is outside the
client-writable whitelist.

**"How do you know the rules work?"**
Fourteen operations were executed against the live database with real ID tokens;
all matched expectations. The matrix is in [`SECURITY.md`](SECURITY.md).

**"Does it work on a phone?"**
Verified at 360, 390, 414, 768, 1024, 1280, 1440 and 1920 px — no horizontal
overflow, no touch target under 44px, no text under 11px. The mobile layout is
designed rather than shrunk: navigation moves to its own row and the roster
becomes a card list.

---

## Resetting between rehearsals

```bash
npm run seed     # idempotent: updates existing accounts, creates any missing ones
```

To clear a browser session, use **Log out** in the app bar — this clears local
storage and any in-memory state, so the next visitor starts from the login page.

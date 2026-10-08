# CGCI Student Login

**Student Portal Authentication System**
Discrete Structures 1 — Final Project
Core Gateway College Inc.

**Developers:** Pretty Lovely Deguzman · Kevin Malto

A production-shaped authentication gateway that verifies whether a registered
student can log into the CGCI student portal, implemented with Firebase and
built to make the project's discrete-mathematics model visible in the running
application rather than only in a report.

| | |
|---|---|
| **Live site** | `https://cgci-student-login.web.app` |
| **Firebase project** | `cgci-student-login` |
| **Region** | `asia-southeast1` (Firestore) |
| **Stack** | React 19 · Vite · TypeScript (strict) · React Router 7 · Firebase 13 |
| **Developers** | Pretty Lovely Deguzman · Kevin Malto |

---

## 1. Scope

The presentation assigns this group a single system — **Student Login** — whose
purpose is to *"verify whether a student can successfully log into the portal."*

Implemented, and nothing beyond it:

- Username & password authentication
- Validation logic against the registered set
- Success / failure messaging feedback
- List of registered users
- Hash Map / Dictionary credential model with O(1) average lookup

Explicitly **out of scope** — these are separate projects in the same
presentation and are not implemented here: Grade Calculator, Library
Management, Course Enrolment, Campus Navigation.

---

## 2. Quick start

```bash
npm install
cp .env.example .env.local     # then paste your Firebase web config
npm run seed                   # optional: creates the sample accounts
npm run dev                    # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and produce the production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |
| `npm test` | Unit tests for the hash map and the login predicate |
| `npm run typecheck` | `tsc` in strict mode, no emit |
| `npm run lint` | oxlint |
| `npm run seed` | Provision the fictional demo accounts |
| `npm run deploy` | Build, then deploy rules, indexes and Hosting |

### Firebase configuration

Configuration is read from Vite environment variables. Copy `.env.example` to
`.env.local` and fill in the values from **Firebase Console → Project settings →
Your apps → SDK setup and configuration**.

> **Security note.** Firebase *web* configuration is public by design. It is
> bundled into the JavaScript served to every visitor and cannot be kept secret.
> Access is not protected by hiding these values — it is protected by Firestore
> Security Rules, Firebase Authentication, and the authorised-domain allowlist.
> Never place a service-account key or any admin credential in an environment
> file that ships to the browser.

---

## 3. The discrete mathematics, as running code

The presentation's formalisation is the specification for this system's logic.
It is implemented in `src/domain/` and executed on every sign-in attempt.

```text
U  =  Set of all registered usernames
P  =  Set of valid encrypted passwords
R  ⊆  U × P          the relation of valid credential pairs

LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)
```

### The honest split

A tempting shortcut is to hold every password in the browser and evaluate the
predicate locally. That would be a security failure, so **no password ever
reaches this code**. Each conjunct is evaluated by the layer that legitimately
owns it:

| Conjunct | Evaluated by | Mechanism |
|---|---|---|
| `u ∈ U` | this application | `HashMap<String, DirectoryEntry>` — O(1) average |
| `(u, p) ∈ R` | Firebase Authentication | Identity Platform's internal O(1) credential store |
| `p ∧ q` | this application | `src/domain/credentialAlgebra.ts` |

The conjunction itself is evaluated here. That split keeps the mathematics
exact **and** the passwords off the client.

### Short-circuit evaluation

When `u ∉ U` the right operand is not evaluated, matching `∧` semantics. The
interface reports this explicitly, because *"the second conjunct was not
evaluated"* is the interesting behaviour of the operator.

Note the ordering: the Firebase call happens **first**, and the predicate is
evaluated afterwards. Skipping the check for an unknown username would make
both the response text and the response time depend on whether an account
exists, turning the login form into a student-ID enumeration oracle. The
short-circuit therefore describes the evaluation order of the predicate, not a
network saving.

### The data structure is real

`src/domain/hashMap.ts` is an actual hash table, not a wrapper around the native
`Map`: FNV-1a hashing, open addressing with linear probing, tombstone deletion,
and a load-factor-controlled resize. The O(1) average claim is therefore
demonstrable, and `hashMap.test.ts` asserts it empirically — average probes
must stay bounded as the table grows by three orders of magnitude.

The live evaluation panel on the login screen reports `|U|`, bucket count, load
factor and average probes per lookup, so the complexity claim can be inspected
during the presentation rather than taken on faith.

### See also

- [`docs/DISCRETE-MATHEMATICS.md`](docs/DISCRETE-MATHEMATICS.md) — full derivation, the math-to-code mapping table, and the demo script for this part
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module map, state machine, data flow
- [`docs/SECURITY.md`](docs/SECURITY.md) — threat model, rules, and the verified access-control matrix
- [`docs/DEMO-SCRIPT.md`](docs/DEMO-SCRIPT.md) — the five required scenarios, step by step

---

## 4. Firestore schema

```text
students/{firebaseUid}              ← canonical, PRIVATE
  studentId   fullName   email   program
  yearLevel   section    status  isDemo
  createdAt   updatedAt  lastLoginAt

studentDirectory/{studentId}        ← PUBLIC-SAFE projection
  studentId   name   program   yearLevel   section   status   isDemo
```

**Why two collections.** Firestore Security Rules cannot strip individual fields
from a document on read. Rather than trusting every future rules edit to keep
leaking nothing, the directory is a physically separate collection whose entire
payload is safe by construction — no email, no UID, no credential material.

**Why the directory is keyed by Student ID.** Because the document ID *is* the
username, the collection is the hash map of the CS model rather than a copy of
one. Firestore returns it in a single batched read.

---

## 5. Security model

Enforced at the Firebase level, not by hiding things in React. The route guards
in `src/routes/` are user-experience only; they hold no authority.

```text
students/{uid}      read   → request.auth.uid == uid
                    write  → owner only, and only the `lastLoginAt` field
                    create → denied      delete → denied
studentDirectory/{…} read   → public (nothing sensitive is stored)
                    write  → denied
```

The one-field write whitelist is deliberate. It means a student cannot rewrite
their own programme, and — importantly — **cannot re-enable a disabled
account**, because `status` is immutable from the browser.

Verified against the live database; results in [`docs/SECURITY.md`](docs/SECURITY.md).

Other measures:

- Generic credential-failure wording — an unknown Student ID and a wrong
  password produce byte-identical responses, so the form cannot be used to
  discover which IDs are registered.
- Raw Firebase error codes never reach the interface; `src/utils/authErrors.ts`
  maps them to actionable copy.
- Strict Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, and a
  restrictive `Permissions-Policy` are set on Hosting.
- Sessions persist in local storage so a reload does not force re-authentication.

---

## 6. Accessibility

- Semantic landmarks, one `h1` per screen, real `<form>` / `<label>` pairing
- Errors wired through `aria-describedby` and `aria-invalid`; `role="alert"` for
  failures and `role="status"` for successes
- Status is never signalled by colour alone — every state carries an icon and
  an explicit label
- Keyboard-operable password reveal (`aria-pressed`), a skip link, and visible
  `:focus-visible` rings
- Touch targets ≥ 44px on primary controls; input text is 16px so iOS does not
  zoom on focus
- `prefers-reduced-motion` honoured

---

## 7. Responsive design

Mobile-first. Verified at 360, 390, 414, 768, 1024, 1280, 1440 and 1920 px
against the live build, checking every route for horizontal overflow,
undersized touch targets and sub-11px text.

| Breakpoint | Layout |
|---|---|
| base (<640) | Single column; compact institutional band; navigation on its own full-width row |
| ≥640 | Two-up field grids; directory cards in two columns |
| ≥768 | Card grids at two columns; identity chip appears in the app bar |
| ≥1024 | Split authentication layout (statement left, form right); app bar becomes single-row |
| ≥1280 | Directory at three–four columns; content cap reached |

The mobile layout is designed, not shrunk: navigation moves to its own row
rather than collapsing behind a disclosure menu, and the roster is a card list
rather than a table that would need horizontal scrolling.

---

## 8. Demo data

`npm run seed` provisions five **fictional** sample accounts. They are not real
students and are flagged `isDemo: true`, which makes the login screen label
them as sample data and the directory page carry a notice.

| Student ID | Name | Programme | Year | Section | Status |
|---|---|---|---|---|---|
| 2026-0001 | Juan Dela Cruz | BS Computer Science | 1st Year | Section A | Active |
| 2026-0002 | Maria Santos | BS Computer Science | 2nd Year | Section B | Active |
| 2026-0003 | Angelo Reyes | BS Information Technology | 1st Year | Section A | Active |
| 2026-0004 | Bea Villanueva | BS Computer Science | 3rd Year | Section A | **Disabled** |
| 2026-0005 | Carlos Mendoza | BS Information Technology | 2nd Year | Section C | **Pending** |

Password for all sample accounts: `CGCI@2026`

The seed script uses the Firebase REST API with the OAuth session already held
by the Firebase CLI, deliberately avoiding the Admin SDK so that no
service-account private key has to be written to disk. It is idempotent:
re-running updates the existing accounts rather than duplicating them.

---

## 9. Deployment

```bash
npm run deploy     # → https://cgci-student-login.web.app
```

`firebase.json` configures:

- **Hosting** from `dist`, with SPA rewrites so client-side routes survive a
  hard refresh, `cleanUrls`, and long-lived immutable caching for hashed assets
- **Firestore** rules and indexes from `firestore.rules` and
  `firestore.indexes.json`

Authorised domains already include `localhost`, `cgci-student-login.firebaseapp.com`
and `cgci-student-login.web.app`. Add your own domain in the Firebase Console
before using it — Identity Platform rejects unknown origins regardless of what
the client code allows.

---

## 10. Project structure

```text
src/
├── domain/          ← the mathematics, with no Firebase dependency
│   ├── hashMap.ts             open-addressing hash table
│   ├── credentialAlgebra.ts   U, P, R ⊆ U×P, LoginSuccess
│   └── identifier.ts          Student ID ⇄ auth address, validation
├── services/        ← all Firebase access lives here
│   ├── firebase.ts            initialisation, config validation
│   ├── authService.ts         owns the credential relation R
│   ├── studentService.ts      private records
│   └── directoryService.ts    public roster
├── contexts/        ← AuthContext (state machine)
├── routes/          ← ProtectedRoute, GuestRoute, route table
├── components/
│   ├── ui/          Button, TextField, Alert, Card, DataList, …
│   ├── layout/      AppShell, AuthLayout, Wordmark, BootScreen
│   ├── auth/        PasswordField, PredicateTrace, DemoCredentials
│   └── ...
├── pages/           one folder-free file per screen
├── hooks/           useAuth, useMediaQuery, useDocumentTitle
├── styles/          tokens → base → ui → layout → login → dashboard
└── types/
```

`src/domain/` is deliberately free of Firebase and React imports. That is what
makes the discrete-structures layer testable in isolation — 29 unit tests run
in under a second with no browser and no network.

---

## 11. Project checklist

| Requirement | Status |
|---|---|
| Username & password authentication | Firebase Auth, email/password (SCRYPT) |
| Validation against registered users | Client gate + `u ∈ U` + Firebase |
| Success / failure messaging | Distinct success and failure alerts with icons |
| List of registered users | `/registered-students`, public-safe projection |
| Hash Map / Dictionary | Real implementation, used at runtime |
| Sets, Cartesian relation, conjunction | `src/domain/credentialAlgebra.ts`, shown live |
| O(1) average lookup | Instrumented and displayed in the UI |
| Student dashboard | Identity, session, account status |
| Protected routes | `initializing → authenticated \| unauthenticated` |
| Password reset | Implemented with non-enumerating confirmation |
| Security rules | Ownership-scoped, one-field write whitelist |
| Responsive | Verified 360 → 1920 px |
| Accessibility | Semantic, labelled, keyboard-complete |
| Firebase Hosting | `cgci-student-login.web.app` |

---

## 12. Project team

| Role | Developer |
|---|---|
| Development & documentation | Pretty Lovely Deguzman |
| Development & documentation | Kevin Malto |

The names are held in one place — `src/config/project.ts` — and rendered by
`PortalFooter`, so the credit shown in the interface, in the documentation and in
the generated PDF all read from the same source.

---

## 13. Licence and attribution

Academic coursework for Core Gateway College Inc. The CGCI seal is the property
of the institution and is used with permission for this project.

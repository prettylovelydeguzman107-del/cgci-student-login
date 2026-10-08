# Architecture

## 1. Layers

Dependencies point inwards. `domain/` knows nothing about Firebase or React,
which is what makes the discrete-mathematics layer testable in isolation.

```text
┌─────────────────────────────────────────────┐
│ pages/         one file per screen          │  presentation
├─────────────────────────────────────────────┤
│ components/    ui · layout · auth           │
│ routes/        guards + route table         │
├─────────────────────────────────────────────┤
│ contexts/      AuthContext (state machine)   │  application
├─────────────────────────────────────────────┤
│ services/      the only Firebase callers    │
├─────────────────────────────────────────────┤
│ domain/        hash map · algebra · ids     │  pure, no I/O
└─────────────────────────────────────────────┘
```

No module outside `services/` imports `firebase/*`. That boundary is what lets
`npm test` run 29 assertions in under a second with no browser, no network and
no emulator.

---

## 2. Module map

```text
src/
├── domain/
│   ├── hashMap.ts             open-addressing hash table (FNV-1a, linear probing)
│   ├── credentialAlgebra.ts   U, P, R ⊆ U×P, evaluateLogin(), truth table
│   ├── identifier.ts          Student ID ⇄ auth address, input validation
│   └── __tests__/             29 unit tests
├── services/
│   ├── firebase.ts            initialisation; fails loudly on missing config
│   ├── authService.ts         owns R; observe / sign in / sign out / reset
│   ├── studentService.ts      private records; lastLoginAt only
│   └── directoryService.ts    public roster → CredentialRegistry
├── contexts/
│   ├── authStore.ts           context object + value types
│   └── AuthContext.tsx        the provider and the sign-in orchestration
├── routes/                    ProtectedRoute, GuestRoute, route table
├── hooks/                     useAuth, useMediaQuery, useDocumentTitle
├── components/                ui · layout · auth · (student surfaces in pages/)
├── pages/                     Login, ForgotPassword, RegisteredStudents,
│                              Dashboard, Profile, NotFound
├── styles/                    tokens → base → ui → layout → login → dashboard
└── types/                     student, auth
```

---

## 3. Authentication state machine

Three states, because collapsing `initializing` into `unauthenticated` is what
causes the login page to flash on every hard refresh.

```text
                 ┌──────────────┐
   app start ───► │ initializing │  onAuthStateChanged has not reported yet
                 └──────┬───────┘
                        │ first callback
              ┌─────────┴─────────┐
              ▼                   ▼
      ┌───────────────┐   ┌──────────────────┐
      │unauthenticated│◄─┤  authenticated   │──► sign out
      └───────┬───────┘   └────────┬─────────┘
              │                    │
      /login, /forgot-password   /dashboard, /profile
```

While `initializing`, both guards render a neutral branded boot screen rather
than redirecting. Redirecting early would tell a signed-in student they are
signed out.

**Profile state is derived, not pushed.** Records are stored keyed by Firebase
UID, so `profileStatus` is computed during render:

```text
user === null            → idle
no entry for this uid    → loading
entry with a profile     → ready
entry with `missing`     → missing
entry with `error`       → error
```

This avoids a synchronous `setState` inside an effect, and it makes it
structurally impossible for one student's record to be displayed under another
identity after an account switch.

---

## 4. Sign-in sequence

```text
  submit
    │
    ├─ 1. validateCredentials()            shape gate; nothing leaves the browser
    │      └─ invalid → inline field error, stop
    │
    ├─ 2. resolveAuthEmail()                2026-0001 → 2026-0001@student.cgci.edu.ph
    │
    ├─ 3. signInWithEmailAndPassword()      ← owns R, decides (u, p) ∈ R
    │      └─ throws → describeAuthFailure() → generic message, end
    │
    ├─ 4. fetchStudentProfile(uid)          private record
    │      ├─ status ≠ active → sign out, show suspended/unverified, end
    │      ├─ no record      → sign out, show registrar message, end
    │      └─ status active  → stampLastSignIn()
    │
    ├─ 5. evaluateLogin(u, relation)        U ∧ R, with per-conjunct trace
    │
    └─ 6. success feedback → navigate to ?redirect= or /dashboard
```

Steps 3 and 4 are both required. Firebase confirms the *credential*; Firestore
confirms the *account state*. A student with a correct password but a suspended
account must still be refused — and refused on the login screen, not half-way
into the portal.

Both rejection paths call `signOut()` so no half-authenticated session survives.

---

## 5. Identifier resolution

The presentation models a *username*; Firebase Auth identifies by email. The gap
is bridged by a deterministic, reversible mapping:

```text
2026-0001  ──resolveAuthEmail()──►  2026-0001@student.cgci.edu.ph
```

No lookup table is needed to reverse it and no password is involved. The Student
ID stays the canonical user-facing identity, the key of the hash map, and the
document ID of the public directory. Bare email addresses also pass through,
which gives the registrar an admin route without adding a second sign-in path.

---

## 6. Data flow

```text
  studentDirectory (public read, one batched fetch)
        │
        ▼
  CredentialRegistry ──── HashMap<StudentID, DirectoryEntry>
        │                            │
        │                     u ∈ U (O(1) average)
        ▼
  evaluateLogin(u, r) ◄── r from Firebase Authentication
        │
        ▼
  PredicateTrace (login) / summary card (dashboard)
```

The registry is fetched once per tab and shared, with in-flight request
de-duplication so the login page and the roster page mounting together cause a
single read. A directory outage degrades to an empty registry rather than
breaking sign-in — Firebase remains authoritative for the credential.

---

## 7. Styling approach

Plain CSS with custom properties, no framework. Tokens load first, then base,
then components, so cascade order matches importance.

```text
tokens.css      design tokens; brand greens, neutrals, semantic status, spacing,
                type scale, radii, elevation, breakpoints
base.css        reset, element defaults, focus rings, .sr-only, skip link
ui.css          Button, TextField, Alert, Badge, Card, DataList, Spinner
layout.css      wordmark, auth split panel, app shell, page containers
login.css       login form, predicate trace, demo panel
dashboard.css   dashboard, profile, roster
```

A utility framework was rejected deliberately: the visual identity here is
"a real college portal", and hand-written CSS keeps the payload small and every
decision legible. A framework would have added a build dependency and produced
the same generic dashboard look the brief warns against.

All breakpoints are mobile-first `min-width`. Values are in `rem` so the layout
responds to the user's font size.

---

## 8. Performance

| Measure | Result |
|---|---|
| Initial JS (gzip) | ~93 KB app + vendors |
| Largest vendor chunk | Firebase ~166 KB gzip, cached immutably |
| Route splitting | Login eager; dashboard, profile, roster, reset, 404 lazy |
| Fonts | System stack — no webfont request, no FOUT |
| Images | One 107 KB seal, `decoding="async"` |
| Directory fetch | One batched read per tab, de-duplicated in flight |

Firebase is the dominant cost and is inherent to using it. Splitting it into its
own chunk means shipping a copy-text change does not invalidate 166 KB of
vendor code in every visitor's cache.

# Security Model

Enforcement lives at the Firebase level. React route guards are user-experience
only — they hold no authority, and every result below was verified by calling
the live Firestore API with a real student ID token.

---

## 1. Threat model

| Threat | Mitigation |
|---|---|
| One student reads another's private record | `students/{uid}` readable only by `request.auth.uid == uid` |
| Bulk harvest of the student database | Collection-wide `list` denied; rules evaluate per document |
| Password database reaching the browser | Firebase Authentication owns `P`; the client never receives it |
| Enumerating which Student IDs exist | Unknown ID and wrong password produce byte-identical responses |
| A suspended student reactivating their own account | `status` is outside the client-writable field whitelist |
| Student tampering with their own programme or section | One-field write whitelist: only `lastLoginAt` |
| Injection via the login form | Identifier shape is validated before any network call; React escapes all output |
| Clickjacking | `X-Frame-Options: DENY` and `frame-ancestors 'none'` |
| Script injection | Content-Security-Policy without `unsafe-eval` |

---

## 2. Rules

```text
students/{uid}
  get, list   → request.auth.uid == uid
  update      → owner, AND diff().affectedKeys().hasOnly(['lastLoginAt'])
                AND the new lastLoginAt is a timestamp
  create      → denied
  delete      → denied

studentDirectory/{studentId}
  get, list   → public
  write       → denied

everything else → denied by the default match arm
```

Two decisions are worth defending.

**Ownership by document path.** `students` is keyed by Firebase UID, so ownership
is decided by *document identity*, not by a field a student could edit. No
student record stores its own owner reference, so there is nothing to spoof.

**A one-item write whitelist.** Allowing a student to "edit their profile" is
the usual default, and it quietly makes `status` attacker-controlled — a
suspended student simply writes `status: "active"`. Restricting writes to exactly
`lastLoginAt` closes that, and costs nothing, because this system's scope does
not include self-service profile editing. The Profile page is read-only by
design and the interface says why.

### Why the directory is a separate collection

Firestore Rules cannot strip individual fields from a document on read. If the
roster lived in `students`, then exposing it would require trusting that every
current and future rules edit leaks nothing. Instead `studentDirectory` is a
separate collection containing **no email, no UID and no credential material** —
public by construction, not public by permission.

---

## 3. Verified access-control matrix

Executed against the live database with real ID tokens.

| Operation | Identity | Result | Expected |
|---|---|---|---|
| Read `students/{own uid}` | 2026-0001 | **allow** | allow |
| Read `students/{other uid}` | 2026-0001 → 2026-0002 | **deny (403)** | deny |
| Read `students/{other uid}` | 2026-0001 → 2026-0004 | **deny (403)** | deny |
| Read own record as a different identity | 2026-0002 → 2026-0001 | **deny (403)** | deny |
| List `students` | 2026-0001 | **deny (403)** | deny |
| List `students` | anonymous | **deny (403)** | deny |
| List `studentDirectory` | anonymous | **allow — 5 docs** | allow |
| Set own `status` to `active` | 2026-0001 | **deny (403)** | deny |
| Rewrite own `program` | 2026-0001 | **deny (403)** | deny |
| Disable another student | 2026-0001 → 2026-0002 | **deny (403)** | deny |
| Write own `lastLoginAt` | 2026-0001 | **allow** | allow |
| Create `students/{uid}` | 2026-0001 | **deny (403)** | deny |
| Delete own record | 2026-0001 | **deny (403)** | deny |
| Edit a directory entry | 2026-0001 | **deny (403)** | deny |
| Create a directory entry | 2026-0001 | **deny (403)** | deny |

The `lastLoginAt` write is confirmed by read-back: after signing in, the record
for `cgci20260001` carries the timestamp written by the client, while every
escalation attempt above was refused.

Provisioning writes go through the Firebase Admin SDK (via the REST APIs from
the seed script), which bypasses these rules by design — that is how the
registrar creates and suspends accounts.

---

## 4. Credential handling

**Passwords.** Hashed with SCRYPT inside Identity Platform. Never stored in
Firestore, never transmitted to the client, never logged.

**Enumeration resistance.** An unknown Student ID and an incorrect password both
resolve to the same failure — same title, same sentence, same markup. The
internal distinction is retained only for developer logs.

**Session.** Persisted in browser local storage so a reload does not force
re-authentication. Cleared on sign-out.

**Error mapping.** `src/utils/authErrors.ts` converts Firebase codes into
actionable copy and guarantees a fallback for unrecognised errors, so raw codes
can never surface. Technical detail goes to the console in development builds
only.

---

## 5. Transport and headers

Set on Hosting (`firebase.json`):

```text
Content-Security-Policy   default-src 'self'; script-src 'self' https://apis.google.com
                                 https://www.gstatic.com; connect-src 'self' https://*.googleapis.com …;
                                 object-src 'none'; frame-ancestors 'none'; base-uri 'self'
X-Content-Type-Options    nosniff
X-Frame-Options           DENY
Referrer-Policy           strict-origin-when-cross-origin
Permissions-Policy        camera=(), microphone=(), geolocation=()
```

`script-src` has no `unsafe-inline` and no `unsafe-eval`. `style-src` does allow
`unsafe-inline`, which React's inline style attributes require; it carries no
script-execution risk.

---

## 6. Before production

1. Replace the demo accounts with real registrar-provisioned accounts and clear
   `isDemo`.
2. Add the real CGCI domain to **Authorised Domains** in the Firebase Console.
   Identity Platform rejects unknown origins regardless of client-side checks.
3. Configure the password policy in Identity Platform (minimum length,
   complexity, and email-enumeration protection are already on).
4. Set up a custom reset-email template and a verified sending domain.
5. Add App Check to defend the API quota against abuse from unauthorised
   clients.
6. Enable Firebase Audit Logs for ongoing review.
7. Move the seed script to a provisioning-only context — it holds no credentials
   itself, but it assumes an operator session with broad Firebase access.

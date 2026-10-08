import { AppShell } from '../components/layout/AppShell'
import { Alert } from '../components/ui/Alert'
import { Card, StatusBadge } from '../components/ui/Card'
import { DataList } from '../components/ui/DataList'
import { EmptyState, InboxIcon, ShieldIcon } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ACCOUNT_STATUS_DESCRIPTIONS } from '../types/student'
import { formatDateTime, firstName, maskUid, pluralise } from '../utils/format'
import { LOGIN_PREDICATE } from '../domain/credentialAlgebra'

/**
 * Student dashboard.
 *
 * Deliberately limited to what authentication makes available: who you are,
 * what state your account is in, and the session you are holding. Grades,
 * enrolment, library loans and campus routing are separate CGCI systems and
 * are out of this project's scope.
 */
export function DashboardPage() {
  useDocumentTitle('Dashboard')

  const { user, profile, profileStatus, feedback, evaluation, registry, signOut } = useAuth()

  if (profileStatus === 'loading' || profileStatus === 'idle') return <ProfileSkeleton />

  if (profileStatus === 'missing' || profileStatus === 'error' || profile === null) {
    return (
      <AppShell>
        <div className="page__header">
          <p className="eyebrow page__eyebrow">Account</p>
          <h1 className="page__title">Student record unavailable</h1>
          <p className="page__lede">
            Your sign-in succeeded, but no complete student record could be read from the database.
          </p>
        </div>

        <div className="card">
          <div className="card__body">
            <EmptyState
              icon={<InboxIcon />}
              title="We could not load your student record"
              message="This usually means the account exists in Firebase Authentication but has not yet been provisioned with a student record. Please contact the CGCI registrar’s office."
              action={
                <button type="button" className="btn btn--secondary" onClick={() => void signOut()}>
                  Sign out
                </button>
              }
            />
          </div>
        </div>
      </AppShell>
    )
  }

  const registrySize = registry?.size ?? 0

  return (
    <AppShell>
      <div className="page__header">
        <p className="eyebrow page__eyebrow">Student Portal</p>
        <h1 className="page__title">Welcome back, {firstName(profile.fullName)}</h1>
        <p className="page__lede">
          You are signed in to the Core Gateway College Inc. student portal. The session below is
          held by Firebase Authentication and will persist until you log out.
        </p>
      </div>

      {feedback !== null ? (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Alert tone={feedback.tone} title={feedback.title} message={feedback.message} />
        </div>
      ) : null}

      <div className="card-grid card-grid--two-up">
        <Card
          title="Student information"
          subtitle="Read from your private Firestore record"
          icon={<PeopleIconInline />}
        >
          <div className="dashboard__status">
            <StatusBadge status={profile.status} />
            <span className="dashboard__status-note">{ACCOUNT_STATUS_DESCRIPTIONS[profile.status]}</span>
          </div>

          <DataList
            rows={[
              { label: 'Student ID', value: profile.studentId, mono: true },
              { label: 'Full name', value: profile.fullName },
              { label: 'Programme', value: profile.program },
              { label: 'Year level', value: profile.yearLevel },
              { label: 'Section', value: profile.section },
              { label: 'Email', value: profile.email || '—', mono: true, muted: profile.email === '' },
            ]}
          />
        </Card>

        <Card title="Session and account" subtitle="Authentication state held by Firebase">
          <DataList
            rows={[
              {
                label: 'Signed in as',
                value: user?.email ?? 'Hidden by email privacy settings',
                mono: true,
                muted: user?.email === null,
              },
              { label: 'Authentication status', value: <StatusBadge status="active" withDescription /> },
              { label: 'Email verified', value: user?.emailVerified === true ? 'Yes' : 'Not yet verified' },
              { label: 'Provider', value: 'Email / password', mono: true },
              { label: 'Session started', value: formatDateTime(profile.lastLoginAt) },
              { label: 'Account created', value: formatDateTime(profile.createdAt) },
              { label: 'Reference ID', value: maskUid(user?.uid ?? ''), mono: true },
            ]}
          />

          <div className="dashboard__actions">
            <button type="button" className="btn btn--secondary" onClick={() => void signOut()}>
              Log out
            </button>
          </div>
        </Card>

        <Card
          title="How this access was granted"
          subtitle="Discrete Structures 1 · formalisation"
          icon={<ShieldIcon />}
        >
          <p className="dashboard__formula">{LOGIN_PREDICATE}</p>

          {evaluation !== null ? (
            <ul className="dashboard__conjuncts">
              {evaluation.conjuncts.map((conjunct) => (
                <li key={conjunct.id} className="dashboard__conjunct">
                  <span
                    className={`trace__marker trace__marker--${conjunct.value === true ? 'true' : 'pending'}`}
                    aria-hidden="true"
                  >
                    {conjunct.value === true ? '✓' : '–'}
                  </span>
                  <span>
                    <code>{conjunct.expression}</code> evaluated to{' '}
                    {conjunct.value === true ? 'true' : 'not evaluated'} by{' '}
                    {conjunct.owner === 'client' ? 'this application' : 'Firebase Authentication'}.
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="dashboard__note">
            The set of registered usernames <span className="math-inline">U</span> currently holds{' '}
            {pluralise(registrySize, 'element')}. Your username resolved in a single hash-table
            lookup — the O(1) average credential lookup described in the project brief.
          </p>
        </Card>

        <Card title="Scope of this portal" subtitle="What this system does and does not do">
          <ul className="dashboard__scope">
            <li className="dashboard__scope--in">
              <strong>Provided here:</strong> username and password authentication, validation
              against the registered set, success and failure feedback, and the list of registered
              users.
            </li>
            <li className="dashboard__scope--out">
              <strong>Separate CGCI systems:</strong> Grade Calculator, Library Management, Course
              Enrolment and Campus Navigation are independent projects and are not part of this
              login gateway.
            </li>
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}

function ProfileSkeleton() {
  return (
    <AppShell>
      <div className="page__header">
        <div className="skeleton" style={{ height: '0.85rem', width: '9rem' }} />
        <div className="skeleton" style={{ height: '2.1rem', width: 'min(22rem, 80%)', marginTop: 14 }} />
        <div className="skeleton" style={{ height: '1rem', width: 'min(34rem, 100%)', marginTop: 14 }} />
      </div>

      <div className="card-grid card-grid--two-up" aria-busy="true">
        {[0, 1, 2, 3].map((index) => (
          <div className="card" key={index}>
            <div className="card__header">
              <div className="skeleton" style={{ height: '1rem', width: '9rem' }} />
            </div>
            <div className="card__body">
              <div className="skeleton" style={{ height: '7.5rem' }} />
            </div>
          </div>
        ))}
      </div>

      <p className="sr-only" role="status">
        <Spinner size="sm" /> Loading your student record
      </p>
    </AppShell>
  )
}

function PeopleIconInline() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M17 11.5a3.2 3.2 0 0 0 0-6.4M22 19v-1.5a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

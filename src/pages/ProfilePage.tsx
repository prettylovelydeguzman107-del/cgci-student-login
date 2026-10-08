import { AppShell } from '../components/layout/AppShell'
import { Card, StatusBadge } from '../components/ui/Card'
import { DataList } from '../components/ui/DataList'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ACCOUNT_STATUS_DESCRIPTIONS } from '../types/student'
import { formatDateTime } from '../utils/format'

/**
 * Profile.
 *
 * Read-only by design. Firestore Security Rules permit the account owner to
 * update exactly one field on their own record — the sign-in timestamp — and
 * nothing else, so there is no editing surface here to render or to get wrong.
 */
export function ProfilePage() {
  useDocumentTitle('Profile')

  const { user, profile, profileStatus } = useAuth()

  if (profile === null) return null

  return (
    <AppShell>
      <div className="page__header">
        <p className="eyebrow page__eyebrow">Account</p>
        <h1 className="page__title">Profile</h1>
        <p className="page__lede">
          Your identity as recorded by the CGCI registrar. Changes to these details are made by the
          registrar, not from this portal.
        </p>
      </div>

      <div className="card-grid card-grid--two-up">
        <Card title="Identity" subtitle="As recorded in the student register">
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
              { label: 'Email address', value: profile.email || '—', mono: true, muted: profile.email === '' },
            ]}
          />
        </Card>

        <Card title="Account record" subtitle="Provenance of the data on this page">
          <DataList
            rows={[
              { label: 'Record created', value: formatDateTime(profile.createdAt) },
              { label: 'Record updated', value: formatDateTime(profile.updatedAt) },
              { label: 'Last sign-in', value: formatDateTime(profile.lastLoginAt) },
              {
                label: 'Email verified',
                value: user?.emailVerified === true ? 'Yes' : 'No — contact the registrar to verify',
              },
              {
                label: 'Record type',
                value: profile.isDemo ? 'Sample record (demonstration data)' : 'Registered student',
              },
            ]}
          />

          {profileStatus === 'ready' ? (
            <p className="dashboard__note">
              This page reads <code className="math-code">students/&#123;uid&#125;</code>, a private
              collection that only you can read. Firestore Security Rules reject any attempt to read
              another student&apos;s record, independently of what the interface does.
            </p>
          ) : null}
        </Card>
      </div>
    </AppShell>
  )
}

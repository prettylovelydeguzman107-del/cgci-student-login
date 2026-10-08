import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AuthLayout } from '../components/layout/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Spinner, Button } from '../components/ui/Button'
import { EmptyState, PeopleIcon } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/Card'
import { PredicateTrace } from '../components/auth/PredicateTrace'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { pluralise } from '../utils/format'
import { DEMO_DATA_NOTICE } from '../config/demo'
import type { AccountStatus, DirectoryEntry } from '../domain/credentialAlgebra'

type StatusFilter = 'all' | AccountStatus

const FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'disabled', label: 'Disabled' },
]

/**
 * Registered students — the "List of registered users" feature from the
 * presentation, and the concrete realisation of the set U.
 *
 * Exposed without authentication because `U` is not secret: it is the roster of
 * who may attempt to sign in. What must never be exposed is P or R, so this
 * view is served entirely from `studentDirectory`, which contains no email
 * address, no Firebase UID and no credential material of any kind.
 */
export function RegisteredStudentsPage() {
  useDocumentTitle('Registered students')

  const { registry } = useAuth()
  const [filter, setFilter] = useState<StatusFilter>('all')

  const all = useMemo(() => registry?.list() ?? [], [registry])
  const visible = useMemo(
    () => (filter === 'all' ? all : all.filter((entry) => entry.status === filter)),
    [all, filter],
  )

  const containsDemoData = all.some((entry) => entry.isDemo)
  const counts = useMemo(() => summarise(all), [all])

  return (
    <AuthLayout wide>
      <div className="form-page">
        <header className="form-page__intro">
          <p className="eyebrow">Set U</p>
          <h1 className="form-page__title">Registered students</h1>
          <p className="form-page__lede">
            Every account registered with the CGCI Student Portal. This roster is the set{' '}
            <span className="math-inline">U</span> from which the login predicate takes its first
            operand. Passwords are held only by Firebase Authentication and are never listed here.
          </p>
        </header>

        {containsDemoData ? <Alert tone="warning" title="Sample data" message={DEMO_DATA_NOTICE} /> : null}

        <div className="directory">
          <div className="directory__toolbar">
            <p className="directory__count" role="status">
              {registry === null ? (
                <>
                  <Spinner size="sm" /> Loading the roster…
                </>
              ) : (
                <>
                  Showing {pluralise(visible.length, 'student')} of {all.length} ·{' '}
                  {counts.active} active
                </>
              )}
            </p>

            <div className="segmented" role="group" aria-label="Filter by account status">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="segmented__option"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {registry === null ? (
            <ul className="directory__grid" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <li key={index} className="directory__card">
                  <div className="skeleton" style={{ height: '0.85rem', width: '40%' }} />
                  <div className="skeleton" style={{ height: '1.4rem', width: '70%', marginTop: 12 }} />
                  <div className="skeleton" style={{ height: '0.85rem', width: '55%', marginTop: 16 }} />
                </li>
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <div className="directory__empty card">
              <EmptyState
                icon={<PeopleIcon />}
                title="No students match this filter"
                message="Choose a different account status to see the rest of the roster."
                action={
                  <Button variant="secondary" onClick={() => setFilter('all')}>
                    Show all students
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="directory__grid">
              {visible.map((entry) => (
                <DirectoryCard entry={entry} key={entry.studentId} />
              ))}
            </ul>
          )}

          <PredicateTrace evaluation={null} registry={registry} />
        </div>

        <p className="form-page__footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

function DirectoryCard({ entry }: { entry: DirectoryEntry }) {
  return (
    <li className="directory__card">
      <div className="directory__card-head">
        <span className="directory__id">{entry.studentId}</span>
        <StatusBadge status={entry.status} />
      </div>

      <p className="directory__name">{entry.name}</p>

      <dl className="directory__meta">
        <div>
          <dt>Programme</dt>
          <dd>{entry.program}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>{entry.yearLevel}</dd>
        </div>
        <div>
          <dt>Section</dt>
          <dd>{entry.section}</dd>
        </div>
      </dl>

      {entry.isDemo ? (
        <p className="directory__flag">
          <span className="badge badge--demo">
            <span className="badge__dot" aria-hidden="true" />
            Sample record
          </span>
        </p>
      ) : null}
    </li>
  )
}

function summarise(entries: readonly DirectoryEntry[]): Record<StatusFilter, number> {
  return {
    all: entries.length,
    active: entries.filter((entry) => entry.status === 'active').length,
    pending: entries.filter((entry) => entry.status === 'pending').length,
    disabled: entries.filter((entry) => entry.status === 'disabled').length,
  }
}

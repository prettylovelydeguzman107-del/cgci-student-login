import { useState } from 'react'

import type { DirectoryEntry } from '../../domain/credentialAlgebra'

interface DemoCredentialsProps {
  /** Demo records from the public directory. */
  accounts: readonly DirectoryEntry[]
  /** The shared sample password for the seeded demo accounts. */
  password: string
  onSelect: (account: DirectoryEntry) => void
}

/**
 * Sample accounts for the project demonstration.
 *
 * Rendered only when the directory actually contains records flagged
 * `isDemo`, so removing the seed data removes this panel entirely. Every row
 * is labelled with what it demonstrates, which turns the panel into a
 * checklist for the presentation instead of a list of usable credentials.
 */
export function DemoCredentials({ accounts, password, onSelect }: DemoCredentialsProps) {
  const [open, setOpen] = useState(false)

  if (accounts.length === 0) return null

  return (
    <section className="demo" aria-labelledby="demo-heading">
      <button
        type="button"
        className="demo__toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="demo-panel"
      >
        <span className="demo__toggle-text">
          <span className="demo__badge">Sample data</span>
          <span id="demo-heading">Demo accounts</span>
        </span>
        <span className="demo__toggle-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      <div className="demo__panel" id="demo-panel" hidden={!open}>
        <p className="demo__note">
          Fictional records created for this academic project. Not real student data.
        </p>

        <ul className="demo__list">
          {accounts.map((account) => (
            <li className="demo__item" key={account.studentId}>
              <span className="demo__item-main">
                <code className="demo__id">{account.studentId}</code>
                <span className="demo__name">{account.name}</span>
              </span>

              <span className="demo__item-side">
                {account.status !== 'active' ? (
                  <span className="badge badge--disabled">
                    <span className="badge__dot" aria-hidden="true" />
                    {account.status === 'disabled' ? 'Suspended' : 'Unverified'}
                  </span>
                ) : (
                  <span className="badge badge--neutral">{account.section}</span>
                )}
                <button
                  type="button"
                  className="btn btn--secondary demo__use"
                  onClick={() => onSelect(account)}
                >
                  Use
                  <span className="sr-only">
                    {' '}
                    account {account.studentId} ({account.name})
                  </span>
                </button>
              </span>
            </li>
          ))}
        </ul>

        <p className="demo__password">
          Password for every sample account: <code>{password}</code>
        </p>

        <ul className="demo__scenarios">
          <li>
            <strong>Successful login</strong> — pick any active account above.
          </li>
          <li>
            <strong>Invalid password</strong> — use a valid ID with a wrong password.
          </li>
          <li>
            <strong>Unknown account</strong> — enter a Student ID outside the range, e.g. 2026-9999.
          </li>
          <li>
            <strong>Suspended account</strong> — select the student whose status is disabled.
          </li>
          <li>
            <strong>Protected route</strong> — while signed out, open <code>/dashboard</code> directly.
          </li>
        </ul>
      </div>
    </section>
  )
}

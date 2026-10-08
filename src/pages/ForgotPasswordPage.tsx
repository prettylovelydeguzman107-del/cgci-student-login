import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { AuthLayout } from '../components/layout/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { identifierHint, validateIdentifier } from '../domain/identifier'

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')

  const { sendPasswordReset } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (submitting) return

    // Password recovery only needs the identifier, so it uses the shared
    // identifier rules rather than the full credential validator.
    const validation = validateIdentifier(identifier)
    if (!validation.valid) {
      setFieldError(validation.message)
      return
    }

    setFieldError(undefined)
    setSubmitting(true)
    try {
      setSent(await sendPasswordReset(identifier))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="form-page">
        <header className="form-page__intro">
          <p className="eyebrow">Account recovery</p>
          <h1 className="form-page__title">Forgot your password?</h1>
          <p className="form-page__lede">
            Enter your Student ID and we will email a secure link to set a new password. The link is
            valid for a limited time and can only be used once.
          </p>
        </header>

        <form className="form-page__card" onSubmit={(e) => void handleSubmit(e)} noValidate>
          {sent ? (
            <Alert
              tone="success"
              title="Reset link sent"
              message="Check your inbox, including the spam folder, for the password reset email."
            />
          ) : null}

          <TextField
            label="Student ID"
            name="studentId"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value)
              if (fieldError !== undefined) setFieldError(undefined)
            }}
            error={fieldError}
            hint={identifierHint(identifier) ?? 'Format 2026-0001. An email address also works.'}
            placeholder="2026-0001"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="characters"
            disabled={submitting || sent}
            required
          />

          <Button type="submit" block loading={submitting} disabled={sent}>
            {submitting ? 'Sending link…' : 'Send reset link'}
          </Button>
        </form>

        <p className="form-page__footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

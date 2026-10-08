import { useId, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthLayout } from '../components/layout/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { PasswordField } from '../components/auth/PasswordField'
import { PredicateTrace } from '../components/auth/PredicateTrace'
import { DemoCredentials } from '../components/auth/DemoCredentials'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { identifierHint, validateCredentials } from '../domain/identifier'
import type { DirectoryEntry } from '../domain/credentialAlgebra'
import { DEMO_PASSWORD } from '../config/demo'

export function LoginPage() {
  useDocumentTitle('Sign in')

  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, feedback, setFeedback, registry, evaluation } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<{ field: 'identifier' | 'password'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const formId = useId()
  const identifierError = fieldError?.field === 'identifier' ? fieldError.message : undefined
  const passwordError = fieldError?.field === 'password' ? fieldError.message : undefined

  const demoAccounts: readonly DirectoryEntry[] = registry?.list().filter((e) => e.isDemo) ?? []

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (submitting) return

    // Client-side gate first: obviously invalid input never reaches Firebase.
    const validation = validateCredentials({ identifier, password })
    if (!validation.valid) {
      setFieldError({ field: validation.field, message: validation.message })
      setFeedback(null)
      return
    }

    setFieldError(null)
    setSubmitting(true)

    try {
      const result = await signIn(identifier, password)
      if (!result.ok) return

      const redirectTo = readRedirectTarget(location.search)
      navigate(redirectTo, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  function handleDemoSelect(account: DirectoryEntry): void {
    setIdentifier(account.studentId)
    setPassword(DEMO_PASSWORD)
    setFieldError(null)
    setFeedback(null)
  }

  return (
    <AuthLayout>
      <div className="login">
        <header className="login__header">
          <p className="eyebrow">Student Portal</p>
          <h1 className="login__title">Sign in</h1>
          <p className="login__lede">
            Enter your CGCI Student ID and password to verify your access to the student portal.
          </p>
        </header>

        <form className="login__form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <h2 className="sr-only" id={`${formId}-heading`}>
            Credentials
          </h2>

          {feedback !== null && feedback.tone === 'error' ? (
            <Alert tone="error" title={feedback.title} message={feedback.message} />
          ) : null}

          <TextField
            label="Student ID"
            name="studentId"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value)
              if (fieldError?.field === 'identifier') setFieldError(null)
            }}
            error={identifierError}
            hint={identifierHint(identifier) ?? 'Format 2026-0001. An email address also works.'}
            placeholder="2026-0001"
            autoComplete="username"
            inputMode="numeric"
            spellCheck={false}
            autoCapitalize="characters"
            disabled={submitting}
            required
          />

          <PasswordField
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value)
              if (fieldError?.field === 'password') setFieldError(null)
            }}
            error={passwordError}
            placeholder="Enter your password"
            disabled={submitting}
          />

          <div className="login__actions">
            <Button type="submit" block loading={submitting} loadingLabel="Signing in">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>

          <div className="login__links">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/registered-students">Registered students</Link>
          </div>
        </form>

        <div className="login__aside">
          <PredicateTrace evaluation={evaluation} registry={registry} />
          <DemoCredentials accounts={demoAccounts} password={DEMO_PASSWORD} onSelect={handleDemoSelect} />
        </div>
      </div>
    </AuthLayout>
  )
}

/** Only same-origin absolute paths are honoured, so `?redirect=` cannot be used as an open redirect. */
function readRedirectTarget(search: string): string {
  const requested = new URLSearchParams(search).get('redirect')
  if (requested === null) return '/dashboard'
  if (!requested.startsWith('/') || requested.startsWith('//')) return '/dashboard'
  return requested
}

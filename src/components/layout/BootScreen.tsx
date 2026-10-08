import { Spinner } from '../ui/Button'
import { Wordmark } from './Wordmark'

interface BootScreenProps {
  message?: string
}

/**
 * Shown while Firebase Authentication restores an existing session.
 * Branded, so the wait reads as part of the portal rather than a blank page.
 */
export function BootScreen({ message = 'Verifying your session…' }: BootScreenProps) {
  return (
    <div className="boot-screen">
      <Wordmark />
      <span className="boot-screen__mark">
        <Spinner size="lg" />
      </span>
      <p className="boot-screen__title" role="status">
        {message}
      </p>
      <p className="boot-screen__message">
        Checking your sign-in status with CGCI Student Authentication.
      </p>
    </div>
  )
}

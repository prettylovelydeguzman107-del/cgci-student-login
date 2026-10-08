import { AuthLayout } from '../components/layout/AuthLayout'
import { LinkButton } from '../components/ui/LinkButton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <AuthLayout>
      <div className="form-page">
        <header className="form-page__intro">
          <p className="eyebrow">Error 404</p>
          <h1 className="form-page__title">Page not found</h1>
          <p className="form-page__lede">
            The address you followed does not exist in the CGCI Student Portal. It may have been
            mistyped, or the link may be out of date.
          </p>
        </header>

        <div className="form-page__card">
          <LinkButton to="/" block>
            Return to the portal
          </LinkButton>
        </div>
      </div>
    </AuthLayout>
  )
}
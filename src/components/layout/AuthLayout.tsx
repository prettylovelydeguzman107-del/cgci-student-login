import type { ReactNode } from 'react'

import { Wordmark } from './Wordmark'
import { LOGIN_PREDICATE } from '../../domain/credentialAlgebra'

interface AuthLayoutProps {
  children: ReactNode
  /** Widens the main column for the directory and similar list screens. */
  wide?: boolean
}

/**
 * Shell for unauthenticated screens.
 *
 * On small screens this is a compact institutional band above a single centred
 * column. From 1024px it becomes the two-panel arrangement a college portal
 * would use: institutional statement on the left, the task on the right. The
 * formalisation of the login predicate is printed on that panel, which keeps
 * the mathematics visible without competing with the form.
 */
export function AuthLayout({ children, wide = false }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand on-dark">
        <div className="auth-layout__brand-inner">
          <Wordmark inverse />

          <div className="auth-layout__context">
            <p className="brand-statement__eyebrow">Discrete Structures 1 · Final Project</p>
            <h1 className="brand-statement__title">Student Login</h1>
            <p className="brand-statement__body">
              The gateway that verifies whether a registered student can successfully log into the CGCI
              portal.
            </p>

            <div className="brand-formula">
              <p className="brand-formula__caption">Formalisation</p>
              <p className="brand-formula__expr">{LOGIN_PREDICATE}</p>
              <dl className="brand-formula__legend">
                <dt>U</dt>
                <dd>Set of all registered usernames.</dd>
                <dt>P</dt>
                <dd>Set of valid encrypted passwords.</dd>
                <dt>R ⊆ U × P</dt>
                <dd>Relation of valid credential pairs, resolved in O(1) average time.</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <main className="auth-layout__main" id="main-content">
        <div className={wide ? 'auth-layout__panel auth-layout__panel--wide' : 'auth-layout__panel'}>
          {children}
        </div>
      </main>
    </div>
  )
}
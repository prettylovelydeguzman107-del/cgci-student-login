import {
  CONJUNCTION_TRUTH_TABLE,
  LOGIN_PREDICATE,
  type CredentialRegistry,
  type LoginEvaluation,
} from '../../domain/credentialAlgebra'

interface PredicateTraceProps {
  /** Result of the most recent attempt; `null` before the first submission. */
  evaluation: LoginEvaluation | null
  registry: CredentialRegistry | null
}

/**
 * Live view of `LoginSuccess(u, p) = (u ∈ U) ∧ ((u, p) ∈ R)`.
 *
 * This is the demonstration centrepiece for the discrete-structures side of
 * the project: after each attempt the two conjuncts are shown individually,
 * with the component that evaluated each one and the reason for its value.
 * A short-circuit (`u ∉ U`) is called out explicitly, because "the second
 * operand was never evaluated" is the interesting behaviour of `∧`.
 */
export function PredicateTrace({ evaluation, registry }: PredicateTraceProps) {
  const metrics = registry?.metrics() ?? null

  return (
    <details className="trace">
      <summary className="trace__summary">
        <span className="trace__summary-text">
          <span className="trace__summary-title">Formal evaluation</span>
          <span className="trace__summary-subtitle">How the login decision was reached</span>
        </span>
        <ChevronIcon />
      </summary>

      <div className="trace__body">
        <p className="trace__formula">{LOGIN_PREDICATE}</p>

        {evaluation === null ? (
          <p className="trace__idle">
            Submit the form to evaluate the predicate for the identifier you entered. The credential
            itself is never examined in the browser — only whether the username is an element of{' '}
            <span className="trace__symbol">U</span>.
          </p>
        ) : (
          <>
            <p className="trace__subject">
              Evaluating for <span className="trace__symbol">u</span> ={' '}
              <span className="trace__value">{evaluation.username || '(empty)'}</span>
            </p>

            <ol className="trace__conjuncts">
              {evaluation.conjuncts.map((conjunct) => (
                <li className="trace__conjunct" key={conjunct.id}>
                  <span className={`trace__marker trace__marker--${conjunct.value}`}>
                    {conjunct.value === true ? (
                      <CheckIcon />
                    ) : conjunct.value === false ? (
                      <CrossIcon />
                    ) : (
                      <DashIcon />
                    )}
                    <span className="sr-only">
                      {conjunct.value === true
                        ? 'true'
                        : conjunct.value === false
                          ? 'false'
                          : 'not evaluated'}
                    </span>
                  </span>

                  <span className="trace__conjunct-body">
                    <span className="trace__conjunct-head">
                      <code className="trace__expression">{conjunct.expression}</code>
                      <span className="trace__owner">{conjunct.owner === 'client' ? 'this app' : 'Firebase Auth'}</span>
                    </span>
                    <span className="trace__conjunct-label">{conjunct.label}</span>
                    <span className="trace__conjunct-note">{conjunct.explanation}</span>
                  </span>
                </li>
              ))}
            </ol>

            <p className={`trace__result trace__result--${evaluation.result ? 'true' : 'false'}`}>
              <span className="trace__result-label">Result</span>
              <span className="trace__result-value">
                LoginSuccess = {evaluation.result ? '1 (True)' : '0 (False)'}
              </span>
              <span className="trace__result-note">{evaluation.conclusion}</span>
            </p>

            {evaluation.shortCircuited ? (
              <p className="trace__shortcircuit">
                Short-circuit: because <code>(u ∈ U)</code> evaluated to false,{' '}
                <code>((u, p) ∈ R)</code> is not evaluated. The credential is still checked by Firebase
                Authentication, so the response does not reveal whether an account exists.
              </p>
            ) : null}
          </>
        )}

        {metrics !== null ? (
          <div className="trace__stats">
            <p className="trace__stats-title">Hash map holding U → account</p>
            <dl className="trace__stats-grid">
              <div>
                <dt>|U|</dt>
                <dd>{metrics.usernames}</dd>
              </div>
              <div>
                <dt>Buckets</dt>
                <dd>{metrics.capacity}</dd>
              </div>
              <div>
                <dt>Load factor</dt>
                <dd>{metrics.loadFactor.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Avg probes / lookup</dt>
                <dd>{metrics.averageProbeLength.toFixed(2)}</dd>
              </div>
            </dl>
            <p className="trace__stats-note">
              Average probes stay near 1 as the table grows, which is the observable form of the
              O(1) average credential lookup.
            </p>
          </div>
        ) : null}

        <details className="trace__legend">
          <summary className="trace__legend-summary">Truth table for p ∧ q</summary>
          <table className="trace__table">
            <caption className="sr-only">Conjunction is true only when both operands are true</caption>
            <thead>
              <tr>
                <th scope="col">
                  <code>p</code> <span className="trace__table-amp">∧</span> <code>q</code>
                </th>
                <th scope="col">p ∧ q</th>
              </tr>
            </thead>
            <tbody>
              {CONJUNCTION_TRUTH_TABLE.map((row) => (
                <tr key={`${row.p}-${row.q}`}>
                  <td>
                    {row.p ? '1' : '0'} <span className="trace__table-amp">∧</span> {row.q ? '1' : '0'}
                  </td>
                  <td className={row.result ? 'trace__table-true' : 'trace__table-false'}>
                    {row.result ? '1' : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </details>
  )
}

function ChevronIcon() {
  return (
    <svg className="trace__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6.5l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.3l2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3.2 3.2l5.6 5.6M8.8 3.2l-5.6 5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Institutional wordmark: the college seal plus the name of the portal.
 *
 * The seal prefers the official artwork and falls back to an inline mark — see
 * {@link InstitutionSeal}. To use the official logo, save it as
 * `public/cgci-logo.png`; nothing else needs to change.
 */

import { InstitutionSeal } from './InstitutionSeal'

interface WordmarkProps {
  /** Renders on the dark institutional panel. */
  inverse?: boolean
  /** Hides the "Student Portal" sub-line, e.g. in tight app bars. */
  compact?: boolean
}

export function Wordmark({ inverse = false, compact = false }: WordmarkProps) {
  return (
    <span className={`wordmark${inverse ? ' wordmark--inverse' : ''}`}>
      <span className={`wordmark__seal${inverse ? ' wordmark__seal--inverse' : ''}`}>
        <InstitutionSeal className="wordmark__seal-image" />
      </span>
      <span className="wordmark__text">
        <span className="wordmark__institution">Core Gateway College Inc.</span>
        {compact ? null : <span className="wordmark__portal">Student Portal</span>}
      </span>
    </span>
  )
}

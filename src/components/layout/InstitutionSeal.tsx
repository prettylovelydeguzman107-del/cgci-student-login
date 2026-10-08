import { useState } from 'react'

/**
 * The Core Gateway College Inc. seal.
 *
 * Prefers the official artwork at `/cgci-logo.png` (referenced by index.html
 * and favicon as well). If that file is absent the inline SVG mark below is
 * rendered instead, so a missing asset degrades to a clean institutional
 * placeholder rather than a broken-image icon.
 *
 * To install the official logo: save it as `public/cgci-logo.png`. No code
 * change is required.
 */
export function InstitutionSeal({ className }: { className?: string | undefined }) {
  const [artworkMissing, setArtworkMissing] = useState(false)

  if (!artworkMissing) {
    return (
      <img
        src="/cgci-logo.png"
        alt=""
        className={className}
        width={44}
        height={44}
        decoding="async"
        onError={() => setArtworkMissing(true)}
      />
    )
  }

  return <FallbackSeal className={className} />
}

function FallbackSeal({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <circle cx="22" cy="22" r="20.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="22" r="14.6" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      {/* Open book: two pages meeting at the spine. */}
      <path
        d="M13.4 19.2c2.9-.4 5.6.3 8.6 1.6v9.9c-3-1.4-5.7-1.8-8.6-1.4v-10.1z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M30.6 19.2c-2.9-.4-5.6.3-8.6 1.6v9.9c3-1.4 5.7-1.8 8.6-1.4v-10.1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

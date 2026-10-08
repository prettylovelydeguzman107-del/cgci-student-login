import type { ReactNode } from 'react'

export interface DataListRow {
  readonly label: string
  readonly value: ReactNode
  /** Render in a monospaced face — used for IDs and identifiers. */
  mono?: boolean
  /** De-emphasise the value, e.g. when it is genuinely unavailable. */
  muted?: boolean
}

/**
 * Definition list. Renders as a single column on small screens and two columns
 * from 640px, which keeps long values readable on a 360px screen without
 * truncating them.
 */
export function DataList({ rows }: { rows: readonly DataListRow[] }) {
  return (
    <dl className="datalist">
      {rows.map((row) => (
        <div className="datalist__row" key={row.label}>
          <dt className="datalist__label">{row.label}</dt>
          <dd
            className={[
              'datalist__value',
              row.mono === true ? 'datalist__value--mono' : '',
              row.muted === true ? 'datalist__value--muted' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
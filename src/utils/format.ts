/**
 * Presentation-only formatting helpers.
 */

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(value: Date | null): string {
  if (value === null) return '—'
  return dateTimeFormatter.format(value)
}

/** Show only the tail of a Firebase UID; it identifies an account but grants no access. */
export function maskUid(uid: string): string {
  return uid.length <= 8 ? uid : `…${uid.slice(-8)}`
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** "Juan Dela Cruz" → "JC", for the compact avatar in the app bar. */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : ''
  return (first + last).toUpperCase()
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}
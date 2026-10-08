/**
 * Project metadata.
 *
 * Kept in one place so the credit shown in the interface, the documentation and
 * the generated PDF all read from the same source.
 */

export const PROJECT_DEVELOPERS = ['Pretty Lovely Deguzman', 'Kevin Malto'] as const

export const PROJECT_TITLE = 'CGCI Student Login'
export const PROJECT_COURSE = 'Discrete Structures 1 — Final Project'
export const INSTITUTION_NAME = 'Core Gateway College Inc.'
export const PORTAL_NAME = 'Student Portal'

/** "Pretty Lovely Deguzman and Kevin Malto" */
export function formatDeveloperCredit(names: readonly string[] = PROJECT_DEVELOPERS): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

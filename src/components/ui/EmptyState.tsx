import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message: string
  action?: ReactNode
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon !== undefined ? <span className="empty-state__icon">{icon}</span> : null}
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__message">{message}</p>
      {action}
    </div>
  )
}

export function PeopleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M17 11.5a3.2 3.2 0 0 0 0-6.4M22 19v-1.5a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 2.8l7.5 3v5.4c0 4.4-3 8.4-7.5 9.6-4.5-1.2-7.5-5.2-7.5-9.6V5.8l7.5-3z" strokeLinejoin="round" />
      <path d="M9 12.2l2.2 2.2L15.2 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InboxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 4.8h11.6l3.2 8.7V19a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19v-5.5l3.2-8.7z" strokeLinejoin="round" />
    </svg>
  )
}
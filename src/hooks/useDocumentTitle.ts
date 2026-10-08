import { useEffect } from 'react'

/**
 * Keep the document title in step with the current screen. Cheap, but it is the
 * difference between a portal and a tab that still says "Vite + React".
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · CGCI Student Portal`
    return () => {
      document.title = previous
    }
  }, [title])
}
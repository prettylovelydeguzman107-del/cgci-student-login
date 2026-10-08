import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query.
 *
 * Built on `useSyncExternalStore` rather than `useState` + `useEffect`, which
 * is the correct primitive for an external store: it reads the current value
 * during render, so there is no flash of a stale match and no cascading render
 * on mount.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || !('matchMedia' in window)) return () => {}

      const list = window.matchMedia(query)
      list.addEventListener('change', onStoreChange)
      return () => list.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return false
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Matches the mobile-first layout breakpoint (below 768px). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 47.99rem)')
}

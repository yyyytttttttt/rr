'use client'
import { useMemo } from 'react'

// --app-vh is set globally by the inline script in layout.js.
// This hook only returns the style object — no duplicate listeners.
export function useVh100() {
  return useMemo(() => ({ height: 'calc(var(--app-vh, 1vh) * 100)' }), [])
}

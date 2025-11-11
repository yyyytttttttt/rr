
'use client'
import { useEffect, useMemo } from 'react'

export function useVh100() {
  useEffect(() => {
    const set = () => {
      
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--app-vh', `${vh}px`)
    }
    set()
    window.addEventListener('resize', set)
    window.addEventListener('orientationchange', set)
    return () => {
      window.removeEventListener('resize', set)
      window.removeEventListener('orientationchange', set)
    }
  }, [])

 
  return useMemo(() => ({ height: 'calc(var(--app-vh, 1vh) * 100)' }), [])
}

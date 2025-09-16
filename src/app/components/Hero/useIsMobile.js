'use client'
import { useEffect, useState } from 'react'

export default function useIsMobile(maxWidth = 480) {
  const [is, set] = useState(false)
  useEffect(() => {
    const on = () => set(window.innerWidth <= maxWidth)
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [maxWidth])
  return is
}

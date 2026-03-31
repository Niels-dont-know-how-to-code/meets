import { useState, useEffect } from 'react'
import { DEFAULT_CENTER } from '../lib/constants'

export function useGeolocation() {
  const [position, setPosition] = useState(DEFAULT_CENTER)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setLoading(false)
      },
      () => {
        // On error or denial, keep DEFAULT_CENTER
        setLoading(false)
      },
      { timeout: 3000 }
    )
  }, [])

  return { position, loading }
}

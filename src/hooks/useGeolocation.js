import { useState, useEffect } from 'react'
import { DEFAULT_CENTER } from '../lib/constants'

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(DEFAULT_CENTER)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setLoading(false)
      },
      () => {
        // On error or denial, fall back to Leuven
        setPosition(DEFAULT_CENTER)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { position, loading }
}

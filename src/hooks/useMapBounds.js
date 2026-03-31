import { useCallback } from 'react'
import { useMapEvents } from 'react-leaflet'

/**
 * MapBoundsTracker — a component that must be rendered inside a MapContainer.
 * Listens for `moveend` events (which also fire after zoom) and reports the
 * current viewport bounds back to the parent through `onBoundsChange`.
 *
 * Usage:
 *   <MapContainer ...>
 *     <MapBoundsTracker onBoundsChange={(bounds) => setBounds(bounds)} />
 *   </MapContainer>
 */
export function MapBoundsTracker({ onBoundsChange }) {
  const handleMoveEnd = useCallback(
    (e) => {
      if (onBoundsChange) {
        const bounds = e.target.getBounds()
        onBoundsChange(bounds)
      }
    },
    [onBoundsChange],
  )

  useMapEvents({
    moveend: handleMoveEnd,
  })

  return null
}

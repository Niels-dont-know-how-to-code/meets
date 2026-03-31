import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { MapBoundsTracker } from '../../hooks/useMapBounds'
import EventMarker from './EventMarker'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../lib/constants'

/**
 * Inner component that flies the map to a new center whenever the
 * `center` prop changes.
 */
function MapRecenter({ center, flyTarget }) {
  const map = useMap()
  const prevCenter = useRef(center)
  const prevFlyTarget = useRef(null)

  useEffect(() => {
    if (!center) return
    const [lat, lng] = center
    const [pLat, pLng] = prevCenter.current || []

    if (lat !== pLat || lng !== pLng) {
      map.flyTo(center, map.getZoom(), { duration: 0.8 })
      prevCenter.current = center
    }
  }, [center, map])

  useEffect(() => {
    if (!flyTarget) return
    if (flyTarget._t !== prevFlyTarget.current) {
      map.flyTo([flyTarget.lat, flyTarget.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
      prevFlyTarget.current = flyTarget._t
    }
  }, [flyTarget, map])

  return null
}

export default function MapView({
  events = [],
  selectedEvent = null,
  onMarkerClick,
  onBoundsChange,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  flyTarget = null,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      <MapRecenter center={center} flyTarget={flyTarget} />
      <MapBoundsTracker onBoundsChange={onBoundsChange} />

      {events.map((event) => (
        <EventMarker
          key={event.id}
          event={event}
          isSelected={selectedEvent?.id === event.id}
          onClick={onMarkerClick}
        />
      ))}
    </MapContainer>
  )
}

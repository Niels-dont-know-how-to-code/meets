import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, MapPin, Crosshair } from 'lucide-react'
import { searchAddress } from '../../lib/geocoding'
import { DEFAULT_CENTER, DEFAULT_ZOOM, CATEGORY_COLORS } from '../../lib/constants'

// Simple red marker icon for the selected location
const selectedIcon = L.divIcon({
  className: '',
  html: `
    <div class="marker-pin" style="background-color: ${CATEGORY_COLORS.party};">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
           fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

/**
 * Tiny helper that pans/zooms the picker map when the selected location
 * changes from outside (e.g. geolocation or suggestion click).
 */
function PickerRecenter({ center }) {
  const map = useMap()
  const prevRef = useRef(center)

  useEffect(() => {
    if (
      center &&
      (!prevRef.current ||
        center[0] !== prevRef.current[0] ||
        center[1] !== prevRef.current[1])
    ) {
      map.flyTo(center, 16, { duration: 0.6 })
    }
    prevRef.current = center
  }, [center, map])

  return null
}

export default function LocationPicker({ value, onChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Use a stable initial center so MapContainer only mounts once
  const initialCenter = useMemo(() => DEFAULT_CENTER, [])

  // --- Search ---
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await searchAddress(searchQuery.trim())
      setSuggestions(results)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  // --- Select suggestion ---
  const handleSelect = useCallback(
    (suggestion) => {
      onChange({
        lat: suggestion.lat,
        lng: suggestion.lon,
        address_label: suggestion.display_name,
      })
      setSuggestions([])
      setSearchQuery(suggestion.display_name)
    },
    [onChange],
  )

  // --- Use my location ---
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address_label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        })
        setSuggestions([])
      },
      (err) => {
        console.error('Geolocation error:', err)
      },
    )
  }, [onChange])

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a location..."
              className="w-full pl-9 pr-3 py-2.5 bg-surface-secondary rounded-xl text-sm
                         border border-gray-100 focus:outline-none focus:ring-2
                         focus:ring-meets-500/30 focus:border-meets-400 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>

          <button
            type="button"
            onClick={handleUseMyLocation}
            title="Use my location"
            className="floating-btn flex items-center justify-center"
          >
            <Crosshair className="w-4 h-4 text-ink-secondary" />
          </button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-float
                         border border-gray-100 overflow-hidden max-h-52 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-secondary
                             flex items-start gap-2 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-meets-500 mt-0.5 shrink-0" />
                  <span className="text-ink-secondary leading-snug line-clamp-2">
                    {s.display_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected label */}
      {value && (
        <p className="text-xs text-ink-tertiary flex items-center gap-1.5 px-1">
          <MapPin className="w-3.5 h-3.5 text-meets-500" />
          <span className="truncate">{value.address_label}</span>
        </p>
      )}

      {/* Mini map */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-card"
           style={{ height: 300 }}>
        <MapContainer
          key="location-picker-map"
          center={initialCenter}
          zoom={DEFAULT_ZOOM}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <PickerRecenter center={value ? [value.lat, value.lng] : null} />

          {value && (
            <Marker position={[value.lat, value.lng]} icon={selectedIcon} />
          )}
        </MapContainer>
      </div>
    </div>
  )
}

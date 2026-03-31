import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants'

// Lucide icon SVG paths (24x24 viewBox) — inlined so we can embed them in the
// divIcon HTML string without needing React rendering.
const ICON_SVGS = {
  party: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>`,
  culture: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="white"/><circle cx="17.5" cy="10.5" r=".5" fill="white"/><circle cx="8.5" cy="7.5" r=".5" fill="white"/><circle cx="6.5" cy="12.5" r=".5" fill="white"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  sports: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

export default function EventMarker({ event, isSelected, onClick }) {
  const icon = useMemo(() => {
    const category = event.category || 'party'
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.party
    const svg = ICON_SVGS[category] || ICON_SVGS.party

    return L.divIcon({
      className: '',
      html: `
        <div class="marker-wrapper">
          <div class="marker-pin ${category}" style="background-color: ${color};">
            ${svg}
          </div>
          <div class="marker-pointer" style="border-top-color: ${color};"></div>
        </div>
      `,
      iconSize: [40, 52],
      iconAnchor: [20, 52],
      popupAnchor: [0, -52],
    })
  }, [event.category])

  const position = [event.lat, event.lng]

  const category = event.category || 'party'
  const label = CATEGORY_LABELS[category] || category
  const bgColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.party

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div
          className="p-4 min-w-[220px] cursor-pointer"
          onClick={() => onClick && onClick(event)}
        >
          <span
            className="category-badge text-white text-[10px] uppercase tracking-wider mb-2 inline-block"
            style={{ backgroundColor: bgColor }}
          >
            {label}
          </span>

          <h3 className="font-display font-bold text-sm text-ink leading-snug mb-1.5">
            {event.title}
          </h3>

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-secondary font-medium">
              {formatTime(event.start_time)} – {formatTime(event.end_time)}
            </p>

            {event.interested_count != null && (
              <span className="text-xs text-ink-tertiary font-medium">
                {event.interested_count} interested
              </span>
            )}
          </div>

          <p className="text-xs text-meets-500 font-display font-semibold mt-2 hover:underline">
            View details &rarr;
          </p>
        </div>
      </Popup>
    </Marker>
  )
}

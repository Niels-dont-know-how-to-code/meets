/**
 * Build a Google Calendar "Add Event" URL.
 * Google expects dates in "YYYYMMDDTHHMMSS" format (local time).
 */
export function buildGoogleCalendarUrl(event) {
  const { title, description, date, start_time, end_time, address_label } = event

  // date = "2026-04-01", start_time = "20:00:00+02" → "20260401T200000"
  const dateClean = date.replace(/-/g, '')
  const startClean = (start_time || '').slice(0, 8).replace(/:/g, '')
  const endClean = (end_time || '').slice(0, 8).replace(/:/g, '')

  const dtStart = `${dateClean}T${startClean}`
  const dtEnd = `${dateClean}T${endClean}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || '',
    dates: `${dtStart}/${dtEnd}`,
    details: description || '',
    location: address_label || '',
  })

  return `https://www.google.com/calendar/render?${params.toString()}`
}

import { format, isToday as isTodayFns, isTomorrow, addDays, subDays, startOfDay } from 'date-fns'

export function formatTime(timeStr) {
  // Takes a timetz string like "20:00:00+01" and returns "20:00"
  return timeStr.slice(0, 5)
}

export function formatDate(date) {
  // Returns "Mon, 31 Mar" format
  return format(date, 'EEE, d MMM')
}

export function formatDateForApi(date) {
  // Returns "2026-03-31" format for Supabase queries
  return format(date, 'yyyy-MM-dd')
}

export function isToday(date) {
  return isTodayFns(date)
}

export function getNextDay(date) {
  return addDays(date, 1)
}

export function getPrevDay(date) {
  const prev = subDays(date, 1)
  const today = startOfDay(new Date())
  return prev < today ? today : prev
}

export function formatDateShort(date) {
  if (isTodayFns(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, d MMM')
}

export function isHappeningNow(startTime, endTime, eventDate) {
  if (!startTime || !endTime || !eventDate) return false
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  if (eventDate !== today) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = startTime.slice(0, 5).split(':').map(Number)
  const [eh, em] = endTime.slice(0, 5).split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em

  return currentMinutes >= startMin && currentMinutes <= endMin
}

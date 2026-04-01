import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatTime,
  formatDate,
  formatDateForApi,
  isToday,
  getNextDay,
  getPrevDay,
  formatDateShort,
  isHappeningNow,
} from '../dateUtils'

describe('formatTime', () => {
  it('extracts HH:MM from a timetz string', () => {
    expect(formatTime('20:00:00+01')).toBe('20:00')
  })

  it('handles midnight', () => {
    expect(formatTime('00:00:00+00')).toBe('00:00')
  })

  it('handles single-digit hours in padded format', () => {
    expect(formatTime('09:30:00+02')).toBe('09:30')
  })
})

describe('formatDate', () => {
  it('returns "EEE, d MMM" format', () => {
    const date = new Date(2026, 2, 31) // March 31, 2026
    expect(formatDate(date)).toBe('Tue, 31 Mar')
  })

  it('handles single-digit day', () => {
    const date = new Date(2026, 0, 5) // Jan 5, 2026
    expect(formatDate(date)).toBe('Mon, 5 Jan')
  })
})

describe('formatDateForApi', () => {
  it('returns yyyy-MM-dd format', () => {
    const date = new Date(2026, 2, 31)
    expect(formatDateForApi(date)).toBe('2026-03-31')
  })

  it('zero-pads month and day', () => {
    const date = new Date(2026, 0, 5)
    expect(formatDateForApi(date)).toBe('2026-01-05')
  })
})

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday)).toBe(false)
  })
})

describe('getNextDay', () => {
  it('returns the next day', () => {
    const date = new Date(2026, 2, 31)
    const next = getNextDay(date)
    expect(next.getDate()).toBe(1)
    expect(next.getMonth()).toBe(3) // April
  })
})

describe('getPrevDay', () => {
  it('returns the previous day when it is after today', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const prev = getPrevDay(futureDate)
    expect(prev.getDate()).toBe(futureDate.getDate() - 1)
  })

  it('clamps to today when previous day would be in the past', () => {
    const today = new Date()
    const prev = getPrevDay(today)
    // Should return today (clamped)
    expect(prev.getDate()).toBe(today.getDate())
  })
})

describe('formatDateShort', () => {
  it('returns "Today" for today', () => {
    expect(formatDateShort(new Date())).toBe('Today')
  })

  it('returns "Tomorrow" for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(formatDateShort(tomorrow)).toBe('Tomorrow')
  })

  it('returns formatted date for other days', () => {
    const date = new Date(2026, 2, 31)
    expect(formatDateShort(date)).toBe('Tue, 31 Mar')
  })
})

describe('isHappeningNow', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false when arguments are missing', () => {
    expect(isHappeningNow(null, '21:00:00+01', '2026-04-01')).toBe(false)
    expect(isHappeningNow('20:00:00+01', null, '2026-04-01')).toBe(false)
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', null)).toBe(false)
  })

  it('returns false when event is not today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 1, 20, 30)) // April 1, 20:30
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', '2026-04-02')).toBe(false)
  })

  it('returns true when current time is within the event window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 1, 20, 30)) // April 1, 20:30
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', '2026-04-01')).toBe(true)
  })

  it('returns false when current time is before the event', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 1, 19, 0)) // April 1, 19:00
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', '2026-04-01')).toBe(false)
  })

  it('returns false when current time is after the event', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 1, 22, 0)) // April 1, 22:00
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', '2026-04-01')).toBe(false)
  })

  it('returns true at exact start time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 1, 20, 0))
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', '2026-04-01')).toBe(true)
  })

  it('returns true at exact end time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 1, 21, 0))
    expect(isHappeningNow('20:00:00+01', '21:00:00+01', '2026-04-01')).toBe(true)
  })
})

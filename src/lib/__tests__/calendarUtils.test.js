import { describe, it, expect } from 'vitest'
import { buildGoogleCalendarUrl } from '../calendarUtils'

describe('buildGoogleCalendarUrl', () => {
  const fullEvent = {
    title: 'Chess Night',
    description: 'Come play chess with us!',
    date: '2026-04-01',
    start_time: '19:00:00+02',
    end_time: '21:00:00+02',
    address_label: 'Oude Markt, Leuven',
  }

  it('returns a URL starting with https://www.google.com/calendar/render', () => {
    const url = buildGoogleCalendarUrl(fullEvent)
    expect(url).toMatch(/^https:\/\/www\.google\.com\/calendar\/render\?/)
  })

  it('includes title as text param', () => {
    const url = new URL(buildGoogleCalendarUrl(fullEvent))
    expect(url.searchParams.get('text')).toBe('Chess Night')
  })

  it('includes formatted dates as dates param (YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS)', () => {
    const url = new URL(buildGoogleCalendarUrl(fullEvent))
    const dates = url.searchParams.get('dates')
    expect(dates).toBe('20260401T190000/20260401T210000')
  })

  it('includes description as details param', () => {
    const url = new URL(buildGoogleCalendarUrl(fullEvent))
    expect(url.searchParams.get('details')).toBe('Come play chess with us!')
  })

  it('includes address_label as location param', () => {
    const url = new URL(buildGoogleCalendarUrl(fullEvent))
    expect(url.searchParams.get('location')).toBe('Oude Markt, Leuven')
  })

  it('handles missing/empty fields gracefully', () => {
    const minimalEvent = {
      date: '2026-04-01',
      start_time: '',
      end_time: '',
    }

    const url = new URL(buildGoogleCalendarUrl(minimalEvent))
    expect(url.searchParams.get('text')).toBe('')
    expect(url.searchParams.get('details')).toBe('')
    expect(url.searchParams.get('location')).toBe('')
    // Should not throw
    expect(url.searchParams.get('dates')).toBeDefined()
  })
})

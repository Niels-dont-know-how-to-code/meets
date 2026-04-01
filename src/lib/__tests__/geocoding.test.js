import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchAddress } from '../geocoding'

describe('searchAddress', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Reset the rate limiter by advancing time
    vi.useFakeTimers()
    vi.advanceTimersByTime(2000)
    vi.useRealTimers()
  })

  it('returns empty array for empty query', async () => {
    expect(await searchAddress('')).toEqual([])
    expect(await searchAddress(null)).toEqual([])
    expect(await searchAddress(undefined)).toEqual([])
  })

  it('returns empty array for query shorter than 3 characters', async () => {
    expect(await searchAddress('ab')).toEqual([])
    expect(await searchAddress('  a ')).toEqual([])
  })

  it('calls Nominatim API and returns mapped results', async () => {
    const mockResponse = [
      { display_name: 'Leuven, Belgium', lat: '50.8798', lon: '4.7005' },
      { display_name: 'Leuven Station', lat: '50.8815', lon: '4.7155' },
    ]

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    })

    const results = await searchAddress('Leuven')

    expect(global.fetch).toHaveBeenCalledOnce()
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.objectContaining({
        headers: { 'User-Agent': 'Meets-App/1.0 (student project)' },
      })
    )

    expect(results).toEqual([
      { display_name: 'Leuven, Belgium', lat: 50.8798, lon: 4.7005 },
      { display_name: 'Leuven Station', lat: 50.8815, lon: 4.7155 },
    ])
  })

  it('returns empty array on fetch error', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const results = await searchAddress('Leuven')
    expect(results).toEqual([])
  })

  it('encodes the query parameter', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    })

    await searchAddress('Oude Markt Leuven')

    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('Oude%20Markt%20Leuven')
  })
})

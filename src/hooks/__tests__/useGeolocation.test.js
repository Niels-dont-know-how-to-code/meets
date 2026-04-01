import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGeolocation } from '../useGeolocation'
import { DEFAULT_CENTER } from '../../lib/constants'

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to DEFAULT_CENTER when geolocation is unavailable', async () => {
    const originalGeo = navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.position).toEqual(DEFAULT_CENTER)

    Object.defineProperty(navigator, 'geolocation', { value: originalGeo, configurable: true })
  })

  it('uses browser position on success', async () => {
    const mockPosition = {
      coords: { latitude: 51.05, longitude: 3.72 },
    }

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) => success(mockPosition)),
      },
      configurable: true,
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.position).toEqual([51.05, 3.72])
  })

  it('falls back to DEFAULT_CENTER on geolocation error', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_success, error) => error(new Error('denied'))),
      },
      configurable: true,
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.position).toEqual(DEFAULT_CENTER)
  })
})

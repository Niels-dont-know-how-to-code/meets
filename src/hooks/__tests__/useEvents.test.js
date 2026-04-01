import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock Supabase
const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockGetSession = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    from: (...args) => mockFrom(...args),
    auth: {
      getSession: (...args) => mockGetSession(...args),
    },
  },
}))

import { useEvents } from '../useEvents'

// Helper to build chainable query mock
function chainable(resolvedValue) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(resolvedValue)),
    then: (resolve) => resolve(resolvedValue),
  }
  // Make the chain itself thenable for awaits without .single()
  return chain
}

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
  })

  const sampleEvents = [
    {
      id: 'evt-1',
      title: 'Chess Night',
      category: 'culture',
      start_time: '19:00:00+01',
      end_time: '21:00:00+01',
      date: '2026-04-01',
      lat: 50.88,
      lng: 4.70,
      interested_count: 3,
    },
    {
      id: 'evt-2',
      title: 'Running Club',
      category: 'sports',
      start_time: '08:00:00+01',
      end_time: '09:00:00+01',
      date: '2026-04-01',
      lat: 50.87,
      lng: 4.71,
      interested_count: 7,
    },
  ]

  it('fetches events on mount with the selected date', async () => {
    mockRpc.mockResolvedValue({ data: sampleEvents, error: null })

    const date = new Date(2026, 3, 1) // April 1, 2026
    const { result } = renderHook(() => useEvents(date))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockRpc).toHaveBeenCalledWith('get_events_with_details', {
      target_date: '2026-04-01',
    })
    expect(result.current.events).toEqual(sampleEvents)
    expect(result.current.error).toBeNull()
  })

  it('sets error state on RPC failure', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('RPC failed')
    expect(result.current.events).toEqual([])
  })

  it('fetches user interests when authenticated', async () => {
    mockRpc.mockResolvedValue({ data: sampleEvents, error: null })
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })

    const mockInterestsChain = chainable({
      data: [{ event_id: 'evt-1' }],
      error: null,
    })
    mockFrom.mockReturnValue(mockInterestsChain)

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.userInterests.has('evt-1')).toBe(true)
    expect(result.current.userInterests.has('evt-2')).toBe(false)
  })

  it('createEvent inserts event via Supabase', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const insertChain = chainable({ data: { id: 'new-1' }, error: null })
    mockFrom.mockReturnValue(insertChain)

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => expect(result.current.loading).toBe(false))

    let res
    await act(async () => {
      res = await result.current.createEvent({ title: 'New Event' })
    })

    expect(mockFrom).toHaveBeenCalledWith('events')
    expect(res.data).toEqual({ id: 'new-1' })
  })

  it('deleteEvent removes event via Supabase', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const deleteChain = chainable({ error: null })
    mockFrom.mockReturnValue(deleteChain)

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => expect(result.current.loading).toBe(false))

    let res
    await act(async () => {
      res = await result.current.deleteEvent('evt-1')
    })

    expect(mockFrom).toHaveBeenCalledWith('events')
    expect(res.success).toBe(true)
  })

  it('toggleInterest optimistically adds interest', async () => {
    mockRpc.mockResolvedValue({ data: sampleEvents, error: null })

    const insertChain = chainable({ error: null })
    mockFrom.mockReturnValue(insertChain)

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Toggle interest on (not currently interested)
    act(() => {
      result.current.toggleInterest('evt-1', 'user-1', false)
    })

    // Optimistic: count should increase by 1
    const event = result.current.events.find((e) => e.id === 'evt-1')
    expect(event.interested_count).toBe(4) // was 3
    expect(result.current.userInterests.has('evt-1')).toBe(true)
  })

  it('toggleInterest optimistically removes interest', async () => {
    mockRpc.mockResolvedValue({ data: sampleEvents, error: null })

    const deleteChain = chainable({ error: null })
    mockFrom.mockReturnValue(deleteChain)

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // First add the interest to userInterests so we can remove it
    act(() => {
      result.current.toggleInterest('evt-1', 'user-1', true)
    })

    const event = result.current.events.find((e) => e.id === 'evt-1')
    expect(event.interested_count).toBe(2) // was 3, decreased by 1
  })

  it('toggleInterest reverts on error', async () => {
    mockRpc.mockResolvedValue({ data: sampleEvents, error: null })

    // Make the insert fail
    const failChain = {
      insert: vi.fn(() => Promise.resolve({ error: { message: 'fail' } })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: { message: 'fail' } })) })) })),
    }
    mockFrom.mockReturnValue(failChain)

    const date = new Date(2026, 3, 1)
    const { result } = renderHook(() => useEvents(date))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Try to add interest (will fail)
    await act(async () => {
      result.current.toggleInterest('evt-2', 'user-1', false)
      // Wait for the async operation to complete
      await new Promise((r) => setTimeout(r, 50))
    })

    // Should revert to original count
    const event = result.current.events.find((e) => e.id === 'evt-2')
    expect(event.interested_count).toBe(7) // reverted
  })

  it('re-fetches when selectedDate changes', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const date1 = new Date(2026, 3, 1)
    const { result, rerender } = renderHook(
      ({ date }) => useEvents(date),
      { initialProps: { date: date1 } }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockRpc).toHaveBeenCalledTimes(1)

    // Change date
    const date2 = new Date(2026, 3, 2)
    rerender({ date: date2 })

    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2))
    expect(mockRpc).toHaveBeenLastCalledWith('get_events_with_details', {
      target_date: '2026-04-02',
    })
  })
})

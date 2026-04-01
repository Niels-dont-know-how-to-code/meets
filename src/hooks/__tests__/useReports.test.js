import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock Supabase
const mockFrom = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}))

import { useReports } from '../useReports'

// Helper to build chainable query mock
function chainable(resolvedValue) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => Promise.resolve(resolvedValue)),
    eq: vi.fn(() => chain),
    then: (resolve) => resolve(resolvedValue),
  }
  return chain
}

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchUserReports populates the userReports Set', async () => {
    const selectChain = chainable({
      data: [{ event_id: 'evt-1' }, { event_id: 'evt-3' }],
      error: null,
    })
    mockFrom.mockReturnValue(selectChain)

    const { result } = renderHook(() => useReports())

    await act(async () => {
      await result.current.fetchUserReports('user-1')
    })

    expect(mockFrom).toHaveBeenCalledWith('reports')
    expect(selectChain.select).toHaveBeenCalledWith('event_id')
    expect(selectChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result.current.userReports.has('evt-1')).toBe(true)
    expect(result.current.userReports.has('evt-3')).toBe(true)
    expect(result.current.userReports.has('evt-2')).toBe(false)
  })

  it('reportEvent calls supabase insert and adds to userReports', async () => {
    const insertChain = chainable({ error: null })
    mockFrom.mockReturnValue(insertChain)

    const { result } = renderHook(() => useReports())

    let res
    await act(async () => {
      res = await result.current.reportEvent('evt-1', 'user-1', 'Spam')
    })

    expect(mockFrom).toHaveBeenCalledWith('reports')
    expect(insertChain.insert).toHaveBeenCalledWith({
      event_id: 'evt-1',
      user_id: 'user-1',
      reason: 'Spam',
    })
    expect(res.data).toBe(true)
    expect(result.current.userReports.has('evt-1')).toBe(true)
  })

  it('reportEvent returns error for duplicate (23505 code)', async () => {
    const insertChain = {
      insert: vi.fn(() => Promise.resolve({ error: { code: '23505', message: 'duplicate' } })),
    }
    mockFrom.mockReturnValue(insertChain)

    const { result } = renderHook(() => useReports())

    let res
    await act(async () => {
      res = await result.current.reportEvent('evt-1', 'user-1', 'Spam')
    })

    expect(res.error.message).toBe('You have already reported this event')
  })

  it('reportEvent returns error for other errors', async () => {
    const insertChain = {
      insert: vi.fn(() => Promise.resolve({ error: { code: '42000', message: 'Something went wrong' } })),
    }
    mockFrom.mockReturnValue(insertChain)

    const { result } = renderHook(() => useReports())

    let res
    await act(async () => {
      res = await result.current.reportEvent('evt-1', 'user-1', 'Spam')
    })

    expect(res.error.message).toBe('Something went wrong')
    // Should NOT add to userReports on error
    expect(result.current.userReports.has('evt-1')).toBe(false)
  })
})

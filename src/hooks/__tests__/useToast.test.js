import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../useToast'

describe('useToast', () => {
  it('starts with no toast', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toast).toBeNull()
  })

  it('showToast sets a toast with message and type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('Event created!', 'success')
    })

    expect(result.current.toast).toMatchObject({
      message: 'Event created!',
      type: 'success',
    })
    expect(result.current.toast.id).toBeDefined()
  })

  it('defaults type to success', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('Done!')
    })

    expect(result.current.toast.type).toBe('success')
  })

  it('hideToast clears the toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('Hello')
    })
    expect(result.current.toast).not.toBeNull()

    act(() => {
      result.current.hideToast()
    })
    expect(result.current.toast).toBeNull()
  })

  it('showToast replaces previous toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('First')
    })
    const firstId = result.current.toast.id

    act(() => {
      result.current.showToast('Second', 'error')
    })

    expect(result.current.toast.message).toBe('Second')
    expect(result.current.toast.type).toBe('error')
    expect(result.current.toast.id).not.toBe(firstId)
  })
})

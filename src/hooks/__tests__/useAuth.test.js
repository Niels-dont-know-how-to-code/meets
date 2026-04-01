import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock Supabase before importing the hook
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockUpdateUser = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      signUp: (...args) => mockSignUp(...args),
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signOut: (...args) => mockSignOut(...args),
      updateUser: (...args) => mockUpdateUser(...args),
      resetPasswordForEmail: (...args) => mockResetPasswordForEmail(...args),
    },
  },
}))

import { useAuth } from '../useAuth'

describe('useAuth', () => {
  let unsubscribe

  beforeEach(() => {
    vi.clearAllMocks()
    unsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })
  })

  const setupSession = (user = null) => {
    mockGetSession.mockResolvedValue({
      data: { session: user ? { user } : null },
    })
  }

  it('starts in loading state and resolves to no user', async () => {
    setupSession(null)
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })

  it('loads authenticated user from session', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { display_name: 'Niels' },
      app_metadata: {},
    }
    setupSession(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.displayName).toBe('Niels')
  })

  it('derives displayName from email when no display_name metadata', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'student@kuleuven.be',
      user_metadata: {},
      app_metadata: {},
    }
    setupSession(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.displayName).toBe('student')
  })

  it('isAdmin is true when app_metadata.role is admin', async () => {
    const mockUser = {
      id: 'admin-1',
      email: 'admin@test.com',
      user_metadata: {},
      app_metadata: { role: 'admin' },
    }
    setupSession(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAdmin).toBe(true)
  })

  it('isAdmin is false for regular users', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@test.com',
      user_metadata: {},
      app_metadata: {},
    }
    setupSession(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAdmin).toBe(false)
  })

  it('signUp calls supabase.auth.signUp with correct params', async () => {
    setupSession(null)
    mockSignUp.mockResolvedValue({ data: { user: {} }, error: null })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signUp('test@test.com', 'password123', 'TestUser')
    })

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
      options: { data: { display_name: 'TestUser' } },
    })
  })

  it('signIn calls supabase.auth.signInWithPassword', async () => {
    setupSession(null)
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signIn('test@test.com', 'pass')
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass',
    })
  })

  it('signOut calls supabase.auth.signOut', async () => {
    setupSession(null)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('updatePassword verifies old password first', async () => {
    const mockUser = {
      id: 'u1',
      email: 'user@test.com',
      user_metadata: {},
      app_metadata: {},
    }
    setupSession(mockUser)
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid' } })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res
    await act(async () => {
      res = await result.current.updatePassword('wrong', 'newpass')
    })

    expect(res.error.message).toBe('Current password is incorrect')
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('updatePassword proceeds when old password is correct', async () => {
    const mockUser = {
      id: 'u1',
      email: 'user@test.com',
      user_metadata: {},
      app_metadata: {},
    }
    setupSession(mockUser)
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ data: {}, error: null })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updatePassword('oldpass', 'newpass')
    })

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass' })
  })

  it('unsubscribes from auth state changes on unmount', async () => {
    setupSession(null)

    const { unmount } = renderHook(() => useAuth())
    await waitFor(() => {})

    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('avatarUrl returns null when not set', async () => {
    const mockUser = {
      id: 'u1',
      email: 'user@test.com',
      user_metadata: {},
      app_metadata: {},
    }
    setupSession(mockUser)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.avatarUrl).toBeNull()
  })
})

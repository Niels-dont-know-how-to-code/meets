import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock useAuth
const mockSignIn = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signIn: mockSignIn,
    resetPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }),
}))

import AuthModal from '../Auth/AuthModal'

function getSubmitButton() {
  return screen.getAllByRole('button', { name: /log in/i }).find(
    (b) => b.getAttribute('type') === 'submit'
  )
}

describe('AuthModal - error message security', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialTab: 'login',
  }

  it('shows generic error for wrong credentials (no email enumeration)', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    render(<AuthModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass')
    await user.click(getSubmitButton())

    expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument()
  })

  it('shows confirmation message for unconfirmed email', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: { message: 'Email not confirmed' },
    })

    render(<AuthModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(getSubmitButton())

    expect(
      screen.getByText(/check your email and click the confirmation link/i)
    ).toBeInTheDocument()
  })

  it('shows generic error for any other sign-in failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: { message: 'Some unexpected Supabase error' },
    })

    render(<AuthModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(getSubmitButton())

    // Should NOT leak the actual error message
    expect(screen.queryByText('Some unexpected Supabase error')).not.toBeInTheDocument()
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
  })
})

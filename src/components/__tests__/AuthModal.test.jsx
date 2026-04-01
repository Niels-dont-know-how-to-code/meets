import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock useAuth
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithProvider = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signIn: mockSignIn,
    signInWithProvider: mockSignInWithProvider,
    resetPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }),
}))

import AuthModal from '../Auth/AuthModal'

function getLoginSubmitButton() {
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
    await user.click(getLoginSubmitButton())

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
    await user.click(getLoginSubmitButton())

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
    await user.click(getLoginSubmitButton())

    expect(screen.queryByText('Some unexpected Supabase error')).not.toBeInTheDocument()
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
  })
})

describe('AuthModal - password visibility toggle', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialTab: 'login',
  }

  it('toggles password visibility on login', async () => {
    const user = userEvent.setup()
    render(<AuthModal {...defaultProps} />)

    const passwordInput = screen.getByPlaceholderText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click the eye button to show password
    const toggleBtn = passwordInput.parentElement.querySelector('button')
    await user.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again to hide
    await user.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

describe('AuthModal - confirm password on sign up', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialTab: 'signup',
  }

  it('shows confirm password field on sign up tab', () => {
    render(<AuthModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
  })

  it('rejects sign up when passwords do not match', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ data: {}, error: null })

    render(<AuthModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Niels')
    await user.type(screen.getByPlaceholderText('Email address'), 'niels@test.com')
    await user.type(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'different456')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('allows sign up when passwords match', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })

    render(<AuthModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Niels')
    await user.type(screen.getByPlaceholderText('Email address'), 'niels@test.com')
    await user.type(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockSignUp).toHaveBeenCalled()
  })
})

describe('AuthModal - social login', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialTab: 'login',
  }

  it('renders Google and Facebook buttons on login', () => {
    render(<AuthModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument()
  })

  it('calls signInWithProvider when Google is clicked', async () => {
    const user = userEvent.setup()
    mockSignInWithProvider.mockResolvedValue({ data: {}, error: null })

    render(<AuthModal {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /google/i }))
    expect(mockSignInWithProvider).toHaveBeenCalledWith('google')
  })

  it('calls signInWithProvider when Facebook is clicked', async () => {
    const user = userEvent.setup()
    mockSignInWithProvider.mockResolvedValue({ data: {}, error: null })

    render(<AuthModal {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /facebook/i }))
    expect(mockSignInWithProvider).toHaveBeenCalledWith('facebook')
  })

  it('renders social login buttons on sign up tab too', () => {
    render(<AuthModal {...defaultProps} initialTab="signup" />)
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument()
  })
})

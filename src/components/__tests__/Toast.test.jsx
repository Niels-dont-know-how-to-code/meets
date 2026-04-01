import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from '../Toast'

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast id={1} message="Event created!" onClose={() => {}} />)
    expect(screen.getByText('Event created!')).toBeInTheDocument()
  })

  it('applies success styling by default', () => {
    const { container } = render(<Toast id={1} message="Success" onClose={() => {}} />)
    const inner = container.querySelector('.bg-emerald-600')
    expect(inner).toBeInTheDocument()
  })

  it('applies error styling when type is error', () => {
    const { container } = render(<Toast id={1} message="Failed" type="error" onClose={() => {}} />)
    const inner = container.querySelector('.bg-red-600')
    expect(inner).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<Toast id={1} message="Hello" onClose={onClose} />)

    // The X button is the only button in the toast
    await user.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after 3 seconds', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(<Toast id={1} message="Auto close" onClose={onClose} />)

    expect(onClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(onClose).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })
})

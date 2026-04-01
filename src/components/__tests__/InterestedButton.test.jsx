import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InterestedButton from '../Event/InterestedButton'

describe('InterestedButton', () => {
  it('renders the count', () => {
    render(<InterestedButton count={5} isInterested={false} onToggle={() => {}} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()

    render(<InterestedButton count={3} isInterested={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('applies interested styling when isInterested is true', () => {
    render(<InterestedButton count={2} isInterested={true} onToggle={() => {}} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-red-500')
  })

  it('applies default styling when not interested', () => {
    render(<InterestedButton count={2} isInterested={false} onToggle={() => {}} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-ink-tertiary')
  })

  it('renders with md size classes', () => {
    render(<InterestedButton count={1} isInterested={false} onToggle={() => {}} size="md" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('px-4')
  })

  it('stops event propagation on click', async () => {
    const parentClick = vi.fn()
    const user = userEvent.setup()

    render(
      <div onClick={parentClick}>
        <InterestedButton count={0} isInterested={false} onToggle={() => {}} />
      </div>
    )

    await user.click(screen.getByRole('button'))
    expect(parentClick).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventDetailModal from '../Event/EventDetailModal'

// Mock child components to simplify
vi.mock('../Event/CategoryBadge', () => ({
  default: ({ category }) => <span data-testid="category-badge">{category}</span>,
}))

vi.mock('../Event/InterestedButton', () => ({
  default: ({ count, isInterested, onToggle }) => (
    <button data-testid="interested-btn" onClick={onToggle}>
      {isInterested ? 'Interested' : 'Not interested'} ({count})
    </button>
  ),
}))

vi.mock('../../lib/dateUtils', () => ({
  formatTime: (t) => t.slice(0, 5),
  formatDate: () => 'Wed, 1 Apr',
  isHappeningNow: () => false,
}))

vi.mock('../../lib/calendarUtils', () => ({
  buildGoogleCalendarUrl: (event) => `https://www.google.com/calendar/render?text=${encodeURIComponent(event.title || '')}`,
}))

const baseEvent = {
  id: 'evt-1',
  title: 'Chess Night',
  category: 'culture',
  date: '2026-04-01',
  start_time: '19:00:00+01',
  end_time: '21:00:00+01',
  address_label: 'Oude Markt, Leuven',
  lat: 50.88,
  lng: 4.70,
  organizer_name: 'Chess Club',
  description: 'Come play chess with us!',
  creator_username: 'niels',
  created_by_id: 'user-1',
  interested_count: 5,
  image_url: null,
}

describe('EventDetailModal', () => {
  const defaultProps = {
    event: baseEvent,
    user: null,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isInterested: false,
    interestedCount: 5,
    onToggleInterest: vi.fn(),
    isAdmin: false,
    showToast: vi.fn(),
  }

  it('renders event details', () => {
    render(<EventDetailModal {...defaultProps} />)

    expect(screen.getByText('Chess Night')).toBeInTheDocument()
    expect(screen.getByText('19:00 - 21:00')).toBeInTheDocument()
    expect(screen.getByText('Chess Club')).toBeInTheDocument()
    expect(screen.getByText('Come play chess with us!')).toBeInTheDocument()
    expect(screen.getByText('Created by niels')).toBeInTheDocument()
  })

  it('returns null when event is null', () => {
    const { container } = render(<EventDetailModal {...defaultProps} event={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('does not show edit/delete buttons for non-owner non-admin', () => {
    render(<EventDetailModal {...defaultProps} user={{ id: 'other-user' }} />)

    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('shows edit/delete buttons for the event creator', () => {
    render(<EventDetailModal {...defaultProps} user={{ id: 'user-1' }} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows edit/delete buttons for admin users', () => {
    render(
      <EventDetailModal {...defaultProps} user={{ id: 'admin-1' }} isAdmin={true} />
    )

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('requires delete confirmation (two-step delete)', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <EventDetailModal
        {...defaultProps}
        user={{ id: 'user-1' }}
        onDelete={onDelete}
      />
    )

    // First click shows confirmation
    await user.click(screen.getByText('Delete'))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()

    // Second click (Yes) triggers actual delete
    await user.click(screen.getByText('Yes'))
    expect(onDelete).toHaveBeenCalledWith('evt-1')
  })

  it('cancel delete hides confirmation', async () => {
    const user = userEvent.setup()

    render(
      <EventDetailModal {...defaultProps} user={{ id: 'user-1' }} />
    )

    await user.click(screen.getByText('Delete'))
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()

    await user.click(screen.getByText('No'))
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })

  it('calls onEdit with the event when Edit is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <EventDetailModal {...defaultProps} user={{ id: 'user-1' }} onEdit={onEdit} />
    )

    await user.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalledWith(baseEvent)
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<EventDetailModal {...defaultProps} onClose={onClose} />)

    // The close button is the X button at the top
    const closeButtons = screen.getAllByRole('button')
    // First button in the modal is the close button
    await user.click(closeButtons[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('renders address as a link with directions', () => {
    render(<EventDetailModal {...defaultProps} />)

    const link = screen.getByText('Oude Markt, Leuven').closest('a')
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders event image when image_url is present', () => {
    const eventWithImage = { ...baseEvent, image_url: 'https://example.com/photo.jpg' }
    render(<EventDetailModal {...defaultProps} event={eventWithImage} />)

    const img = screen.getByAltText('Chess Night')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('does not render image when image_url is null', () => {
    render(<EventDetailModal {...defaultProps} />)

    expect(screen.queryByAltText('Chess Night')).not.toBeInTheDocument()
  })

  it('renders Calendar link with correct Google Calendar URL', () => {
    render(<EventDetailModal {...defaultProps} />)

    const calendarLink = screen.getByText('Calendar').closest('a')
    expect(calendarLink).toHaveAttribute('href', expect.stringContaining('google.com/calendar/render'))
    expect(calendarLink).toHaveAttribute('target', '_blank')
  })

  it('renders Report button for non-owner authenticated users', () => {
    render(<EventDetailModal {...defaultProps} user={{ id: 'other-user' }} hasReported={false} />)

    expect(screen.getByText('Report')).toBeInTheDocument()
  })

  it('does not render Report button for event owner', () => {
    render(<EventDetailModal {...defaultProps} user={{ id: 'user-1' }} />)

    expect(screen.queryByText('Report')).not.toBeInTheDocument()
  })

  it('does not render Report button when not logged in', () => {
    render(<EventDetailModal {...defaultProps} user={null} />)

    expect(screen.queryByText('Report')).not.toBeInTheDocument()
  })

  it('shows report reasons menu when Report is clicked', async () => {
    const user = userEvent.setup()

    render(
      <EventDetailModal
        {...defaultProps}
        user={{ id: 'other-user' }}
        onReport={vi.fn()}
        hasReported={false}
      />
    )

    await user.click(screen.getByText('Report'))

    expect(screen.getByText('Why are you reporting this?')).toBeInTheDocument()
    expect(screen.getByText('Spam')).toBeInTheDocument()
    expect(screen.getByText('Inappropriate content')).toBeInTheDocument()
    expect(screen.getByText('Misleading information')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('shows "Reported" state when hasReported is true', () => {
    render(
      <EventDetailModal
        {...defaultProps}
        user={{ id: 'other-user' }}
        hasReported={true}
      />
    )

    expect(screen.getByText('Reported')).toBeInTheDocument()
    expect(screen.queryByText('Report')).not.toBeInTheDocument()
  })
})

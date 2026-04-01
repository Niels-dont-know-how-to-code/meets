import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HostEventModal from '../Event/HostEventModal'

// Mock LocationPicker (path relative to HostEventModal source)
vi.mock('../../components/Map/LocationPicker', () => ({
  default: ({ value, onChange }) => (
    <button
      data-testid="location-picker"
      onClick={() => onChange({ lat: 50.88, lng: 4.70, address_label: 'Leuven' })}
    >
      {value ? value.address_label : 'Pick location'}
    </button>
  ),
}))

describe('HostEventModal', () => {
  const defaultProps = {
    user: { id: 'user-1' },
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    editingEvent: null,
  }

  it('renders "Host an Event" for new events', () => {
    render(<HostEventModal {...defaultProps} />)
    expect(screen.getByText('Host an Event')).toBeInTheDocument()
    expect(screen.getByText('Create Event')).toBeInTheDocument()
  })

  it('renders "Edit Event" when editing', () => {
    const editingEvent = {
      title: 'Chess Night',
      date: '2026-04-01',
      start_time: '19:00:00+01',
      end_time: '21:00:00+01',
      category: 'culture',
      organizer_name: 'Chess Club',
      description: 'Play chess',
      lat: 50.88,
      lng: 4.70,
      address_label: 'Leuven',
    }

    render(<HostEventModal {...defaultProps} editingEvent={editingEvent} />)
    expect(screen.getByText('Edit Event')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })

  it('pre-fills form fields when editing', () => {
    const editingEvent = {
      title: 'Chess Night',
      date: '2026-04-01',
      start_time: '19:00:00+01',
      end_time: '21:00:00+01',
      category: 'culture',
      organizer_name: 'Chess Club',
      description: 'Play chess',
      lat: 50.88,
      lng: 4.70,
      address_label: 'Leuven',
    }

    render(<HostEventModal {...defaultProps} editingEvent={editingEvent} />)

    expect(screen.getByDisplayValue('Chess Night')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Chess Club')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Play chess')).toBeInTheDocument()
  })

  it('validates required fields and prevents submission', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    render(<HostEventModal {...defaultProps} onSuccess={onSuccess} />)

    // Submit with empty form
    await user.click(screen.getByText('Create Event'))

    // onSuccess should NOT have been called
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSuccess with form data when all fields are valid', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn().mockResolvedValue(undefined)

    render(<HostEventModal {...defaultProps} onSuccess={onSuccess} />)

    // Fill required fields
    await user.type(screen.getByPlaceholderText('Event title'), 'New Party')
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'party')
    await user.type(screen.getByPlaceholderText('e.g., Chess Club'), 'Party Crew')

    // Fill times via the desktop TimePicker (text inputs with placeholder --:--)
    const timeInputs = screen.getAllByPlaceholderText('--:--')
    // Type digits — the DesktopTimePicker auto-inserts colon after 2 digits
    await user.type(timeInputs[0], '2000')
    fireEvent.blur(timeInputs[0])
    await user.type(timeInputs[1], '2300')
    fireEvent.blur(timeInputs[1])

    // Pick location
    await user.click(screen.getByTestId('location-picker'))

    // Submit
    await user.click(screen.getByText('Create Event'))

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Party',
        category: 'party',
        organizer_name: 'Party Crew',
        start_time: '20:00',
        end_time: '23:00',
        lat: 50.88,
        lng: 4.70,
      })
    )
  })

  it('validates that start_time and end_time cannot be the same', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    render(<HostEventModal {...defaultProps} onSuccess={onSuccess} />)

    await user.type(screen.getByPlaceholderText('Event title'), 'Event')
    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'culture')
    await user.type(screen.getByPlaceholderText('e.g., Chess Club'), 'Org')

    const timeInputs = screen.getAllByPlaceholderText('--:--')
    await user.type(timeInputs[0], '2000')
    fireEvent.blur(timeInputs[0])
    await user.type(timeInputs[1], '2000')
    fireEvent.blur(timeInputs[1])

    await user.click(screen.getByTestId('location-picker'))
    await user.click(screen.getByText('Create Event'))

    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<HostEventModal {...defaultProps} onClose={onClose} />)

    // The X close button is the first button in the modal
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('validates title max length (>200 chars)', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    render(<HostEventModal {...defaultProps} onSuccess={onSuccess} />)

    const longTitle = 'A'.repeat(201)
    // Use fireEvent for the long string to avoid slow userEvent.type
    const titleInput = screen.getByPlaceholderText('Event title')
    fireEvent.change(titleInput, { target: { value: longTitle } })

    await user.selectOptions(screen.getByDisplayValue('Select a category'), 'party')

    const orgInput = screen.getByPlaceholderText('e.g., Chess Club')
    fireEvent.change(orgInput, { target: { value: 'Org' } })

    const timeInputs = screen.getAllByPlaceholderText('--:--')
    await user.type(timeInputs[0], '2000')
    fireEvent.blur(timeInputs[0])
    await user.type(timeInputs[1], '2300')
    fireEvent.blur(timeInputs[1])

    await user.click(screen.getByTestId('location-picker'))
    await user.click(screen.getByText('Create Event'))

    expect(onSuccess).not.toHaveBeenCalled()
  })
})

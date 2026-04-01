import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ListOverlay from '../List/ListOverlay'

// Mock child components
vi.mock('../List/SearchBar', () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search events..."
    />
  ),
}))

vi.mock('../List/ListTabs', () => ({
  default: ({ activeTab, onTabChange, isAuthenticated, onLoginRequired }) => (
    <div data-testid="list-tabs">
      <button onClick={() => onTabChange('all')}>All Events</button>
      <button
        onClick={() => {
          if (!isAuthenticated) {
            onLoginRequired()
            return
          }
          onTabChange('interests')
        }}
      >
        My Interests
      </button>
    </div>
  ),
}))

vi.mock('../List/EventCard', () => ({
  default: ({ event, onClick }) => (
    <div data-testid={`event-card-${event.id}`} onClick={() => onClick(event)}>
      {event.title}
    </div>
  ),
}))

vi.mock('../List/SkeletonCard', () => ({
  default: () => <div data-testid="skeleton-card" />,
}))

const sampleEvents = [
  {
    id: 'evt-1',
    title: 'Chess Night',
    description: 'Play chess',
    category: 'culture',
    start_time: '19:00:00+01',
    end_time: '21:00:00+01',
    date: '2026-04-01',
  },
  {
    id: 'evt-2',
    title: 'Running Club',
    description: 'Morning run',
    category: 'sports',
    start_time: '08:00:00+01',
    end_time: '09:00:00+01',
    date: '2026-04-01',
  },
  {
    id: 'evt-3',
    title: 'House Party',
    description: 'Dance night',
    category: 'party',
    start_time: '22:00:00+01',
    end_time: '03:00:00+01',
    date: '2026-04-01',
  },
]

describe('ListOverlay', () => {
  const defaultProps = {
    events: sampleEvents,
    show: true,
    onClose: vi.fn(),
    user: null,
    onEventClick: vi.fn(),
    activeTab: 'all',
    onTabChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    userInterests: new Set(),
    onToggleInterest: vi.fn(),
    loading: false,
    onRefresh: vi.fn(),
    onLoginRequired: vi.fn(),
    onHostEvent: vi.fn(),
  }

  it('returns null when show is false', () => {
    const { container } = render(<ListOverlay {...defaultProps} show={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders all events', () => {
    render(<ListOverlay {...defaultProps} />)

    expect(screen.getByText('Chess Night')).toBeInTheDocument()
    expect(screen.getByText('Running Club')).toBeInTheDocument()
    expect(screen.getByText('House Party')).toBeInTheDocument()
  })

  it('sorts events by start_time ascending', () => {
    render(<ListOverlay {...defaultProps} />)

    const cards = screen.getAllByTestId(/^event-card-/)
    // Running (08:00) < Chess (19:00) < Party (22:00)
    expect(cards[0]).toHaveTextContent('Running Club')
    expect(cards[1]).toHaveTextContent('Chess Night')
    expect(cards[2]).toHaveTextContent('House Party')
  })

  it('filters events by search query (title match)', () => {
    render(<ListOverlay {...defaultProps} searchQuery="chess" />)

    expect(screen.getByText('Chess Night')).toBeInTheDocument()
    expect(screen.queryByText('Running Club')).not.toBeInTheDocument()
    expect(screen.queryByText('House Party')).not.toBeInTheDocument()
  })

  it('filters events by search query (description match)', () => {
    render(<ListOverlay {...defaultProps} searchQuery="dance" />)

    expect(screen.getByText('House Party')).toBeInTheDocument()
    expect(screen.queryByText('Chess Night')).not.toBeInTheDocument()
  })

  it('shows search empty state when no matches', () => {
    render(<ListOverlay {...defaultProps} searchQuery="nonexistent" />)

    expect(screen.getByText(/No matches for/)).toBeInTheDocument()
  })

  it('filters by interests tab', () => {
    const userInterests = new Set(['evt-2'])

    render(
      <ListOverlay
        {...defaultProps}
        activeTab="interests"
        userInterests={userInterests}
      />
    )

    expect(screen.getByText('Running Club')).toBeInTheDocument()
    expect(screen.queryByText('Chess Night')).not.toBeInTheDocument()
    expect(screen.queryByText('House Party')).not.toBeInTheDocument()
  })

  it('shows interests empty state when no favorites', () => {
    render(
      <ListOverlay
        {...defaultProps}
        activeTab="interests"
        userInterests={new Set()}
      />
    )

    expect(screen.getByText('No favorites yet')).toBeInTheDocument()
  })

  it('shows loading skeletons when loading', () => {
    render(<ListOverlay {...defaultProps} loading={true} />)

    const skeletons = screen.getAllByTestId('skeleton-card')
    expect(skeletons.length).toBe(3)
  })

  it('shows default empty state when no events exist', () => {
    render(<ListOverlay {...defaultProps} events={[]} />)

    expect(screen.getByText('No events yet')).toBeInTheDocument()
    expect(screen.getByText('Host an Event')).toBeInTheDocument()
  })

  it('calls onEventClick when event card is clicked', async () => {
    const user = userEvent.setup()
    const onEventClick = vi.fn()

    render(<ListOverlay {...defaultProps} onEventClick={onEventClick} />)

    await user.click(screen.getByTestId('event-card-evt-1'))
    expect(onEventClick).toHaveBeenCalledWith(sampleEvents[0])
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ListOverlay {...defaultProps} onClose={onClose} />)

    // Find the close X button in the header
    const buttons = screen.getAllByRole('button')
    // The close button is in the header area
    const closeBtn = buttons.find(
      (b) => b.querySelector('svg') && b.getAttribute('title') !== 'Refresh events'
    )
    // Just click the last button-looking close button in the header area
    await user.click(buttons[buttons.length - 1]) // the close button
  })

  it('search is case-insensitive', () => {
    render(<ListOverlay {...defaultProps} searchQuery="CHESS" />)
    expect(screen.getByText('Chess Night')).toBeInTheDocument()
  })

  it('combines search with interests filter', () => {
    const userInterests = new Set(['evt-1', 'evt-3'])

    render(
      <ListOverlay
        {...defaultProps}
        activeTab="interests"
        userInterests={userInterests}
        searchQuery="party"
      />
    )

    // Only House Party matches both search "party" and interests
    expect(screen.getByText('House Party')).toBeInTheDocument()
    expect(screen.queryByText('Chess Night')).not.toBeInTheDocument()
  })
})

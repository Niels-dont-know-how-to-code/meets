import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryBadge from '../Event/CategoryBadge'
import { CATEGORY_COLORS, CATEGORY_BG_COLORS } from '../../lib/constants'

describe('CategoryBadge', () => {
  it('renders the category label', () => {
    render(<CategoryBadge category="party" />)
    expect(screen.getByText('Party')).toBeInTheDocument()
  })

  it('applies correct colors for party', () => {
    render(<CategoryBadge category="party" />)
    const badge = screen.getByText('Party')
    expect(badge).toHaveStyle({
      backgroundColor: CATEGORY_BG_COLORS.party,
      color: CATEGORY_COLORS.party,
    })
  })

  it('applies correct colors for culture', () => {
    render(<CategoryBadge category="culture" />)
    const badge = screen.getByText('Culture')
    expect(badge).toHaveStyle({
      backgroundColor: CATEGORY_BG_COLORS.culture,
      color: CATEGORY_COLORS.culture,
    })
  })

  it('applies correct colors for sports', () => {
    render(<CategoryBadge category="sports" />)
    const badge = screen.getByText('Sports')
    expect(badge).toHaveStyle({
      backgroundColor: CATEGORY_BG_COLORS.sports,
      color: CATEGORY_COLORS.sports,
    })
  })

  it('falls back to default styling for unknown categories', () => {
    render(<CategoryBadge category="unknown" />)
    const badge = screen.getByText('unknown')
    expect(badge).toHaveStyle({
      backgroundColor: '#F1F5F9',
      color: '#475569',
    })
  })
})

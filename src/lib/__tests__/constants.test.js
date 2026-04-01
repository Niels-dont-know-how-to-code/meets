import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_BG_COLORS,
  CATEGORY_LABELS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from '../constants'

describe('CATEGORIES', () => {
  it('contains exactly party, culture, sports', () => {
    expect(CATEGORIES).toEqual(['party', 'culture', 'sports'])
  })
})

describe('CATEGORY_COLORS', () => {
  it('has a color for each category', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_COLORS[cat]).toBeDefined()
      expect(CATEGORY_COLORS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})

describe('CATEGORY_BG_COLORS', () => {
  it('has a background color for each category', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_BG_COLORS[cat]).toBeDefined()
      expect(CATEGORY_BG_COLORS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})

describe('CATEGORY_LABELS', () => {
  it('has a label for each category', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof CATEGORY_LABELS[cat]).toBe('string')
    })
  })

  it('labels are capitalized versions of the keys', () => {
    expect(CATEGORY_LABELS.party).toBe('Party')
    expect(CATEGORY_LABELS.culture).toBe('Culture')
    expect(CATEGORY_LABELS.sports).toBe('Sports')
  })
})

describe('DEFAULT_CENTER', () => {
  it('is a [lat, lng] array for Leuven', () => {
    expect(DEFAULT_CENTER).toHaveLength(2)
    const [lat, lng] = DEFAULT_CENTER
    // Leuven is approximately at 50.88, 4.70
    expect(lat).toBeCloseTo(50.88, 1)
    expect(lng).toBeCloseTo(4.70, 1)
  })
})

describe('DEFAULT_ZOOM', () => {
  it('is a reasonable zoom level', () => {
    expect(DEFAULT_ZOOM).toBeGreaterThanOrEqual(10)
    expect(DEFAULT_ZOOM).toBeLessThanOrEqual(18)
  })
})

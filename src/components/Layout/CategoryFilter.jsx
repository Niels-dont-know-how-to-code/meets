import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/constants'

export default function CategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {/* All chip */}
      <button
        onClick={() => onCategoryChange(null)}
        aria-pressed={selectedCategory === null}
        aria-label="All categories"
        className={`px-3 py-2.5 rounded-full text-xs font-display font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
          selectedCategory === null
            ? 'bg-meets-500 text-white scale-[1.02] shadow-float'
            : 'bg-white text-meets-500 shadow-card'
        }`}
      >
        All
      </button>

      {/* Category chips */}
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat
        const color = CATEGORY_COLORS[cat]

        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            aria-pressed={isActive}
            className={`px-3 py-2.5 rounded-full text-xs font-display font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isActive ? 'text-white scale-[1.02] shadow-float' : 'bg-white shadow-card'
            }`}
            style={
              isActive
                ? { backgroundColor: color, color: 'white' }
                : { color }
            }
          >
            {CATEGORY_LABELS[cat]}
          </button>
        )
      })}
    </div>
  )
}

import { CATEGORY_COLORS, CATEGORY_BG_COLORS, CATEGORY_LABELS } from '../../lib/constants';

export default function CategoryBadge({ category }) {
  const color = CATEGORY_COLORS[category] || '#475569';
  const bgColor = CATEGORY_BG_COLORS[category] || '#F1F5F9';
  const label = CATEGORY_LABELS[category] || category;

  return (
    <span
      className="category-badge"
      style={{ backgroundColor: bgColor, color: color }}
    >
      {label}
    </span>
  );
}

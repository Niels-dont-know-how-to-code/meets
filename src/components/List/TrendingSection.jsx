import { Heart } from 'lucide-react';
import CategoryBadge from '../Event/CategoryBadge';

export default function TrendingSection({ events, onEventClick }) {
  const trending = events
    .filter((e) => e.interested_count >= 2)
    .sort((a, b) => b.interested_count - a.interested_count);

  if (trending.length === 0) return null;

  return (
    <div className="px-1 pb-2">
      <h3 className="font-display font-bold text-sm text-ink mb-2">
        {'🔥 Trending'}
      </h3>
      <div className="overflow-x-auto flex gap-2 pb-2 scrollbar-hide snap-x snap-mandatory">
        {trending.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="min-w-[150px] max-w-[160px] p-3 bg-surface-secondary rounded-xl snap-start cursor-pointer hover:bg-surface-tertiary transition flex-shrink-0"
          >
            <CategoryBadge category={event.category} />
            <p className="text-sm font-display font-semibold truncate mt-1.5">
              {event.title}
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-tertiary">
              <Heart size={12} />
              <span>{event.interested_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Clock } from 'lucide-react';
import { formatTime, isHappeningNow } from '../../lib/dateUtils';
import CategoryBadge from '../Event/CategoryBadge';
import InterestedButton from '../Event/InterestedButton';

export default function EventCard({ event, onClick, compact = false, index, isInterested = false, onToggleInterest }) {
  const handleClick = () => onClick(event);

  return (
    <div
      onClick={handleClick}
      className={`card cursor-pointer transition-all duration-200 hover:shadow-float-lg
        hover:-translate-y-0.5 border border-transparent hover:border-gray-100 ${
        compact ? 'p-3' : 'p-4'
      } ${index !== undefined ? 'animate-stagger-in' : ''}`}
      style={index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
    >
      {!compact && event.image_url && (
        <div className="-mx-4 -mt-4 mb-3 rounded-t-xl overflow-hidden">
          <img src={event.image_url} alt="" className="w-full h-32 object-cover" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <CategoryBadge category={event.category} />
            {isHappeningNow(event.start_time, event.end_time, event.date) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-green-100 text-green-700 text-[10px] font-display font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <h3
            className={`font-display font-bold text-ink leading-snug ${
              compact ? 'text-sm truncate' : 'text-base line-clamp-2'
            }`}
          >
            {event.title}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5 text-ink-secondary">
            <Clock size={14} className="shrink-0 text-meets-500" />
            <span className="text-sm font-body font-medium">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>

          {!compact && event.organizer_name && (
            <p className="text-sm text-ink-secondary font-body mt-1">
              {event.organizer_name}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-ink-tertiary font-body">
              by {event.creator_username || 'Anonymous'}
            </span>
          </div>
        </div>

        <div className="pt-5">
          <InterestedButton
            count={event.interested_count ?? 0}
            isInterested={isInterested}
            onToggle={() => onToggleInterest && onToggleInterest(event.id)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}

import { Clock, BadgeCheck } from 'lucide-react';
import { formatTime, isHappeningNow } from '../../lib/dateUtils';
import CategoryBadge from '../Event/CategoryBadge';
import InterestedButton from '../Event/InterestedButton';

export default function EventCard({ event, onClick, compact = false, index, isInterested = false, onToggleInterest, friendsInterested }) {
  const handleClick = () => onClick(event);
  const isCancelled = event.status === 'cancelled';

  return (
    <div
      onClick={handleClick}
      className={`card cursor-pointer transition-all duration-200 hover:shadow-float-lg
        hover:-translate-y-0.5 border border-transparent hover:border-gray-100 ${
        compact ? 'p-3' : 'p-4'
      } ${index !== undefined ? 'animate-stagger-in' : ''} ${isCancelled ? 'opacity-60' : ''}`}
      style={index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <CategoryBadge category={event.category} />
            {isCancelled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-red-100 text-red-700 text-[10px] font-display font-bold uppercase tracking-wider">
                Cancelled
              </span>
            )}
            {!isCancelled && isHappeningNow(event.start_time, event.end_time, event.date) && (
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
            <span className="text-xs text-ink-tertiary font-body inline-flex items-center gap-0.5">
              {event.creator_handle
                ? <span className="text-ink-secondary">@{event.creator_handle}</span>
                : `by ${event.creator_username || 'Anonymous'}`}
              {event.is_verified && <BadgeCheck size={12} className="text-meets-500" />}
            </span>
          </div>

          {/* Friends interested */}
          {friendsInterested && friendsInterested.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex -space-x-1">
                {friendsInterested.slice(0, 3).map((f, i) => (
                  f.friend_avatar ? (
                    <div key={f.friend_id} className="relative w-4 h-4" style={{ zIndex: 3 - i }}>
                      <div className="w-4 h-4 rounded-full bg-meets-500 flex items-center justify-center text-white text-[7px] font-bold border border-white">
                        {f.friend_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <img
                        src={f.friend_avatar}
                        alt={f.friend_name}
                        className="absolute inset-0 w-4 h-4 rounded-full object-cover border border-white"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </div>
                  ) : (
                    <div
                      key={f.friend_id}
                      className="w-4 h-4 rounded-full bg-meets-500 flex items-center justify-center text-white text-[7px] font-bold border border-white"
                      style={{ zIndex: 3 - i }}
                    >
                      {f.friend_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )
                ))}
              </div>
              <span className="text-[10px] text-ink-secondary font-body">
                {friendsInterested[0]?.friend_name}
                {friendsInterested.length > 1
                  ? ` +${friendsInterested.length - 1}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 pt-5">
          {event.image_url && (
            <img
              src={event.image_url}
              alt=""
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
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

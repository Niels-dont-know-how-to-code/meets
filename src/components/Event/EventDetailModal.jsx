import { useState } from 'react';
import { X, MapPin, Clock, User, Pencil, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { formatTime, formatDate } from '../../lib/dateUtils';
import CategoryBadge from './CategoryBadge';
import InterestedButton from './InterestedButton';

export default function EventDetailModal({
  event,
  user,
  onClose,
  onEdit,
  onDelete,
  isInterested,
  interestedCount,
  onToggleInterest,
  isAdmin,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!event) return null;

  const isCreator = user && user.id === event.created_by_id;
  const canManage = isCreator || isAdmin;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(event.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-fade-in"
      />

      {/* Modal */}
      <div
        className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white
          max-h-[90vh] md:max-h-[85vh] overflow-y-auto animate-slide-up shadow-overlay"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-secondary
            transition-colors text-ink-secondary z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8">
          {/* Title */}
          <h2 className="font-display text-2xl font-bold text-ink pr-8">
            {event.title}
          </h2>

          {/* Category */}
          <div className="mt-3">
            <CategoryBadge category={event.category} />
          </div>

          {/* Details */}
          <div className="mt-5 space-y-3">
            {/* Date */}
            <div className="flex items-center gap-3 text-ink-secondary">
              <Calendar size={18} className="shrink-0" />
              <span className="font-body text-sm">{formatDate(new Date(event.date + 'T00:00:00'))}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 text-ink-secondary">
              <Clock size={18} className="shrink-0" />
              <span className="font-body text-sm">
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </span>
            </div>

            {/* Location */}
            {event.address_label && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-meets-600 hover:text-meets-700 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin size={18} className="shrink-0" />
                <span className="font-body text-sm underline decoration-meets-200 group-hover:decoration-meets-500 underline-offset-2">
                  {event.address_label}
                </span>
                <ExternalLink size={14} className="shrink-0 opacity-50 group-hover:opacity-100" />
              </a>
            )}

            {/* Organizer */}
            {event.organizer_name && (
              <div className="flex items-center gap-3 text-ink-secondary">
                <User size={18} className="shrink-0" />
                <span className="font-body text-sm">{event.organizer_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-5">
              <p className="font-body text-sm text-ink-secondary leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Creator */}
          <p className="mt-4 text-xs text-ink-tertiary font-body">
            Created by {event.creator_username || 'Anonymous'}
          </p>

          {/* Interested button */}
          <div className="mt-5 flex items-center">
            <InterestedButton
              count={interestedCount}
              isInterested={isInterested}
              onToggle={onToggleInterest}
              size="md"
            />
          </div>

          {/* Manage buttons */}
          {canManage && (
            <div className="mt-6 pt-4 border-t border-surface-secondary flex items-center gap-3">
              <button
                onClick={() => onEdit(event)}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl
                  text-sm font-medium"
              >
                <Pencil size={16} />
                Edit
              </button>

              {!confirmDelete ? (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-500 font-body">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium
                      hover:bg-red-600 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg bg-surface-secondary text-ink text-sm
                      font-medium hover:bg-surface-tertiary transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

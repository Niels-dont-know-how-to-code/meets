import { useState } from 'react';
import { X, MapPin, Clock, User, Pencil, Trash2, Calendar, ExternalLink, Share2, Flag, BadgeCheck } from 'lucide-react';
import { formatTime, formatDate, isHappeningNow } from '../../lib/dateUtils';
import { supabase } from '../../lib/supabase';
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
  showToast,
  onOrganizerClick,
  friendsInterested,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCustomReason, setReportCustomReason] = useState('');
  const [reportStatus, setReportStatus] = useState(null); // 'success' | 'duplicate' | 'error'
  const [reportSubmitting, setReportSubmitting] = useState(false);

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

  const handleReport = async () => {
    const reason = reportReason === 'Other' ? reportCustomReason.trim() : reportReason;
    if (!reason) return;
    setReportSubmitting(true);
    try {
      const { error: err } = await supabase.from('reports').insert({
        event_id: event.id,
        reporter_id: user.id,
        reason,
      });
      if (err) {
        if (err.code === '23505') {
          setReportStatus('duplicate');
        } else {
          throw err;
        }
      } else {
        setReportStatus('success');
      }
    } catch {
      setReportStatus('error');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?event=${event.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url })
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showToast?.('Link copied to clipboard!')
      } catch {
        showToast?.('Could not copy link', 'error')
      }
    }
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
        {/* Close button + Report button */}
        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
          {user && !isCreator && (
            <button
              onClick={() => setShowReportForm((v) => !v)}
              className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
              title="Report event"
            >
              <Flag size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-secondary
              transition-colors text-ink-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Event image */}
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover rounded-t-2xl"
          />
        )}

        <div className={`p-6 ${event.image_url ? 'pt-4' : 'pt-8'}`}>
          {/* Title */}
          <h2 className="font-display text-2xl font-bold text-ink pr-8">
            {event.title}
          </h2>

          {/* Category + Live */}
          <div className="mt-3 flex items-center gap-2">
            <CategoryBadge category={event.category} />
            {isHappeningNow(event.start_time, event.end_time, event.date) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-green-100 text-green-700 text-[10px] font-display font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Report form (inline) */}
          {showReportForm && (
            <div className="mt-3 p-3 bg-surface-secondary rounded-xl">
              {reportStatus === 'success' ? (
                <p className="text-sm font-body text-green-600">Report submitted. Thank you.</p>
              ) : reportStatus === 'duplicate' ? (
                <p className="text-sm font-body text-amber-600">You already reported this event.</p>
              ) : reportStatus === 'error' ? (
                <p className="text-sm font-body text-red-500">Something went wrong. Please try again.</p>
              ) : (
                <>
                  <p className="text-sm font-display font-medium text-ink mb-2">Report this event</p>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 mb-2 bg-white"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Spam">Spam</option>
                    <option value="Inappropriate content">Inappropriate content</option>
                    <option value="Misleading information">Misleading information</option>
                    <option value="Other">Other</option>
                  </select>
                  {reportReason === 'Other' && (
                    <input
                      type="text"
                      value={reportCustomReason}
                      onChange={(e) => setReportCustomReason(e.target.value.slice(0, 500))}
                      placeholder="Describe the issue..."
                      maxLength={500}
                      className="w-full text-sm font-body border border-gray-200 rounded-lg px-3 py-2 mb-2 bg-white"
                    />
                  )}
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitting || (!reportReason || (reportReason === 'Other' && !reportCustomReason.trim()))}
                    className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </>
              )}
            </div>
          )}

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
                <button
                  onClick={() => onOrganizerClick?.(event.created_by_id)}
                  className="font-body text-sm text-meets-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {event.organizer_name}
                  {event.is_verified && <BadgeCheck size={14} className="text-meets-500" />}
                </button>
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
            Created by{' '}
            <button
              onClick={() => onOrganizerClick?.(event.created_by_id)}
              className="text-meets-600 hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              {event.creator_username || 'Anonymous'}
              {event.is_verified && <BadgeCheck size={12} className="text-meets-500" />}
            </button>
          </p>

          {/* Interested + Share */}
          <div className="mt-5 flex items-center gap-3">
            <InterestedButton
              count={interestedCount}
              isInterested={isInterested}
              onToggle={onToggleInterest}
              size="md"
            />
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-surface-secondary hover:bg-gray-100 text-ink-secondary
                text-sm font-display font-medium transition-colors"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>

          {/* Friends interested */}
          {friendsInterested && friendsInterested.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {friendsInterested.slice(0, 3).map((f, i) => (
                  f.friend_avatar ? (
                    <img
                      key={f.friend_id}
                      src={f.friend_avatar}
                      alt={f.friend_name}
                      className="w-5 h-5 rounded-full object-cover border-2 border-white"
                      style={{ zIndex: 3 - i }}
                    />
                  ) : (
                    <div
                      key={f.friend_id}
                      className="w-5 h-5 rounded-full bg-meets-500 flex items-center justify-center text-white text-[8px] font-bold border-2 border-white"
                      style={{ zIndex: 3 - i }}
                    >
                      {f.friend_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )
                ))}
              </div>
              <span className="text-xs text-ink-secondary font-body">
                {friendsInterested[0]?.friend_name}
                {friendsInterested.length > 1
                  ? ` and ${friendsInterested.length - 1} other${friendsInterested.length - 1 > 1 ? 's' : ''} interested`
                  : ' is interested'}
              </span>
            </div>
          )}

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

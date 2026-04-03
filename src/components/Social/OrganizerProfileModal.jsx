import { X, BadgeCheck } from 'lucide-react'
import CategoryBadge from '../Event/CategoryBadge'

export default function OrganizerProfileModal({
  profile,
  onClose,
  isFollowing,
  onFollow,
  onUnfollow,
  user,
}) {
  if (!profile) return null

  const memberSince = profile.member_since
    ? new Date(profile.member_since).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white max-h-[90vh] overflow-y-auto animate-slide-up shadow-overlay">
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-8">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-meets-500 flex items-center justify-center text-white text-xl font-bold">
                {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}

            {/* Name + verified */}
            <div className="mt-3 flex items-center gap-1.5">
              <h2 className="font-display text-xl font-bold text-ink">
                {profile.display_name || 'Anonymous'}
              </h2>
              {profile.is_verified && (
                <BadgeCheck size={18} className="text-meets-500" />
              )}
            </div>

            {/* Username */}
            {profile.username && (
              <p className="text-sm text-ink-secondary font-body mt-0.5">
                @{profile.username}
              </p>
            )}

            {/* Member since */}
            {memberSince && (
              <p className="text-xs text-ink-tertiary font-body mt-1">
                Member since {memberSince}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display font-bold text-lg text-ink">
                {profile.total_events ?? 0}
              </p>
              <p className="text-xs text-ink-secondary font-body">Events Hosted</p>
            </div>
            <div>
              <p className="font-display font-bold text-lg text-ink">
                {profile.total_interests ?? 0}
              </p>
              <p className="text-xs text-ink-secondary font-body">Total Interests</p>
            </div>
            <div>
              <p className="font-display font-bold text-lg text-ink">
                {profile.follower_count ?? 0}
              </p>
              <p className="text-xs text-ink-secondary font-body">Followers</p>
            </div>
          </div>

          {/* Follow/Unfollow button */}
          {user && user.id !== profile.id && (
            <div className="mt-5 flex justify-center">
              {isFollowing ? (
                <button
                  onClick={() => onUnfollow(profile.id)}
                  className="btn-secondary px-6 py-2 rounded-xl text-sm font-display font-medium"
                >
                  Following
                </button>
              ) : (
                <button
                  onClick={() => onFollow(profile.id)}
                  className="btn-primary px-6 py-2 rounded-xl text-sm font-display font-medium"
                >
                  Follow
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="mt-5 border-t border-surface-secondary" />

          {/* Past Events */}
          {profile.events && profile.events.length > 0 && (
            <div className="mt-5">
              <h3 className="font-display font-bold text-sm text-ink mb-3">Events</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {profile.events.map((evt, i) => (
                  <div
                    key={evt.id || i}
                    className="p-3 rounded-xl bg-surface-secondary"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryBadge category={evt.category} />
                      {evt.interested_count != null && (
                        <span className="text-xs text-ink-tertiary font-body ml-auto">
                          {evt.interested_count} interested
                        </span>
                      )}
                    </div>
                    <p className="font-display font-medium text-sm text-ink">
                      {evt.title}
                    </p>
                    <p className="text-xs text-ink-tertiary font-body mt-0.5">
                      {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

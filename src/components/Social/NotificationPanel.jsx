import { Heart, UserPlus, Users, UserCheck, Calendar, BellOff } from 'lucide-react'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago'
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago'
  return Math.floor(seconds / 86400) + 'd ago'
}

const typeConfig = {
  interest: { icon: Heart, bg: 'bg-pink-100', color: 'text-pink-500' },
  follow: { icon: UserPlus, bg: 'bg-blue-100', color: 'text-blue-500' },
  friend_request: { icon: Users, bg: 'bg-purple-100', color: 'text-purple-500' },
  friend_accepted: { icon: UserCheck, bg: 'bg-green-100', color: 'text-green-500' },
  new_event: { icon: Calendar, bg: 'bg-orange-100', color: 'text-orange-500' },
}

export default function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
  onNotificationClick,
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-float border border-gray-100 animate-fade-in z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-display font-bold text-sm">Notifications</span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-meets-500 hover:underline font-body"
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <BellOff size={28} className="text-ink-tertiary" />
            <span className="text-sm font-body text-ink-tertiary">
              No notifications yet
            </span>
          </div>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.new_event
            const Icon = config.icon

            return (
              <button
                key={notification.id}
                onClick={() => {
                  onNotificationClick?.(notification)
                  onMarkRead(notification.id)
                }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors text-left"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}
                >
                  <Icon size={16} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-ink truncate">
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-ink-tertiary truncate">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-ink-tertiary mt-0.5">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-meets-500 mt-2" />
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

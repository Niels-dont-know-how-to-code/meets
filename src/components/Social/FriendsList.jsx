import { useState } from 'react'
import { X, UserPlus, Check, XIcon, Trash2 } from 'lucide-react'

export default function FriendsList({
  friends,
  pendingRequests,
  onAccept,
  onDecline,
  onRemove,
  onSendRequest,
  onClose,
  user,
}) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null) // { type: 'success'|'error', message }
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)

  const handleSendRequest = async () => {
    if (!email.trim()) return
    setSending(true)
    setSendResult(null)
    const result = await onSendRequest(email.trim())
    if (result?.error) {
      setSendResult({ type: 'error', message: result.error })
    } else {
      setSendResult({ type: 'success', message: 'Friend request sent!' })
      setEmail('')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white max-h-[90vh] overflow-y-auto animate-slide-up shadow-overlay">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-3 flex items-center justify-between border-b border-surface-secondary">
          <h2 className="font-display text-xl font-bold text-ink">Friends</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-4">
          {/* Pending Friend Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display font-bold text-sm text-ink mb-3">
                Friend Requests
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingRequests.length}
                </span>
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.friendship_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary"
                  >
                    {req.avatar_url ? (
                      <img
                        src={req.avatar_url}
                        alt={req.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-meets-500 flex items-center justify-center text-white text-sm font-bold">
                        {req.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="flex-1 font-display font-medium text-sm text-ink truncate">
                      {req.display_name}
                    </span>
                    <button
                      onClick={() => onAccept(req.friendship_id)}
                      className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => onDecline(req.friendship_id)}
                      className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                      title="Decline"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Friends */}
          <div className="mb-6">
            <h3 className="font-display font-bold text-sm text-ink mb-3">Your Friends</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-ink-tertiary font-body">No friends yet. Add someone below!</p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.friendship_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary"
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-meets-500 flex items-center justify-center text-white text-sm font-bold">
                        {friend.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="flex-1 font-display font-medium text-sm text-ink truncate">
                      {friend.display_name}
                    </span>
                    {confirmRemoveId === friend.friendship_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-500 font-body">Remove?</span>
                        <button
                          onClick={() => {
                            onRemove(friend.friendship_id)
                            setConfirmRemoveId(null)
                          }}
                          className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="px-2 py-1 rounded-lg bg-surface-secondary text-ink text-xs font-medium hover:bg-surface-tertiary transition-colors border border-gray-200"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(friend.friendship_id)}
                        className="p-2 rounded-lg text-ink-tertiary hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Remove friend"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Friend */}
          <div>
            <h3 className="font-display font-bold text-sm text-ink mb-3">Add Friend</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSendResult(null)
                }}
                placeholder="Enter email address..."
                className="flex-1 text-sm font-body border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-meets-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
              />
              <button
                onClick={handleSendRequest}
                disabled={sending || !email.trim()}
                className="btn-primary px-4 py-2.5 rounded-xl text-sm font-display font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} />
                Send
              </button>
            </div>
            {sendResult && (
              <p
                className={`mt-2 text-sm font-body ${
                  sendResult.type === 'success' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {sendResult.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

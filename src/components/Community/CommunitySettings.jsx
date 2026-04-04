import { ArrowLeft, X, Shield, UserMinus, UserPlus, Check, XIcon, LogOut, Plus } from 'lucide-react'
import { useState } from 'react'

export default function CommunitySettings({
  community,
  members,
  pendingRequests,
  onBack,
  onApprove,
  onReject,
  onPromote,
  onRemoveMember,
  onCreateSubgroup,
  onLeaveCommunity,
  showToast,
}) {
  const [confirmLeave, setConfirmLeave] = useState(false)

  const handleApprove = async (request) => {
    await onApprove?.(request.id)
    showToast?.('Member approved')
  }

  const handleReject = async (request) => {
    await onReject?.(request.id)
    showToast?.('Request declined')
  }

  const handlePromote = async (member) => {
    await onPromote?.(member.id)
    showToast?.(`${member.display_name} is now an admin`)
  }

  const handleRemove = async (member) => {
    await onRemoveMember?.(member.id)
    showToast?.(`Removed ${member.display_name}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-display font-bold text-base text-ink">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Community Info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-meets-500 flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0">
              {community.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink">{community.name}</h3>
              <p className="font-body text-xs text-ink-tertiary mt-0.5">{community.member_count} members</p>
            </div>
          </div>
          {community.description && (
            <p className="font-body text-sm text-ink-secondary mt-3">{community.description}</p>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-display font-bold text-sm text-ink mb-3 flex items-center gap-2">
              Join Requests
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            </h3>
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <div className="w-9 h-9 rounded-full bg-meets-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {req.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="flex-1 font-display font-medium text-sm text-ink truncate">
                    {req.display_name}
                  </span>
                  <button
                    onClick={() => handleApprove(req)}
                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-sm text-ink mb-3">
            Members ({members.length})
          </h3>
          <div className="space-y-1.5">
            {members.map(member => (
              <div key={member.user_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-secondary transition-colors">
                <div className="w-9 h-9 rounded-full bg-meets-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {member.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-medium text-sm text-ink truncate">
                      {member.display_name}
                    </span>
                    {member.role === 'admin' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-display font-medium text-meets-600 bg-meets-50 px-1.5 py-0.5 rounded-full">
                        <Shield size={10} />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                {member.role !== 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePromote(member)}
                      className="p-1.5 rounded-lg text-ink-tertiary hover:bg-meets-50 hover:text-meets-500 transition-colors"
                      title="Make admin"
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => handleRemove(member)}
                      className="p-1.5 rounded-lg text-ink-tertiary hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove member"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create Sub-group */}
        {onCreateSubgroup && (
          <div className="px-5 py-4 border-b border-gray-100">
            <button
              onClick={onCreateSubgroup}
              className="w-full btn-secondary py-2.5 text-sm font-display font-medium inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Create New Group
            </button>
          </div>
        )}

        {/* Leave Community */}
        <div className="px-5 py-4">
          {confirmLeave ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50">
              <span className="font-body text-sm text-red-600 flex-1">Leave this community?</span>
              <button
                onClick={onLeaveCommunity}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-display font-medium"
              >
                Leave
              </button>
              <button
                onClick={() => setConfirmLeave(false)}
                className="px-3 py-1.5 rounded-lg bg-white text-ink text-sm font-display font-medium border border-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                text-red-500 font-display font-medium text-sm
                hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Leave Community
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

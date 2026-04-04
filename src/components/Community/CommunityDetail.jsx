import { useState } from 'react'
import { ArrowLeft, Settings, MessageSquare, Hash, Users } from 'lucide-react'
import ChatView from './ChatView'
import SubgroupList from './SubgroupList'

export default function CommunityDetail({
  community,
  user,
  messages,
  messagesLoading,
  onSendMessage,
  onBack,
  subgroups,
  onSelectSubgroup,
  onOpenSettings,
  isAdmin,
  pendingRequestCount,
  onLoadMore,
  hasMore,
}) {
  const [activeTab, setActiveTab] = useState('chat')

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

        {/* Community avatar */}
        <div className="w-9 h-9 rounded-full bg-meets-500 flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
          {community.image_url ? (
            <img
              src={community.image_url}
              alt={community.name}
              className="w-9 h-9 rounded-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            community.name?.charAt(0)?.toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-sm text-ink truncate">
            {community.name}
          </h2>
          <p className="font-body text-[11px] text-ink-tertiary">
            {community.member_count} members
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenSettings}
            className="relative p-2 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
          >
            <Settings size={18} />
            {pendingRequestCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingRequestCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 text-sm font-display font-medium transition-colors border-b-2
            inline-flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'text-meets-500 border-meets-500'
              : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
          }`}
        >
          <MessageSquare size={14} />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2.5 text-sm font-display font-medium transition-colors border-b-2
            inline-flex items-center justify-center gap-1.5 ${
            activeTab === 'groups'
              ? 'text-meets-500 border-meets-500'
              : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
          }`}
        >
          <Hash size={14} />
          Groups
          {subgroups.length > 0 && (
            <span className="text-[10px] bg-surface-secondary rounded-full px-1.5 py-0.5">
              {subgroups.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <ChatView
          messages={messages}
          loading={messagesLoading}
          onSendMessage={onSendMessage}
          user={user}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <SubgroupList
            subgroups={subgroups}
            onSelect={onSelectSubgroup}
            isAdmin={isAdmin}
            onCreateSubgroup={() => {}}
          />
        </div>
      )}
    </div>
  )
}

import { useState, useCallback, useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import { useCommunityChat } from '../../hooks/useCommunityChat'
import CommunityList from './CommunityList'
import CommunityDetail from './CommunityDetail'
import CreateCommunityForm from './CreateCommunityForm'
import CommunitySettings from './CommunitySettings'
import CommunityDiscover from './CommunityDiscover'
import CreateSubgroupForm from './CreateSubgroupForm'
import ChatView from './ChatView'

export default function CommunityOverlay({
  show,
  onClose,
  user,
  communities,
  loading,
  communityHook,
  showToast,
}) {
  // Internal navigation
  const [screen, setScreen] = useState('list')
  const [activeCommunity, setActiveCommunity] = useState(null)
  const [activeSubgroup, setActiveSubgroup] = useState(null)
  const [communityDetail, setCommunityDetail] = useState(null)

  // Derive chat channel IDs from navigation state
  const chatCommunityId = (screen === 'detail' || screen === 'subgroup-chat') ? activeCommunity?.id : null
  const chatSubgroupId = screen === 'subgroup-chat' ? activeSubgroup?.id : null

  // Dedicated chat hook — manages messages, polling, pagination, optimistic send
  const chat = useCommunityChat(chatCommunityId, chatSubgroupId, user)

  const navigateTo = useCallback((newScreen) => {
    setScreen(newScreen)
  }, [])

  const handleSelectCommunity = useCallback(async (community) => {
    setActiveCommunity(community)
    setActiveSubgroup(null)
    navigateTo('detail')

    // Fetch community detail (members, subgroups, pending requests)
    const detail = await communityHook.fetchCommunityDetail(community.id)
    if (detail) setCommunityDetail(detail)
  }, [communityHook, navigateTo])

  const handleSelectSubgroup = useCallback((subgroup) => {
    setActiveSubgroup(subgroup)
    navigateTo('subgroup-chat')
    // useCommunityChat will auto-fetch messages for the new channel
  }, [navigateTo])

  const handleSendMessage = useCallback(async (content) => {
    const result = await chat.sendMessage(content)
    if (result?.error) {
      showToast?.('Failed to send message', 'error')
    }
  }, [chat, showToast])

  const handleCreateCommunity = useCallback(async (data) => {
    const result = await communityHook.createCommunity(data)
    if (result?.error) {
      showToast?.(result.error, 'error')
      return
    }
    showToast?.('Community created!')
    navigateTo('list')
    communityHook.refreshCommunities()
  }, [communityHook, showToast, navigateTo])

  const handleCreateSubgroup = useCallback(async (data) => {
    const result = await communityHook.createSubgroup(activeCommunity?.id, data)
    if (result?.error) {
      showToast?.(result.error, 'error')
      return
    }
    showToast?.('Group created!')
    navigateTo('detail')
    const detail = await communityHook.fetchCommunityDetail(activeCommunity.id)
    if (detail) setCommunityDetail(detail)
  }, [activeCommunity, communityHook, showToast, navigateTo])

  const handleRequestJoin = useCallback(async (communityId) => {
    const result = await communityHook.requestJoin(communityId)
    if (result?.error) {
      showToast?.(result.error, 'error')
      return
    }
    showToast?.('Join request sent!')
  }, [communityHook, showToast])

  const handleBack = useCallback(() => {
    if (screen === 'subgroup-chat' || screen === 'create-subgroup') {
      setActiveSubgroup(null)
      navigateTo('detail')
      // useCommunityChat will switch back to main channel automatically
    } else if (screen === 'detail' || screen === 'create' || screen === 'settings' || screen === 'discover') {
      navigateTo('list')
      setActiveCommunity(null)
      setActiveSubgroup(null)
      setCommunityDetail(null)
    }
  }, [screen, navigateTo])

  // Reset when overlay closes
  const handleClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      setScreen('list')
      setActiveCommunity(null)
      setActiveSubgroup(null)
      setCommunityDetail(null)
    }, 300)
  }, [onClose])

  if (!show) return null

  const currentSubgroups = communityDetail?.subgroups || []
  const currentMembers = communityDetail?.members || []
  const pendingRequests = communityDetail?.pendingRequests || []
  const isAdmin = activeCommunity?.my_role === 'admin'

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/30 pointer-events-auto animate-fade-in"
      />

      {/* Panel */}
      <div
        className="overlay-panel pointer-events-auto animate-slide-up
          absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl
          md:static md:absolute md:top-0 md:right-0 md:bottom-0 md:left-auto
          md:w-[420px] md:max-h-full md:rounded-t-none md:rounded-l-3xl
          flex flex-col shadow-overlay bg-white"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header — for list, create, discover, create-subgroup screens */}
        {['list', 'create', 'discover', 'create-subgroup'].includes(screen) && (
          <div className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              {screen !== 'list' && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h2 className="font-display font-extrabold text-xl text-ink tracking-tight">
                {screen === 'create' ? 'New Community' : screen === 'discover' ? 'Discover' : screen === 'create-subgroup' ? 'New Group' : 'Communities'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {screen === 'list' && (
            <div className="flex-1 overflow-y-auto">
              <CommunityList
                communities={communities}
                onSelect={handleSelectCommunity}
                onCreateClick={() => navigateTo('create')}
                onDiscoverClick={() => navigateTo('discover')}
                loading={loading}
              />
            </div>
          )}

          {screen === 'detail' && activeCommunity && (
            <CommunityDetail
              community={activeCommunity}
              user={user}
              messages={chat.messages}
              messagesLoading={chat.loading}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              subgroups={currentSubgroups}
              onSelectSubgroup={handleSelectSubgroup}
              onOpenSettings={() => navigateTo('settings')}
              isAdmin={isAdmin}
              pendingRequestCount={pendingRequests.length}
              onCreateSubgroup={() => navigateTo('create-subgroup')}
              onLoadMore={chat.loadMore}
              hasMore={chat.hasMore}
              newMessageCount={chat.newMessageCount}
              onMarkAsRead={chat.markAsRead}
              onSetIsActive={chat.setIsActive}
            />
          )}

          {screen === 'subgroup-chat' && activeSubgroup && (
            <div className="flex flex-col h-full">
              {/* Subgroup header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-sm text-ink truncate">
                    {activeSubgroup.name}
                  </h2>
                  <p className="font-body text-[11px] text-ink-tertiary">
                    {activeSubgroup.member_count} members
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <ChatView
                  messages={chat.messages}
                  loading={chat.loading}
                  onSendMessage={handleSendMessage}
                  user={user}
                  onLoadMore={chat.loadMore}
                  hasMore={chat.hasMore}
                  newMessageCount={chat.newMessageCount}
                  onMarkAsRead={chat.markAsRead}
                  onSetIsActive={chat.setIsActive}
                />
              </div>
            </div>
          )}

          {screen === 'create' && (
            <div className="flex-1 overflow-y-auto">
              <CreateCommunityForm
                onSubmit={handleCreateCommunity}
                onCancel={handleBack}
              />
            </div>
          )}

          {screen === 'settings' && activeCommunity && (
            <CommunitySettings
              community={activeCommunity}
              members={currentMembers}
              pendingRequests={pendingRequests}
              onBack={() => navigateTo('detail')}
              onApprove={communityHook.approveJoin}
              onReject={communityHook.rejectJoin}
              onPromote={communityHook.promoteMember}
              onRemoveMember={communityHook.removeMember}
              onCreateSubgroup={() => navigateTo('create-subgroup')}
              onLeaveCommunity={async () => {
                await communityHook.leaveCommunity(activeCommunity.id)
                navigateTo('list')
                showToast?.('Left community')
              }}
              showToast={showToast}
            />
          )}

          {screen === 'discover' && (
            <div className="flex-1 overflow-y-auto">
              <CommunityDiscover
                onSearch={communityHook.searchCommunities}
                onRequestJoin={handleRequestJoin}
              />
            </div>
          )}

          {screen === 'create-subgroup' && (
            <div className="flex-1 overflow-y-auto">
              <CreateSubgroupForm
                onSubmit={handleCreateSubgroup}
                onCancel={handleBack}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

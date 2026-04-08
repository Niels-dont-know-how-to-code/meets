import { useRef, useEffect, useState, useCallback } from 'react'
import { Loader2, ChevronDown, ArrowDown } from 'lucide-react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

function formatDateSeparator(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function groupMessages(messages) {
  const groups = []
  let currentDate = null

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString()
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groups.push({ type: 'date', date: msg.created_at })
    }
    groups.push({ type: 'message', message: msg })
  }
  return groups
}

export default function ChatView({
  messages,
  loading,
  onSendMessage,
  user,
  onLoadMore,
  hasMore,
  newMessageCount = 0,
  onMarkAsRead,
  onSetIsActive,
}) {
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const isNearBottom = useRef(true)
  const prevMessageCount = useRef(messages.length)
  const prevScrollHeight = useRef(0)

  // Auto-scroll to bottom on new messages if user is near bottom
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const wasLoadMore = messages.length - prevMessageCount.current > 1 && !isNearBottom.current
      if (isNearBottom.current) {
        // New message arrived and user is at bottom — scroll down
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else if (wasLoadMore && scrollRef.current) {
        // Loaded older messages — preserve scroll position
        const newScrollHeight = scrollRef.current.scrollHeight
        const heightDiff = newScrollHeight - prevScrollHeight.current
        scrollRef.current.scrollTop += heightDiff
      }
    }
    prevMessageCount.current = messages.length
  }, [messages.length])

  // Initial scroll to bottom
  useEffect(() => {
    if (bottomRef.current && !loading && messages.length > 0) {
      bottomRef.current.scrollIntoView()
    }
  }, [loading, messages.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = distFromBottom < 100
    isNearBottom.current = nearBottom
    setShowScrollDown(distFromBottom > 300)

    // Notify hook whether user is actively reading latest
    onSetIsActive?.(nearBottom)

    // Clear new message count when scrolling back to bottom
    if (nearBottom && newMessageCount > 0) {
      onMarkAsRead?.()
    }

    // Save scroll height for position preservation on load-more
    prevScrollHeight.current = el.scrollHeight

    // Load more when scrolled to top
    if (el.scrollTop < 50 && hasMore && !loading) {
      prevScrollHeight.current = el.scrollHeight
      onLoadMore?.()
    }
  }, [hasMore, loading, onLoadMore, onSetIsActive, onMarkAsRead, newMessageCount])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    onMarkAsRead?.()
  }, [onMarkAsRead])

  const grouped = groupMessages(messages)
  const currentUserId = user?.id

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Load more indicator */}
        {loading && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <Loader2 size={20} className="animate-spin text-meets-500" />
          </div>
        )}

        {/* Has more indicator */}
        {hasMore && !loading && messages.length > 0 && (
          <button
            onClick={onLoadMore}
            className="w-full text-center py-2 text-xs font-display font-medium text-meets-500 hover:text-meets-600"
          >
            Load older messages
          </button>
        )}

        {/* Loading skeleton */}
        {loading && messages.length === 0 && (
          <div className="space-y-4 py-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                <div className="flex gap-2">
                  {i % 3 !== 0 && <div className="w-8 h-8 rounded-full bg-surface-tertiary flex-shrink-0" />}
                  <div>
                    {i % 3 !== 0 && <div className="w-16 h-2.5 rounded bg-surface-tertiary mb-1.5" />}
                    <div className={`rounded-2xl bg-surface-secondary ${i % 2 === 0 ? 'w-52 h-10' : 'w-40 h-14'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-meets-50 flex items-center justify-center mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="font-display font-bold text-sm text-ink">No messages yet</p>
            <p className="font-body text-xs text-ink-tertiary mt-1">Be the first to say something!</p>
          </div>
        )}

        {/* Messages with date separators and sender grouping */}
        {grouped.map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${item.date}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="font-display text-[11px] text-ink-tertiary font-medium px-2">
                  {formatDateSeparator(item.date)}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )
          }

          const msg = item.message
          const isOwn = msg.sender_id === currentUserId
          // Show sender info if different sender than previous message
          const prevItem = grouped[index - 1]
          const showSender = !isOwn && (
            !prevItem ||
            prevItem.type === 'date' ||
            prevItem.message?.sender_id !== msg.sender_id
          )

          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              showSender={showSender}
            />
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* New messages floating pill */}
      {newMessageCount > 0 && !isNearBottom.current && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full
            bg-meets-500 text-white shadow-float text-xs font-display font-medium
            flex items-center gap-1.5 animate-bounce-in z-10
            hover:bg-meets-600 transition-colors"
        >
          <ArrowDown size={14} />
          {newMessageCount} new message{newMessageCount > 1 ? 's' : ''}
        </button>
      )}

      {/* Scroll to bottom button (no new messages, just scrolled up) */}
      {showScrollDown && newMessageCount === 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 w-9 h-9 rounded-full bg-white shadow-float
            flex items-center justify-center text-ink-secondary hover:text-ink transition-colors z-10"
        >
          <ChevronDown size={20} />
        </button>
      )}

      {/* Input */}
      <ChatInput onSend={onSendMessage} />
    </div>
  )
}

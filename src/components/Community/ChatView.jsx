import { useRef, useEffect, useState } from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import MessageBubble from './MessageBubble'
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

export default function ChatView({ messages, loading, onSendMessage, user, onLoadMore, hasMore }) {
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const isNearBottom = useRef(true)

  // Auto-scroll to bottom on new messages if user is near bottom
  useEffect(() => {
    if (isNearBottom.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Initial scroll to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView()
    }
  }, [])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottom.current = distFromBottom < 100
    setShowScrollDown(distFromBottom > 300)

    // Load more when scrolled to top
    if (el.scrollTop < 50 && hasMore && !loading) {
      onLoadMore?.()
    }
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const grouped = groupMessages(messages)
  const currentUserId = user?.id

  return (
    <div className="flex flex-col flex-1 min-h-0">
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

        {/* Loading skeleton */}
        {loading && messages.length === 0 && (
          <div className="space-y-4 py-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl bg-surface-secondary animate-pulse ${i % 3 === 0 ? 'w-48' : 'w-56'} h-12`} />
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-ink-tertiary">No messages yet</p>
            <p className="font-body text-xs text-ink-tertiary mt-1">Be the first to say something!</p>
          </div>
        )}

        {grouped.map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${item.date}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="font-display text-[11px] text-ink-tertiary font-medium">
                  {formatDateSeparator(item.date)}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )
          }

          const msg = item.message
          const isOwn = msg.sender_id === currentUserId
          // Show sender info if it's a different sender than previous message
          const prevItem = grouped[index - 1]
          const showSender = !isOwn && (
            !prevItem ||
            prevItem.type === 'date' ||
            prevItem.message?.sender_id !== msg.sender_id
          )

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              showSender={showSender}
            />
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
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

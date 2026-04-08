import { useState, useEffect, useCallback, useRef } from 'react'
import { MOCK_MESSAGES } from '../lib/mockCommunityData'

const POLL_INTERVAL = 5000 // 5 seconds when chat is active
const PAGE_SIZE = 50

/**
 * Dedicated chat hook for a single channel (community main or subgroup).
 * Manages messages, polling, pagination, and optimistic sends.
 * Follows the useNotifications polling pattern.
 *
 * Will be swapped to Supabase RPC calls in production.
 */
export function useCommunityChat(communityId, subgroupId, user) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)

  // Track the latest message timestamp for incremental polling
  const latestTimestampRef = useRef(null)
  // Track scroll-anchored state (whether user is reading history)
  const isActiveRef = useRef(true)
  // Prevent duplicate fetches
  const fetchingRef = useRef(false)
  // Track the current channel to detect switches
  const channelKeyRef = useRef(null)

  const getChannelKey = useCallback(() => {
    return subgroupId ? `sub-${subgroupId}` : `comm-${communityId}`
  }, [communityId, subgroupId])

  // Fetch initial messages for the channel
  const fetchMessages = useCallback(async () => {
    if (!communityId || fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)

    // Simulate API call — will be replaced with Supabase RPC
    await new Promise(r => setTimeout(r, 200))
    const key = subgroupId ? `sub-${subgroupId}` : `comm-${communityId}`
    const allMessages = MOCK_MESSAGES[key] || []

    // Take last PAGE_SIZE messages (most recent)
    const page = allMessages.slice(-PAGE_SIZE)
    setMessages(page)
    setHasMore(allMessages.length > PAGE_SIZE)
    setNewMessageCount(0)

    // Track latest timestamp
    if (page.length > 0) {
      latestTimestampRef.current = page[page.length - 1].created_at
    }

    setLoading(false)
    fetchingRef.current = false
  }, [communityId, subgroupId])

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!communityId || !hasMore || fetchingRef.current) return
    fetchingRef.current = true

    await new Promise(r => setTimeout(r, 150))
    const key = subgroupId ? `sub-${subgroupId}` : `comm-${communityId}`
    const allMessages = MOCK_MESSAGES[key] || []

    // In real impl: fetch messages WHERE created_at < oldestLoadedMessage
    // For mock: we already have all messages, so just show hasMore = false
    setHasMore(false)
    fetchingRef.current = false
  }, [communityId, subgroupId, hasMore])

  // Poll for new messages (incremental fetch)
  const pollNewMessages = useCallback(async () => {
    if (!communityId || fetchingRef.current) return

    // In real impl: fetch messages WHERE created_at > latestTimestampRef.current
    // For mock: simulate by checking if MOCK_MESSAGES has grown (it won't, but the pattern is here)
    const key = subgroupId ? `sub-${subgroupId}` : `comm-${communityId}`
    const allMessages = MOCK_MESSAGES[key] || []

    if (latestTimestampRef.current) {
      const newMsgs = allMessages.filter(m => m.created_at > latestTimestampRef.current)
      if (newMsgs.length > 0) {
        setMessages(prev => {
          // Deduplicate by id
          const existingIds = new Set(prev.map(m => m.id))
          const uniqueNew = newMsgs.filter(m => !existingIds.has(m.id))
          if (uniqueNew.length === 0) return prev
          return [...prev, ...uniqueNew]
        })
        latestTimestampRef.current = newMsgs[newMsgs.length - 1].created_at

        // If user is scrolled up, show "new messages" indicator instead of auto-scrolling
        if (!isActiveRef.current) {
          setNewMessageCount(prev => prev + newMsgs.length)
        }
      }
    }
  }, [communityId, subgroupId])

  // Send a message with optimistic update
  const sendMessage = useCallback(async (content) => {
    if (!communityId || !content.trim()) return

    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_id: user?.id,
      sender_name: user?.user_metadata?.display_name || 'You',
      sender_avatar: user?.user_metadata?.avatar_url || null,
      content: content.trim(),
      created_at: new Date().toISOString(),
      _pending: true,
    }

    // Optimistic: add to messages immediately
    setMessages(prev => [...prev, tempMsg])
    latestTimestampRef.current = tempMsg.created_at

    // Simulate API call
    await new Promise(r => setTimeout(r, 100))

    // In real impl: INSERT into community_messages, then replace temp with server response
    // For mock: just mark as "sent" (remove _pending flag)
    setMessages(prev =>
      prev.map(m => m.id === tempMsg.id ? { ...m, _pending: false } : m)
    )

    return { success: true }
  }, [communityId, user])

  // Mark channel as read (reset new message count)
  const markAsRead = useCallback(() => {
    setNewMessageCount(0)
  }, [])

  // Set whether user is actively viewing latest messages (for new message indicator)
  const setIsActive = useCallback((active) => {
    isActiveRef.current = active
    if (active) {
      setNewMessageCount(0)
    }
  }, [])

  // Fetch messages when channel changes
  useEffect(() => {
    const newKey = getChannelKey()
    if (newKey !== channelKeyRef.current) {
      channelKeyRef.current = newKey
      latestTimestampRef.current = null
      setMessages([])
      setNewMessageCount(0)
      fetchMessages()
    }
  }, [getChannelKey, fetchMessages])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!communityId) return

    const interval = setInterval(pollNewMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [communityId, pollNewMessages])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      channelKeyRef.current = null
      latestTimestampRef.current = null
    }
  }, [])

  return {
    messages,
    loading,
    hasMore,
    newMessageCount,
    sendMessage,
    loadMore,
    markAsRead,
    setIsActive,
    refreshMessages: fetchMessages,
  }
}

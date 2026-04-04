import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MOCK_COMMUNITIES,
  MOCK_MEMBERS,
  MOCK_SUBGROUPS,
  MOCK_MESSAGES,
  MOCK_JOIN_REQUESTS,
} from '../lib/mockCommunityData'

// Mock-data-backed hook. Will be replaced with Supabase calls later.
export function useCommunities(user) {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  // Fetch user's communities
  const fetchCommunities = useCallback(async () => {
    if (!user) {
      setCommunities([])
      setLoading(false)
      return
    }
    // Simulate API delay
    await new Promise(r => setTimeout(r, 300))
    setCommunities(MOCK_COMMUNITIES)
    setLoading(false)
  }, [user])

  const refreshCommunities = useCallback(() => {
    setLoading(true)
    return fetchCommunities()
  }, [fetchCommunities])

  // Fetch full community detail (members, subgroups, pending requests)
  const fetchCommunityDetail = useCallback(async (communityId) => {
    await new Promise(r => setTimeout(r, 200))
    const community = MOCK_COMMUNITIES.find(c => c.id === communityId)
    if (!community) return null

    return {
      ...community,
      members: MOCK_MEMBERS[communityId] || [],
      subgroups: MOCK_SUBGROUPS[communityId] || [],
      pendingRequests: community.my_role === 'admin'
        ? (MOCK_JOIN_REQUESTS[communityId] || [])
        : [],
    }
  }, [])

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (communityId, subgroupId) => {
    await new Promise(r => setTimeout(r, 150))
    const key = subgroupId ? `sub-${subgroupId}` : `comm-${communityId}`
    return MOCK_MESSAGES[key] || []
  }, [])

  // Send a message (mock — just returns success)
  const sendMessage = useCallback(async (communityId, subgroupId, content) => {
    await new Promise(r => setTimeout(r, 100))
    // In real impl, this would INSERT into messages table
    return { success: true }
  }, [])

  // Create a community
  const createCommunity = useCallback(async ({ name, description }) => {
    await new Promise(r => setTimeout(r, 400))
    const newCommunity = {
      id: 'comm-' + Date.now(),
      name,
      description,
      image_url: null,
      created_by: user?.id,
      created_at: new Date().toISOString(),
      member_count: 1,
      my_role: 'admin',
      last_message_preview: null,
      last_message_at: new Date().toISOString(),
    }
    setCommunities(prev => [newCommunity, ...prev])
    return { success: true, community: newCommunity }
  }, [user])

  // Request to join a community
  const requestJoin = useCallback(async (communityId) => {
    await new Promise(r => setTimeout(r, 200))
    return { success: true }
  }, [])

  // Approve a join request (admin)
  const approveJoin = useCallback(async (requestId) => {
    await new Promise(r => setTimeout(r, 200))
    return { success: true }
  }, [])

  // Reject a join request (admin)
  const rejectJoin = useCallback(async (requestId) => {
    await new Promise(r => setTimeout(r, 200))
    return { success: true }
  }, [])

  // Promote member to admin
  const promoteMember = useCallback(async (memberId) => {
    await new Promise(r => setTimeout(r, 200))
    return { success: true }
  }, [])

  // Remove a member
  const removeMember = useCallback(async (memberId) => {
    await new Promise(r => setTimeout(r, 200))
    return { success: true }
  }, [])

  // Leave a community
  const leaveCommunity = useCallback(async (communityId) => {
    await new Promise(r => setTimeout(r, 200))
    setCommunities(prev => prev.filter(c => c.id !== communityId))
    return { success: true }
  }, [])

  // Create a subgroup (admin)
  const createSubgroup = useCallback(async (communityId, { name, description }) => {
    await new Promise(r => setTimeout(r, 300))
    return { success: true }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  return {
    communities,
    loading,
    fetchCommunities,
    refreshCommunities,
    fetchCommunityDetail,
    fetchMessages,
    sendMessage,
    createCommunity,
    requestJoin,
    approveJoin,
    rejectJoin,
    promoteMember,
    removeMember,
    leaveCommunity,
    createSubgroup,
  }
}

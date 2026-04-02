import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSocial(user, selectedDate) {
  const [followedIds, setFollowedIds] = useState(new Set())
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [friendsInterests, setFriendsInterests] = useState(new Map())

  const fetchFollowedIds = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    if (error) {
      console.error('Error fetching follows:', error)
      return
    }
    setFollowedIds(new Set(data.map((r) => r.following_id)))
  }, [user])

  const fetchFriends = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching friends:', error)
      return
    }

    // Get the friend user IDs (the other person) and fetch their profiles via RPC
    const friendEntries = data.map((f) => ({
      friendship_id: f.id,
      friend_id: f.user_id === user.id ? f.friend_id : f.user_id,
    }))

    if (friendEntries.length === 0) {
      setFriends([])
      return
    }

    // Fetch each friend's profile via the organizer RPC (reuse existing)
    const profiles = await Promise.all(
      friendEntries.map(async (entry) => {
        const { data: profile } = await supabase.rpc('get_organizer_profile', {
          organizer_id: entry.friend_id,
        })
        return {
          id: entry.friend_id,
          friendship_id: entry.friendship_id,
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
        }
      })
    )
    setFriends(profiles)
  }, [user])

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id')
      .eq('friend_id', user.id)
      .eq('status', 'pending')

    if (error) {
      console.error('Error fetching pending requests:', error)
      return
    }

    if (data.length === 0) {
      setPendingRequests([])
      return
    }

    // Fetch sender profiles via RPC
    const requests = await Promise.all(
      data.map(async (r) => {
        const { data: profile } = await supabase.rpc('get_organizer_profile', {
          organizer_id: r.user_id,
        })
        return {
          friendship_id: r.id,
          user_id: r.user_id,
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
        }
      })
    )
    setPendingRequests(requests)
  }, [user])

  const fetchFriendsInterests = useCallback(async () => {
    if (!user || !selectedDate) return
    try {
      const dateStr = typeof selectedDate === 'string'
        ? selectedDate
        : selectedDate.toISOString().split('T')[0]

      const { data, error } = await supabase.rpc('get_friends_interests', {
        target_date: dateStr,
      })

      if (error) {
        console.error('Error fetching friends interests:', error)
        return
      }

      const map = new Map()
      for (const row of data || []) {
        if (!map.has(row.event_id)) {
          map.set(row.event_id, [])
        }
        map.get(row.event_id).push({
          friend_id: row.friend_id,
          friend_name: row.friend_name,
          friend_avatar: row.friend_avatar,
        })
      }
      setFriendsInterests(map)
    } catch (err) {
      console.error('Error fetching friends interests:', err)
    }
  }, [user, selectedDate])

  const followUser = useCallback(
    async (userId) => {
      if (!user) return
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: userId })

      if (error) {
        console.error('Error following user:', error)
        return { error }
      }
      setFollowedIds((prev) => new Set([...prev, userId]))
      return { success: true }
    },
    [user]
  )

  const unfollowUser = useCallback(
    async (userId) => {
      if (!user) return
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)

      if (error) {
        console.error('Error unfollowing user:', error)
        return { error }
      }
      setFollowedIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
      return { success: true }
    },
    [user]
  )

  const sendFriendRequest = useCallback(
    async (email) => {
      if (!user) return { error: 'Not authenticated' }

      const { data, error: rpcError } = await supabase.rpc('search_user_by_email', {
        search_email: email.trim().toLowerCase(),
      })

      if (rpcError) {
        console.error('Error searching user:', rpcError)
        return { error: 'Could not find user' }
      }

      // RPC returns a single json object, not an array
      if (!data) {
        return { error: 'No user found with that email' }
      }

      const targetId = data.id
      if (targetId === user.id) {
        return { error: 'You cannot add yourself' }
      }

      const { error: insertError } = await supabase
        .from('friendships')
        .insert({ user_id: user.id, friend_id: targetId, status: 'pending' })

      if (insertError) {
        if (insertError.code === '23505') {
          return { error: 'Friend request already sent' }
        }
        console.error('Error sending friend request:', insertError)
        return { error: 'Could not send request' }
      }

      return { success: true }
    },
    [user]
  )

  const acceptFriendRequest = useCallback(async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (error) {
      console.error('Error accepting request:', error)
      return { error }
    }
    await fetchFriends()
    await fetchPendingRequests()
    return { success: true }
  }, [fetchFriends, fetchPendingRequests])

  const declineFriendRequest = useCallback(async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) {
      console.error('Error declining request:', error)
      return { error }
    }
    await fetchPendingRequests()
    return { success: true }
  }, [fetchPendingRequests])

  const removeFriend = useCallback(async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) {
      console.error('Error removing friend:', error)
      return { error }
    }
    await fetchFriends()
    return { success: true }
  }, [fetchFriends])

  const searchOrganisers = useCallback(async (term) => {
    if (!term || term.trim().length < 2) return []
    const { data, error } = await supabase.rpc('search_organisers', {
      search_term: term.trim(),
    })
    if (error) {
      console.error('Error searching organisers:', error)
      return []
    }
    return data || []
  }, [])

  const fetchOrganizerProfile = useCallback(async (userId) => {
    const { data, error } = await supabase.rpc('get_organizer_profile', {
      organizer_id: userId,
    })

    if (error) {
      console.error('Error fetching organizer profile:', error)
      return null
    }
    return data
  }, [])

  // Fetch initial data when user is available
  useEffect(() => {
    if (user) {
      fetchFollowedIds()
      fetchFriends()
      fetchPendingRequests()
    } else {
      setFollowedIds(new Set())
      setFriends([])
      setPendingRequests([])
      setFriendsInterests(new Map())
    }
  }, [user, fetchFollowedIds, fetchFriends, fetchPendingRequests])

  // Fetch friends interests when selectedDate changes
  useEffect(() => {
    if (user && selectedDate) {
      fetchFriendsInterests()
    }
  }, [user, selectedDate, fetchFriendsInterests])

  return {
    followUser,
    unfollowUser,
    followedIds,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    friends,
    pendingRequests,
    fetchOrganizerProfile,
    searchOrganisers,
    friendsInterests,
  }
}

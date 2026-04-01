import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateForApi } from '../lib/dateUtils'

export function useEvents(selectedDate) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userInterests, setUserInterests] = useState(new Set())
  const fetchIdRef = useRef(0)

  const fetchUserInterests = useCallback(async (userId) => {
    const { data, error: err } = await supabase
      .from('interests')
      .select('event_id')
      .eq('user_id', userId)

    if (err) {
      console.error('Error fetching user interests:', err)
      return new Set()
    }

    return new Set(data.map((row) => row.event_id))
  }, [])

  const fetchEvents = useCallback(async (date) => {
    const currentId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_events_with_details', {
        target_date: formatDateForApi(date),
      })

      if (rpcError) throw rpcError
      if (currentId !== fetchIdRef.current) return // stale request, discard

      // Filter out events with 3+ reports (auto-hide flagged content)
      const filtered = (data || []).filter(e => (e.report_count ?? 0) < 3)
      setEvents(filtered)

      // Fetch user interests if authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const interests = await fetchUserInterests(session.user.id)
        setUserInterests(interests)
      }
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [fetchUserInterests])

  const createEvent = useCallback(async (eventData) => {
    const { data, error: insertError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (insertError) {
      return { error: insertError }
    }

    return { data }
  }, [])

  const updateEvent = useCallback(async (eventId, updates) => {
    const { data, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      return { error: updateError }
    }

    return { data }
  }, [])

  const deleteEvent = useCallback(async (eventId) => {
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      return { error: deleteError }
    }

    return { success: true }
  }, [])

  const toggleInterest = useCallback(
    async (eventId, userId, isCurrentlyInterested) => {
      // Optimistic update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                interested_count: e.interested_count + (isCurrentlyInterested ? -1 : 1),
              }
            : e
        )
      )

      setUserInterests((prev) => {
        const next = new Set(prev)
        if (isCurrentlyInterested) {
          next.delete(eventId)
        } else {
          next.add(eventId)
        }
        return next
      })

      try {
        if (isCurrentlyInterested) {
          const { error: delError } = await supabase
            .from('interests')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId)

          if (delError) throw delError
        } else {
          const { error: insError } = await supabase
            .from('interests')
            .insert({ event_id: eventId, user_id: userId })

          if (insError) throw insError
        }
      } catch (err) {
        console.error('Error toggling interest:', err)

        // Revert optimistic update
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  interested_count: e.interested_count + (isCurrentlyInterested ? 1 : -1),
                }
              : e
          )
        )

        setUserInterests((prev) => {
          const next = new Set(prev)
          if (isCurrentlyInterested) {
            next.add(eventId)
          } else {
            next.delete(eventId)
          }
          return next
        })
      }
    },
    []
  )

  const refreshEvents = useCallback(() => {
    if (selectedDate) {
      fetchEvents(selectedDate)
    }
  }, [selectedDate, fetchEvents])

  useEffect(() => {
    if (selectedDate) {
      fetchEvents(selectedDate)
    }
  }, [selectedDate, fetchEvents])

  return {
    events,
    loading,
    error,
    userInterests,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleInterest,
    refreshEvents,
  }
}

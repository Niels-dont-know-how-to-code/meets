import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useReports() {
  const [userReports, setUserReports] = useState(new Set())

  const fetchUserReports = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('reports')
      .select('event_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching reports:', error)
      return
    }

    setUserReports(new Set(data.map((r) => r.event_id)))
  }, [])

  const reportEvent = useCallback(async (eventId, userId, reason) => {
    const { error } = await supabase
      .from('reports')
      .insert({ event_id: eventId, user_id: userId, reason })

    if (error) {
      if (error.code === '23505') {
        // Unique violation — already reported
        return { error: { message: 'You have already reported this event' } }
      }
      return { error }
    }

    setUserReports((prev) => new Set(prev).add(eventId))
    return { data: true }
  }, [])

  return { userReports, fetchUserReports, reportEvent }
}

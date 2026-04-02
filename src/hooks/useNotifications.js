import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([])

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifications(data)
  }, [user])

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    fetchNotifications()

    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    refreshNotifications: fetchNotifications,
  }
}

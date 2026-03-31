import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // signUp and signIn return { data, error } directly — errors are handled by the caller (AuthModal)
  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = () => {
    supabase.auth.signOut()
  }

  const updateProfile = async ({ displayName: newName, avatarUrl }) => {
    const updates = {}
    if (newName !== undefined) updates.display_name = newName
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  const isAdmin = user?.app_metadata?.role === 'admin'

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'User'

  const avatarUrl = user?.user_metadata?.avatar_url || null

  return { user, loading, signUp, signIn, signOut, updateProfile, updatePassword, isAdmin, displayName, avatarUrl }
}

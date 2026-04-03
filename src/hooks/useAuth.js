import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // signUp and signIn return { data, error } directly — errors are handled by the caller (AuthModal)
  const signUp = async (email, password, displayName, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, username: username || undefined },
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

  const updateProfile = async ({ displayName: newName, avatarUrl, username: newUsername }) => {
    const updates = {}
    if (newName !== undefined) updates.display_name = newName
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl
    if (newUsername !== undefined) updates.username = newUsername
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })
    return { data, error }
  }

  const updatePassword = async (oldPassword, newPassword) => {
    // Verify old password by re-authenticating
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    })
    if (verifyErr) {
      return { data: null, error: { message: 'Current password is incorrect' } }
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { data, error }
  }

  const isAdmin = user?.app_metadata?.role === 'admin'

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'User'

  const avatarUrl = user?.user_metadata?.avatar_url || null
  const username = user?.user_metadata?.username || null

  const checkUsernameAvailable = async (desired) => {
    const { data, error } = await supabase.rpc('check_username_available', {
      desired_username: desired,
    })
    if (error) return false
    return data === true
  }

  const clearRecovery = () => setIsRecovery(false)

  return { user, loading, signUp, signIn, signOut, updateProfile, updatePassword, resetPassword, isAdmin, displayName, avatarUrl, username, checkUsernameAvailable, isRecovery, clearRecovery }
}

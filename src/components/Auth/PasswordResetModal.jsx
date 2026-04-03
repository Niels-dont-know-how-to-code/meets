import { useState } from 'react'
import { Lock, Loader2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function PasswordResetModal({ onClose, showToast }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setDone(true)
      showToast('Password updated!')
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-overlay animate-slide-up overflow-hidden">
        <div className="p-6 pt-8">
          <div className="w-16 h-16 rounded-full bg-meets-50 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-meets-500" />
          </div>

          {!done ? (
            <>
              <h2 className="font-display text-xl font-bold text-ink text-center mb-2">
                Set New Password
              </h2>
              <p className="font-body text-sm text-ink-secondary text-center mb-6">
                Choose a new password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                />
                <button
                  type="submit"
                  disabled={submitting || !newPassword || !confirmPassword}
                  className="w-full py-3 rounded-xl font-display font-bold text-sm text-white
                    bg-meets-500 hover:bg-meets-600 disabled:opacity-50 transition-colors
                    flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-500" />
              </div>
              <h2 className="font-display text-xl font-bold text-ink mb-2">
                Password Updated!
              </h2>
              <p className="font-body text-sm text-ink-secondary mb-6">
                Your password has been changed successfully.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl font-display font-bold text-sm text-white
                  bg-meets-500 hover:bg-meets-600 transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

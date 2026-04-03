import { useState, useRef } from 'react'
import { X, Camera, Loader2, User, Lock, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ProfileSettingsModal({ user, displayName, avatarUrl, username, onClose, updateProfile, updatePassword, showToast, checkUsernameAvailable, onOpenLegal }) {
  const [tab, setTab] = useState('profile')
  const [name, setName] = useState(displayName || '')
  const [usernameInput, setUsernameInput] = useState(username || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(avatarUrl)
  const fileRef = useRef(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) {
        if (uploadErr.message?.includes('Bucket not found')) {
          showToast('Avatar storage not configured yet', 'error')
        } else {
          showToast('Upload failed', 'error')
        }
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Add cache-bust param so browser shows the new image
      const freshUrl = `${publicUrl}?t=${Date.now()}`
      setPreviewUrl(freshUrl)

      const { error: updateErr } = await updateProfile({ avatarUrl: freshUrl })
      if (updateErr) throw updateErr
      showToast('Avatar updated!')
    } catch (err) {
      showToast('Something went wrong', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error')
      return
    }
    if (usernameInput.trim() && !/^[a-zA-Z0-9._]{3,20}$/.test(usernameInput.trim())) {
      showToast('Username must be 3-20 characters (letters, numbers, . _)', 'error')
      return
    }
    setSaving(true)
    try {
      // Check username availability if changed
      const trimmedUsername = usernameInput.trim()
      if (trimmedUsername && trimmedUsername !== username && checkUsernameAvailable) {
        const available = await checkUsernameAvailable(trimmedUsername)
        if (!available) {
          showToast('That username is taken', 'error')
          setSaving(false)
          return
        }
      }
      const { error } = await updateProfile({
        displayName: name.trim(),
        username: trimmedUsername || undefined,
      })
      if (error) throw error
      showToast('Profile updated!')
    } catch (err) {
      showToast('Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      showToast('Please enter your current password', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await updatePassword(currentPassword, newPassword)
      if (error) throw error
      showToast('Password changed!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-overlay animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="font-display font-bold text-lg text-ink">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-secondary rounded-xl p-1 mx-5 mt-4">
          <button
            onClick={() => setTab('profile')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
              tab === 'profile'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <User size={14} />
            Profile
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
              tab === 'password'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Lock size={14} />
            Password
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {tab === 'profile' && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-meets-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-100">
                      {name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-gray-200
                      flex items-center justify-center shadow-card hover:bg-surface-secondary transition-colors"
                  >
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin text-ink-secondary" />
                    ) : (
                      <Camera size={14} className="text-ink-secondary" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-ink-tertiary font-body">Tap to change photo</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-display font-semibold text-ink mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                  placeholder="Your name"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-display font-semibold text-ink mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary font-body text-sm">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                    maxLength={20}
                    className="w-full pl-8 pr-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                      placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                      transition-shadow"
                    placeholder="your_username"
                  />
                </div>
                <p className="text-[11px] text-ink-tertiary font-body mt-1">Others can find you by @username</p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-display font-semibold text-ink mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    text-ink-secondary cursor-not-allowed"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSaveProfile}
                disabled={saving || (name.trim() === displayName && usernameInput.trim() === (username || ''))}
                className="w-full py-3 rounded-xl font-display font-bold text-sm text-white
                  bg-meets-500 hover:bg-meets-600 disabled:opacity-50 transition-colors
                  flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-display font-semibold text-ink mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-ink mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-ink mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-3 rounded-xl font-display font-bold text-sm text-white
                  bg-meets-500 hover:bg-meets-600 disabled:opacity-50 transition-colors
                  flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Change Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* Legal links */}
          <div className="mt-4 pt-4 border-t border-surface-secondary flex items-center justify-center gap-3">
            <button
              onClick={() => onOpenLegal?.('privacy')}
              className="text-xs text-ink-tertiary font-body hover:text-ink-secondary transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-xs text-ink-tertiary">|</span>
            <button
              onClick={() => onOpenLegal?.('terms')}
              className="text-xs text-ink-tertiary font-body hover:text-ink-secondary transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

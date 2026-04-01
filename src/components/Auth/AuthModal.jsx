import { useState } from 'react'
import { X, Mail, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { signUp, signIn, signInWithProvider, resetPassword } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    setError('')
    setSignUpSuccess(false)
    setResetSent(false)
    setShowPassword(false)
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { error: resetErr } = await resetPassword(email.trim())
      if (resetErr) {
        setError(resetErr.message)
        return
      }
      setResetSent(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const switchTab = (newTab) => {
    resetForm()
    setTab(newTab)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const { data, error: signUpError } = await signUp(email, password, displayName.trim())
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      // If no session, email confirmation is required
      if (!data.session) {
        setSignUpSuccess(true)
        setConfirmedEmail(email)
      } else {
        // Auto-confirmed (unlikely with email confirmation enabled)
        onClose()
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link first')
        } else {
          setError('Invalid email or password')
        }
        return
      }
      resetForm()
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    setError('')
    setSubmitting(true)
    try {
      const { error: socialErr } = await signInWithProvider(provider)
      if (socialErr) {
        setError(socialErr.message)
      }
      // Supabase redirects the browser, so no need to close modal
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = `w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
    transition-shadow`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={() => { resetForm(); onClose(); }}
        className="absolute inset-0 bg-black/50 animate-fade-in"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-overlay animate-slide-up overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => { resetForm(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-secondary
            transition-colors text-ink-secondary z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8">
          {/* Tab buttons */}
          <div className="flex gap-1 bg-surface-secondary rounded-xl p-1 mb-6">
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                tab === 'signup'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                tab === 'login'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Sign Up Tab */}
          {tab === 'signup' && !signUpSuccess && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary
                    hover:text-ink-secondary transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-display font-bold text-sm text-white
                  bg-meets-500 hover:bg-meets-600 disabled:opacity-50 transition-colors
                  flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-ink-tertiary font-body">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Social Login */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-surface-secondary hover:bg-gray-100 transition-colors
                    font-body text-sm font-medium text-ink disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-surface-secondary hover:bg-gray-100 transition-colors
                    font-body text-sm font-medium text-ink disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <p className="text-center text-sm text-ink-secondary font-body">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-meets-500 font-medium hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Success */}
          {tab === 'signup' && signUpSuccess && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-meets-50 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-meets-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-2">
                Check your email!
              </h3>
              <p className="font-body text-sm text-ink-secondary leading-relaxed">
                We sent a confirmation link to{' '}
                <span className="font-medium text-ink">{confirmedEmail}</span>.
                Click the link to activate your account.
              </p>
              <button
                onClick={() => switchTab('login')}
                className="mt-6 px-6 py-2.5 rounded-xl font-display font-bold text-sm
                  text-meets-500 hover:bg-meets-50 transition-colors"
              >
                Go to Log In
              </button>
            </div>
          )}

          {/* Log In Tab */}
          {tab === 'login' && !resetSent && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary
                    hover:text-ink-secondary transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-display font-bold text-sm text-white
                  bg-meets-500 hover:bg-meets-600 disabled:opacity-50 transition-colors
                  flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-ink-tertiary font-body">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Social Login */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-surface-secondary hover:bg-gray-100 transition-colors
                    font-body text-sm font-medium text-ink disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-surface-secondary hover:bg-gray-100 transition-colors
                    font-body text-sm font-medium text-ink disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="flex items-center justify-between text-sm font-body">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={submitting}
                  className="text-ink-secondary hover:text-meets-500 transition-colors"
                >
                  Forgot password?
                </button>
                <p className="text-ink-secondary">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className="text-meets-500 font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Password Reset Sent */}
          {tab === 'login' && resetSent && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-meets-50 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-meets-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-2">
                Check your email!
              </h3>
              <p className="font-body text-sm text-ink-secondary leading-relaxed">
                We sent a password reset link to{' '}
                <span className="font-medium text-ink">{email}</span>.
                Click the link to set a new password.
              </p>
              <button
                onClick={() => setResetSent(false)}
                className="mt-6 px-6 py-2.5 rounded-xl font-display font-bold text-sm
                  text-meets-500 hover:bg-meets-50 transition-colors"
              >
                Back to Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

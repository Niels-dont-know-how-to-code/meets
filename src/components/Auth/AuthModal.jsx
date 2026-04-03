import { useState } from 'react'
import { X, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { signUp, signIn, resetPassword, checkUsernameAvailable } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setDisplayName('')
    setUsername('')
    setError('')
    setSignUpSuccess(false)
    setResetSent(false)
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
    if (username.trim() && !/^[a-zA-Z0-9._]{3,20}$/.test(username.trim())) {
      setError('Username must be 3-20 characters (letters, numbers, . and _)')
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

    setSubmitting(true)
    try {
      // Check username availability if provided
      if (username.trim()) {
        const available = await checkUsernameAvailable(username.trim())
        if (!available) {
          setError('That username is already taken')
          setSubmitting(false)
          return
        }
      }

      const { data, error: signUpError } = await signUp(email, password, displayName.trim(), username.trim() || undefined)
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
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Wrong email or password')
        } else {
          setError(signInError.message)
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
                  maxLength={100}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                  autoFocus
                />
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary font-body text-sm">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                    maxLength={20}
                    className="w-full pl-8 pr-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                      placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                      transition-shadow"
                  />
                </div>
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
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
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary rounded-xl font-body text-sm
                    placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-meets-500
                    transition-shadow"
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
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>

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

import { LogIn } from 'lucide-react'

export default function LoginButton({ user, onLoginClick, signOut, displayName }) {
  if (user) {
    return (
      <button
        onClick={signOut}
        className="flex items-center gap-2 floating-btn px-3 py-2 rounded-2xl border border-gray-100"
        title="Sign out"
      >
        <div className="w-7 h-7 rounded-full bg-meets-500 flex items-center justify-center text-white text-xs font-bold">
          {displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="text-sm font-display font-medium text-ink hidden md:inline">
          {displayName}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onLoginClick}
      className="floating-btn flex items-center gap-2 px-4 py-2.5 rounded-2xl
        font-display font-bold text-sm text-meets-600 hover:text-meets-700"
    >
      <LogIn size={18} />
      <span className="hidden md:inline">Login</span>
    </button>
  )
}

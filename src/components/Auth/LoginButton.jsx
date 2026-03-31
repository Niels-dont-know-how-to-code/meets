import { useState, useRef, useEffect } from 'react'
import { LogIn, Settings, LogOut } from 'lucide-react'

export default function LoginButton({ user, onLoginClick, signOut, displayName, avatarUrl, onSettingsClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 floating-btn px-3 py-2 rounded-2xl border border-gray-100"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-meets-500 flex items-center justify-center text-white text-xs font-bold">
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-display font-medium text-ink hidden md:inline">
            {displayName}
          </span>
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-float border border-gray-100 overflow-hidden animate-fade-in z-50">
            <button
              onClick={() => {
                setMenuOpen(false)
                onSettingsClick()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-ink hover:bg-surface-secondary transition-colors"
            >
              <Settings size={16} className="text-ink-secondary" />
              Settings
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => {
                setMenuOpen(false)
                signOut()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        )}
      </div>
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

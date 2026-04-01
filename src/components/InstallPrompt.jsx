import { Download, X } from 'lucide-react'

export default function InstallPrompt({ onInstall, onDismiss }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-slide-up w-[90vw] max-w-sm">
      <div className="card flex items-center gap-3 p-3 shadow-float-lg border border-meets-100">
        <div className="w-10 h-10 rounded-xl bg-meets-50 flex items-center justify-center shrink-0">
          <Download size={20} className="text-meets-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-ink">Add Meets to Home Screen</p>
          <p className="font-body text-xs text-ink-secondary">Quick access, app-like experience</p>
        </div>
        <button
          onClick={onInstall}
          className="px-3 py-1.5 rounded-xl bg-meets-500 text-white text-xs font-display font-bold
            hover:bg-meets-600 transition-colors shrink-0"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full text-ink-tertiary hover:bg-surface-secondary transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

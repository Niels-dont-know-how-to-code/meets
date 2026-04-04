import { MessageSquare } from 'lucide-react'

export default function CommunityButton({ onClick, hasUnread }) {
  return (
    <button
      onClick={onClick}
      className="floating-btn p-3 rounded-full bg-white shadow-float
        text-ink hover:shadow-float-lg transition-shadow relative"
      aria-label="Open communities"
    >
      <MessageSquare size={22} />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
      )}
    </button>
  )
}

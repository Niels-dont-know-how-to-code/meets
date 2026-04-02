import { Bell } from 'lucide-react'

export default function NotificationBell({ unreadCount, onClick }) {
  return (
    <button onClick={onClick} className="floating-btn p-3 rounded-2xl relative">
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  )
}

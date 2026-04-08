import { Check, Clock } from 'lucide-react'

export default function ChatMessage({ message, isOwn, showSender }) {
  const time = new Date(message.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const initial = (message.sender_name || '?').charAt(0).toUpperCase()
  const isPending = message._pending

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-2' : 'mt-0.5'}`}>
      <div className={`max-w-[80%] flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar column — only for other people's messages */}
        {!isOwn && (
          <div className="flex-shrink-0 w-8 pt-0.5">
            {showSender ? (
              message.sender_avatar ? (
                <img
                  src={message.sender_avatar}
                  alt={message.sender_name}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-meets-500 text-white flex items-center justify-center font-display font-bold text-xs">
                  {initial}
                </div>
              )
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Bubble */}
        <div className="min-w-0">
          {showSender && !isOwn && (
            <p className="font-display font-semibold text-[11px] text-ink-secondary mb-0.5 ml-1">
              {message.sender_name}
            </p>
          )}
          <div
            className={`px-3 py-2 ${
              isOwn
                ? 'bg-meets-50 rounded-2xl rounded-tr-sm'
                : 'bg-surface-secondary rounded-2xl rounded-tl-sm'
            } ${isPending ? 'opacity-70' : ''}`}
          >
            <p className="font-body text-sm text-ink whitespace-pre-wrap break-words">
              {message.content}
            </p>
            <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
              <span className="text-[10px] text-ink-tertiary leading-none">{time}</span>
              {isOwn && (
                isPending
                  ? <Clock size={10} className="text-ink-tertiary" />
                  : <Check size={10} className="text-meets-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react';

export default function MessageBubble({ message, isOwn, showSender }) {
  const time = new Date(message.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const initial = (message.sender_name || '?').charAt(0).toUpperCase();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar column */}
        {!isOwn && (
          <div className="flex-shrink-0 w-10">
            {showSender ? (
              message.sender_avatar ? (
                <img
                  src={message.sender_avatar}
                  alt={message.sender_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-meets-500 text-white flex items-center justify-center font-display font-bold text-sm">
                  {initial}
                </div>
              )
            ) : (
              <div className="w-10" />
            )}
          </div>
        )}

        {/* Bubble */}
        <div>
          {showSender && !isOwn && (
            <p className="font-display font-medium text-xs text-ink-secondary mb-1 ml-1">
              {message.sender_name}
            </p>
          )}
          <div
            className={`p-3 ${
              isOwn
                ? 'bg-meets-50 rounded-2xl rounded-tr-md'
                : 'bg-surface-secondary rounded-2xl rounded-tl-md'
            }`}
          >
            <p className="font-body text-sm text-ink whitespace-pre-wrap">{message.content}</p>
            <p className="text-[10px] text-ink-tertiary mt-1">{time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

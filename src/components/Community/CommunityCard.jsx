import React from 'react';
import { Users, Shield } from 'lucide-react';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 60) return `${Math.max(1, diffMin)}m`;
  if (diffHr < 24) return `${diffHr}h`;
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function CommunityCard({ community, onClick }) {
  const initial = (community.name || '?').charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-white shadow-card p-3 flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {community.image_url ? (
          <img
            src={community.image_url}
            alt={community.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-meets-500 text-white flex items-center justify-center font-display font-bold text-lg">
            {initial}
          </div>
        )}
      </div>

      {/* Center content */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-ink truncate">{community.name}</p>
        {community.last_message_preview && (
          <p className="font-body text-xs text-ink-tertiary truncate">
            {community.last_message_preview}
          </p>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <Users size={10} className="text-ink-tertiary" />
          <span className="text-[10px] text-ink-tertiary">{community.member_count}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {community.last_message_at && (
          <span className="text-[10px] text-ink-tertiary">
            {formatRelativeTime(community.last_message_at)}
          </span>
        )}
        {community.my_role === 'admin' && (
          <Shield size={14} className="text-meets-500" />
        )}
      </div>
    </div>
  );
}

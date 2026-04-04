import { Users, Plus, Search } from 'lucide-react';
import CommunityCard from './CommunityCard';

export default function CommunityList({ communities, onSelect, onCreateClick, onDiscoverClick, loading }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-surface-secondary h-[72px]" />
        ))}
      </div>
    );
  }

  if (!communities || communities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-meets-50 mb-4">
          <Users size={48} className="text-meets-500" />
        </div>
        <h3 className="font-display font-bold text-lg mb-1">No communities yet</h3>
        <p className="font-body text-sm text-ink-secondary mb-6">
          Join or create a community to start chatting
        </p>
        <div className="flex gap-3">
          <button onClick={onCreateClick} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Create Community
          </button>
          <button onClick={onDiscoverClick} className="btn-secondary flex items-center gap-2">
            <Search size={18} />
            Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="font-display font-bold text-sm text-ink-secondary uppercase tracking-wider mb-2">
        Your Communities
      </h4>
      <div className="space-y-2 overflow-y-auto">
        {communities.map((community) => (
          <CommunityCard
            key={community.id}
            community={community}
            onClick={() => onSelect(community)}
          />
        ))}
      </div>
    </div>
  );
}

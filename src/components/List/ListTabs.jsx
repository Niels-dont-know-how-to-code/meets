import { Heart, Users } from 'lucide-react';

export default function ListTabs({ activeTab = 'all', onTabChange, isAuthenticated, onLoginRequired }) {
  const handleAuthTab = (tab) => {
    if (!isAuthenticated && onLoginRequired) {
      onLoginRequired();
      return;
    }
    onTabChange(tab);
  };

  return (
    <div className="flex border-b border-surface-secondary">
      <button
        onClick={() => onTabChange('all')}
        className={`flex-1 py-2.5 text-sm font-display font-medium transition-colors border-b-2 ${
          activeTab === 'all'
            ? 'text-meets-500 border-meets-500'
            : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
        }`}
      >
        All Events
      </button>
      <button
        onClick={() => handleAuthTab('following')}
        className={`flex-1 py-2.5 text-sm font-display font-medium transition-colors border-b-2 inline-flex items-center justify-center gap-1.5 ${
          activeTab === 'following'
            ? 'text-meets-500 border-meets-500'
            : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
        }`}
      >
        <Users size={14} />
        Following
      </button>
      <button
        onClick={() => handleAuthTab('interests')}
        className={`flex-1 py-2.5 text-sm font-display font-medium transition-colors border-b-2 inline-flex items-center justify-center gap-1.5 ${
          activeTab === 'interests'
            ? 'text-meets-500 border-meets-500'
            : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
        }`}
      >
        <Heart size={14} />
        Interests
      </button>
    </div>
  );
}

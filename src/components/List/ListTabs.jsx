import { Heart } from 'lucide-react';

export default function ListTabs({ activeTab = 'all', onTabChange, isAuthenticated, onLoginRequired }) {
  const handleInterestsClick = () => {
    if (!isAuthenticated && onLoginRequired) {
      onLoginRequired();
      return;
    }
    onTabChange('interests');
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
        onClick={handleInterestsClick}
        className={`flex-1 py-2.5 text-sm font-display font-medium transition-colors border-b-2 inline-flex items-center justify-center gap-1.5 ${
          activeTab === 'interests'
            ? 'text-meets-500 border-meets-500'
            : 'text-ink-tertiary border-transparent hover:text-ink-secondary'
        }`}
      >
        <Heart size={14} />
        My Interests
      </button>
    </div>
  );
}

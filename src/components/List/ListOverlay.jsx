import { X, MapPin, RefreshCw, Calendar, Heart, Search } from 'lucide-react';
import SearchBar from './SearchBar';
import ListTabs from './ListTabs';
import EventCard from './EventCard';
import SkeletonCard from './SkeletonCard';

export default function ListOverlay({
  events,
  show,
  onClose,
  user,
  onEventClick,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  userInterests = new Set(),
  onToggleInterest,
  loading,
  onRefresh,
  onLoginRequired,
}) {
  if (!show) return null;

  let filtered = events;

  // Filter by search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
    );
  }

  // Filter by interests tab
  if (activeTab === 'interests') {
    filtered = filtered.filter((e) => userInterests.has(e.id));
  }

  // Sort by start_time ascending
  const sortedEvents = [...filtered].sort((a, b) => {
    const timeA = a.start_time || '';
    const timeB = b.start_time || '';
    return timeA.localeCompare(timeB);
  });

  // Determine which empty state to show
  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-ink-tertiary">
          <Search size={40} className="mb-3 opacity-50" />
          <p className="font-body text-sm font-medium">No matches for '{searchQuery}'</p>
          <p className="font-body text-xs mt-1 opacity-70">Try a different search term</p>
        </div>
      );
    }

    if (activeTab === 'interests') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-ink-tertiary">
          <Heart size={40} className="mb-3 opacity-50" />
          <p className="font-body text-sm font-medium">No favorites yet</p>
          <p className="font-body text-xs mt-1 opacity-70">Tap the heart on events you like</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-ink-tertiary">
        <Calendar size={40} className="mb-3 opacity-50" />
        <p className="font-body text-sm font-medium">No events for this date</p>
        <p className="font-body text-xs mt-1 opacity-70">Try another date or host your own!</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* Backdrop (mobile) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30 pointer-events-auto md:hidden animate-fade-in"
      />

      {/* Panel */}
      <div
        className="overlay-panel pointer-events-auto animate-slide-up
          absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-3xl
          md:static md:absolute md:top-0 md:right-0 md:bottom-0 md:left-auto
          md:w-96 md:max-h-full md:rounded-t-none md:rounded-l-3xl
          flex flex-col shadow-overlay bg-noise"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-xl text-ink tracking-tight">Events</h2>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-tertiary hover:text-ink-secondary"
                title="Refresh events"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-2">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-gray-100">
          <ListTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            isAuthenticated={!!user}
            onLoginRequired={onLoginRequired}
          />
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-hide">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : sortedEvents.length === 0 ? (
            renderEmptyState()
          ) : (
            sortedEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={onEventClick}
                compact
                index={index}
                isInterested={userInterests.has(event.id)}
                onToggleInterest={onToggleInterest}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

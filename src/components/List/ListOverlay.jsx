import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MapPin, RefreshCw, Calendar, Heart, Search, Plus } from 'lucide-react';
import UnifiedSearchBar from './UnifiedSearchBar';
import ListTabs from './ListTabs';
import EventCard from './EventCard';
import SkeletonCard from './SkeletonCard';
import TrendingSection from './TrendingSection';

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
  onHostEvent,
  friendsInterests,
  friends,
  onPlaceSelect,
  onFriendClick,
}) {
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef(null);
  const isPulling = useRef(false);

  // Attach non-passive touchmove for Safari preventDefault support
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        e.preventDefault();
        setPullDistance(Math.min(dy * 0.4, 80));
      } else {
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [show]);

  const handleTouchStart = useCallback((e) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 50 && onRefresh) {
      setIsRefreshing(true);
      setPullDistance(50);
      await onRefresh();
      setIsRefreshing(false);
    }
    isPulling.current = false;
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

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
          <Search size={40} className="mb-3 opacity-50" aria-hidden="true" />
          <p className="font-body text-sm font-medium">No matches for &apos;{searchQuery}&apos;</p>
          <p className="font-body text-xs mt-1 opacity-70">Try a different search term</p>
        </div>
      );
    }

    if (activeTab === 'interests') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-ink-tertiary">
          <Heart size={40} className="mb-3 opacity-50" aria-hidden="true" />
          <p className="font-body text-sm font-medium">No favorites yet</p>
          <p className="font-body text-xs mt-1 opacity-70">Tap the heart on events you like</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-bounce-in">
        <div className="w-16 h-16 rounded-full bg-meets-50 flex items-center justify-center mb-4">
          <Calendar size={28} className="text-meets-500" />
        </div>
        <h3 className="font-display font-bold text-lg text-ink mb-1">No events yet</h3>
        <p className="font-body text-sm text-ink-secondary mb-5 max-w-[240px]">
          Be the first to host something on this day!
        </p>
        {onHostEvent && (
          <button
            onClick={onHostEvent}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Host an Event
          </button>
        )}
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

        {/* Unified Search */}
        <div className="px-5 pb-2">
          <UnifiedSearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onPlaceSelect={onPlaceSelect}
            friends={friends}
            onFriendClick={onFriendClick}
            events={events}
            onEventClick={onEventClick}
          />
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

        {/* Trending */}
        {!loading && events.length > 0 && (
          <div className="px-4 pt-2">
            <TrendingSection events={events} onEventClick={onEventClick} />
          </div>
        )}

        {/* Event List */}
        <div
          ref={scrollRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-hide"
          style={{ overscrollBehavior: 'none' }}
        >
          {/* Pull-to-refresh indicator */}
          {pullDistance > 0 && (
            <div
              className="flex justify-center overflow-hidden transition-all duration-150"
              style={{ height: pullDistance, opacity: Math.min(pullDistance / 50, 1) }}
            >
              <RefreshCw
                size={20}
                className={`text-meets-500 mt-2 ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ transform: `rotate(${pullDistance * 4}deg)` }}
              />
            </div>
          )}

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
                friendsInterested={friendsInterests?.get(event.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

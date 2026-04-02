import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, X } from 'lucide-react';
import { searchAddress } from '../../lib/geocoding';

export default function UnifiedSearchBar({
  value,
  onChange,
  onPlaceSelect,
  friends = [],
  onFriendClick,
  events = [],
  onEventClick,
}) {
  const [focused, setFocused] = useState(false);
  const [places, setPlaces] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const query = value?.trim().toLowerCase() || '';

  // Debounced place search when query is 3+ chars
  useEffect(() => {
    if (query.length < 3) {
      setPlaces([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchingPlaces(true);
      const results = await searchAddress(query);
      setPlaces(results.slice(0, 3));
      setSearchingPlaces(false);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Filter friends by query
  const matchedFriends = query.length >= 2
    ? friends.filter(f =>
        f.display_name?.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  // Filter events by query (title/description)
  const matchedEvents = query.length >= 2
    ? events.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const hasResults = matchedEvents.length > 0 || matchedFriends.length > 0 || places.length > 0;
  const showDropdown = focused && query.length >= 2 && (hasResults || searchingPlaces);

  const handlePlaceClick = (place) => {
    onPlaceSelect({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      name: place.display_name,
    });
    onChange('');
    setFocused(false);
  };

  const handleEventClick = (event) => {
    onEventClick(event);
    onChange('');
    setFocused(false);
  };

  const handleFriendClick = (friend) => {
    onFriendClick?.(friend);
    onChange('');
    setFocused(false);
  };

  const handleClear = () => {
    onChange('');
    setPlaces([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!focused) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [focused]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search events, places, friends..."
          autoComplete="off"
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-surface-secondary border-none
            font-body text-sm text-ink placeholder:text-ink-tertiary
            focus:outline-none focus:ring-2 focus:ring-meets-500 transition-shadow"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-ink-tertiary hover:text-ink-secondary transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Unified dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-float overflow-hidden z-50 max-h-72 overflow-y-auto">
          {/* Event results */}
          {matchedEvents.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-display font-bold text-ink-tertiary uppercase tracking-wider bg-gray-50">
                Events
              </div>
              {matchedEvents.map((event) => (
                <button
                  key={event.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleEventClick(event)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-secondary transition-colors flex items-center gap-2"
                >
                  <Calendar size={14} className="text-meets-500 flex-shrink-0" />
                  <span className="text-sm font-body text-ink truncate">{event.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Place results */}
          {places.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-display font-bold text-ink-tertiary uppercase tracking-wider bg-gray-50">
                Places
              </div>
              {places.map((place, idx) => (
                <button
                  key={idx}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePlaceClick(place)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-secondary transition-colors flex items-center gap-2"
                >
                  <MapPin size={14} className="text-meets-500 flex-shrink-0" />
                  <span className="text-xs font-body text-ink truncate">{place.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Friend results */}
          {matchedFriends.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-display font-bold text-ink-tertiary uppercase tracking-wider bg-gray-50">
                Friends
              </div>
              {matchedFriends.map((friend) => (
                <button
                  key={friend.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleFriendClick(friend)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-secondary transition-colors flex items-center gap-2"
                >
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <Users size={14} className="text-meets-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-body text-ink truncate">{friend.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Searching indicator */}
          {searchingPlaces && places.length === 0 && matchedEvents.length === 0 && matchedFriends.length === 0 && (
            <div className="px-3 py-3 text-center">
              <span className="text-xs font-body text-ink-tertiary">Searching...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

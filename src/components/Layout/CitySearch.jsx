import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { searchAddress } from '../../lib/geocoding';

export default function CitySearch({ onCitySelect, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const data = await searchAddress(searchQuery);
    setResults(data.slice(0, 5));
    setSearching(false);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const handleResultClick = (result) => {
    onCitySelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name,
    });
    collapse();
  };

  const collapse = () => {
    setExpanded(false);
    setQuery('');
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      collapse();
    }
  };

  const handleBlur = (e) => {
    // Don't collapse if clicking within the container
    if (containerRef.current && containerRef.current.contains(e.relatedTarget)) {
      return;
    }
    // Small delay to allow click events on results
    setTimeout(() => {
      collapse();
    }, 200);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="floating-btn p-2.5 rounded-2xl"
        title="Search city"
      >
        <Search size={16} className="text-ink-secondary" />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-2xl bg-white shadow-float px-4 py-2.5 w-64">
        <Search size={16} className="text-ink-tertiary flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Search city or address..."
          className="flex-1 text-sm font-body outline-none bg-transparent text-ink placeholder:text-ink-tertiary"
        />
        <button
          onClick={collapse}
          className="p-0.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-tertiary"
        >
          <X size={14} />
        </button>
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-float overflow-hidden z-50">
          {results.map((result, idx) => (
            <button
              key={idx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleResultClick(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-surface-secondary transition-colors flex items-center gap-2 border-b border-gray-50 last:border-b-0"
            >
              <MapPin size={14} className="text-meets-500 flex-shrink-0" />
              <span className="text-xs font-body text-ink truncate">
                {result.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {searching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-float px-4 py-3 z-50">
          <p className="text-xs font-body text-ink-tertiary text-center">Searching...</p>
        </div>
      )}
    </div>
  );
}

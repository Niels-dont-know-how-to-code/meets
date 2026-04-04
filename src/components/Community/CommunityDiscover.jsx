import { useState, useCallback } from 'react'
import { Search, Users, Loader2, UserPlus, Check } from 'lucide-react'

export default function CommunityDiscover({ onSearch, onRequestJoin }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [requestedIds, setRequestedIds] = useState(new Set())

  const handleSearch = useCallback(async (term) => {
    setQuery(term)
    if (term.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const data = await onSearch(term.trim())
    setResults(data || [])
    setLoading(false)
  }, [onSearch])

  const handleRequestJoin = async (communityId) => {
    await onRequestJoin(communityId)
    setRequestedIds(prev => new Set([...prev, communityId]))
  }

  return (
    <div className="px-5 py-4">
      {/* Search input */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search communities..."
          className="w-full font-body text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5
            bg-white focus:outline-none focus:ring-2 focus:ring-meets-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-meets-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8">
          <Search size={32} className="text-ink-tertiary mx-auto mb-2 opacity-50" />
          <p className="font-body text-sm text-ink-tertiary">No communities found</p>
          <p className="font-body text-xs text-ink-tertiary mt-1">Try a different search term</p>
        </div>
      )}

      {/* Initial state */}
      {!loading && query.length < 2 && (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-meets-50 flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-meets-500" />
          </div>
          <p className="font-body text-sm text-ink-secondary">Search for communities to join</p>
          <p className="font-body text-xs text-ink-tertiary mt-1">Type at least 2 characters</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map(community => {
            const requested = requestedIds.has(community.id)
            return (
              <div
                key={community.id}
                className="rounded-xl bg-white shadow-card p-3 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-full bg-meets-500 flex items-center justify-center text-white font-display font-bold flex-shrink-0">
                  {community.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ink truncate">{community.name}</p>
                  {community.description && (
                    <p className="font-body text-xs text-ink-tertiary truncate">{community.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users size={10} className="text-ink-tertiary" />
                    <span className="text-[10px] text-ink-tertiary">{community.member_count} members</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRequestJoin(community.id)}
                  disabled={requested}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-colors ${
                    requested
                      ? 'bg-green-50 text-green-600'
                      : 'bg-meets-500 text-white hover:bg-meets-600 active:scale-95'
                  }`}
                >
                  {requested ? (
                    <>
                      <Check size={12} />
                      Requested
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} />
                      Join
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

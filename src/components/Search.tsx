'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { searchStocks } from '@/actions/market';
import { addToWatchlist } from '@/actions/watchlist';

// Simple debounce implementation inside component to avoid extra file for now if not used elsewhere
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

// Separate component for search content to use Suspense
function SearchContent({ watchlistId: propWatchlistId, onAdd }: { watchlistId?: string, onAdd?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use prop if available (Modal mode), otherwise fallback to URL (Search Page mode)
  const watchlistId = propWatchlistId || searchParams.get('watchlistId');

  // Filter State
  const [filter, setFilter] = useState<'ALL' | 'NSE' | 'BSE'>('ALL');

  // Track added symbols to show UI feedback
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchStocks(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking filter buttons (which might be outside strict ref if design changes, but here they will be inside)
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (symbol: string) => {
    // If in Add Mode, prevent navigation and add to list
    if (watchlistId) {
        if (addedSymbols.has(symbol)) return; // Already added

        setIsAdding(true);
        try {
            const result = await addToWatchlist(symbol, watchlistId);
            if (result.success) {
                // Mark as added locally for UI feedback
                setAddedSymbols(prev => new Set(prev).add(symbol));
                // Notify parent to refresh list
                if (onAdd) onAdd();
            } else {
                alert('Failed to add: ' + result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
             setIsAdding(false);
        }
        // Keep search open? Or close it?
        // Better UX: Keep current search query but maybe close dropdown if clicking?
        // Actually, if we click a result, we might want to search for *another* one.
        // So let's clear query to let user type new one, OR keep it open?
        // Let's clear query to reset interaction.
        setQuery('');
        setIsOpen(false);
    } else {
        // Normal Mode: Navigate to Quote
        setQuery('');
        setIsOpen(false);
        router.push(`/quote/${symbol}`);
    }
  };

  // Filter Logic
  const filteredResults = results.filter(r => {
      if (filter === 'ALL') return true;
      if (filter === 'NSE') return r.exchange === 'NSE' || r.exchange === 'NSI';
      if (filter === 'BSE') return r.exchange === 'BSE' || r.exchange === 'BSI' || r.exchange === 'BOC'; // BOC sometimes used for BSE
      return true; 
  });

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setSelectedIndex(-1);
  }, [results, filter]);

  useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
           const list = listRef.current;
           const item = list.children[selectedIndex] as HTMLElement;
           if (item) {
                // block: 'nearest' is standard but manual calc is safer for custom scroll containers sometimes.
                // ScrollIntoView is easier.
                item.scrollIntoView({ block: 'nearest' });
           }
      }
  }, [selectedIndex]);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
          placeholder={watchlistId ? "Search to add to list..." : "Search stocks..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
                  handleSelect(filteredResults[selectedIndex].symbol);
                } else if (filteredResults.length > 0) {
                  handleSelect(filteredResults[0].symbol);
                }
            }
          }}
          onFocus={() => {
              if (results.length > 0) setIsOpen(true);
          }}
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <SearchIcon size={16} />
        </div>
        {isLoading && (
          <div className="absolute right-3 top-2.5 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button 
             onClick={() => setQuery('')}
             className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
             <X size={16} />
          </button>
        )}
      </div>
      
      {/* Filter Buttons */}
      {watchlistId && (
          <div className="flex gap-2 mt-2 px-1">
              {(['ALL', 'NSE', 'BSE'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        filter === f 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                      {f === 'ALL' ? 'All' : f}
                  </button>
              ))}
          </div>
      )}

      {/* Adding Status */}
      {isAdding && (
          <div className="absolute top-full mt-2 w-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 z-50">
              <Loader2 className="animate-spin" size={14} /> Adding to watchlist...
          </div>
      )}

      {isOpen && filteredResults.length > 0 && !isAdding && (
        <div ref={listRef} className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50 max-h-80 overflow-y-auto">
          {filteredResults.map((result, index) => {
             const isAdded = addedSymbols.has(result.symbol);
             const isSelected = index === selectedIndex;
             return (
                <button
                key={result.symbol}
                disabled={isAdded}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group ${
                    isAdded ? 'bg-green-50 dark:bg-green-900/10 cursor-default' : 
                    isSelected ? 'bg-gray-100 dark:bg-gray-800' :
                    'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleSelect(result.symbol)}
                onMouseEnter={() => setSelectedIndex(index)} // Optional: Sync mouse hover with index
                >
                <div className="flex justify-between items-center">
                    <span className={`font-semibold transition-colors ${isAdded ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                        {result.symbol}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">{result.exchange}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[70%]">
                        {result.name}
                    </div>
                    {isAdded ? (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">Added</span>
                    ) : (
                        watchlistId && <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Add +</span>
                    )}
                </div>
                </button>
             );
          })}
        </div>
      )}
    </div>
  );
}

export default function Search({ watchlistId, onAdd }: { watchlistId?: string, onAdd?: () => void }) {
  return (
    <Suspense fallback={<div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />}>
      <SearchContent watchlistId={watchlistId} onAdd={onAdd} />
    </Suspense>
  );
}

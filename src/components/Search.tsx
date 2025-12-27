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
function SearchContent({ watchlistId: propWatchlistId, region, onAdd }: { watchlistId?: string, region?: string, onAdd?: () => void }) {
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
        setQuery('');
        setIsOpen(false);
    } else {
        // Normal Mode: Navigate to Quote
        setQuery('');
        setIsOpen(false);
        router.push(`/quote/${symbol}`);
    }
  };

  // Filter Logic based on Region
  const filteredResults = results.filter(r => {
      const isIndian = ['NSE', 'NSI', 'BSE', 'BSI', 'BOC'].includes(r.exchange);
      
      if (region === 'IN') {
          return isIndian;
      } else if (region === 'GLOBAL') {
          // Explicit Global: exclude India
          return !isIndian;
      } else if (watchlistId && !region) {
          // If viewing a watchlist but regionProp missing (legacy), no filter
          return true; 
      } else if (watchlistId && region !== 'IN') {
          // Fallback if region is something else? Treat as Global usually
           return !isIndian;
      }
      
      // Default: show everything
      return true; 
  });

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setSelectedIndex(-1);
  }, [results, region]);

  useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
           const list = listRef.current;
           const item = list.children[selectedIndex] as HTMLElement;
           if (item) {
                item.scrollIntoView({ block: 'nearest' });
           }
      }
  }, [selectedIndex]);

  return (
    <div className="relative w-full max-w-md group" ref={searchRef}>
      <div className="relative z-50">
        <input
          type="text"
          className="w-full pl-11 pr-10 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all shadow-sm group-hover:shadow-md text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
          placeholder={watchlistId ? (region === 'IN' ? "Search NSE/BSE stocks..." : "Search US stocks...") : "Search stocks..."}
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
        <div className="absolute left-3.5 top-3 text-violet-500 dark:text-violet-400">
          <SearchIcon size={18} />
        </div>
        {isLoading && (
          <div className="absolute right-3.5 top-3 text-violet-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button 
             onClick={() => setQuery('')}
             className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
             <X size={14} />
          </button>
        )}
      </div>

      {/* Adding Status */}
      {isAdding && (
          <div className="absolute top-full mt-2 w-full bg-violet-50/90 dark:bg-violet-900/30 backdrop-blur-sm border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-300 px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 z-40 animate-in slide-in-from-top-2">
              <Loader2 className="animate-spin" size={16} /> 
              <span className="font-medium">Adding to watchlist...</span>
          </div>
      )}

      {/* Results Dropdown */}
      {isOpen && filteredResults.length > 0 && !isAdding && (
        <div ref={listRef} className="absolute top-full mt-3 w-full bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 max-h-[350px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {filteredResults.map((result, index) => {
             const isAdded = addedSymbols.has(result.symbol);
             const isSelected = index === selectedIndex;
             return (
                <button
                key={result.symbol}
                disabled={isAdded}
                className={`w-full px-4 py-3 text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0 transition-all group/item ${
                    isAdded ? 'bg-green-50/50 dark:bg-green-900/10 cursor-default' : 
                    isSelected ? 'bg-violet-50/80 dark:bg-gray-800' :
                    'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleSelect(result.symbol)}
                onMouseEnter={() => setSelectedIndex(index)}
                >
                <div className="flex justify-between items-center gap-3">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-bold text-base tracking-tight ${isAdded ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {result.symbol}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                result.exchange === 'NSE' || result.exchange === 'NSI' 
                                ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30'
                                : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                            }`}>
                                {result.exchange}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                            {result.name}
                        </div>
                    </div>

                    {/* Right: Action */}
                    <div>
                        {isAdded ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800">
                                <span>Added</span>
                            </div>
                        ) : (
                            watchlistId && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    isSelected 
                                    ? 'bg-violet-600 text-white scale-110 shadow-lg shadow-violet-500/30' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover/item:bg-violet-100 group-hover/item:text-violet-600 dark:group-hover/item:bg-violet-900/30 dark:group-hover/item:text-violet-300'
                                }`}>
                                    <span className="text-lg leading-none mb-0.5">+</span>
                                </div>
                            )
                        )}
                    </div>
                </div>
                </button>
             );
          })}
        </div>
      )}
    </div>
  );
}

export default function Search({ watchlistId, region, onAdd }: { watchlistId?: string, region?: string, onAdd?: () => void }) {
  return (
    <Suspense fallback={<div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />}>
      <SearchContent watchlistId={watchlistId} region={region} onAdd={onAdd} />
    </Suspense>
  );
}

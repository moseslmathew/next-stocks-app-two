'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search as SearchIcon, Plus, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Newspaper, X, IndianRupee, DollarSign, ChevronRight, ChevronLeft, Pencil, Check, AlertTriangle } from 'lucide-react';
import SearchComponent from '@/components/Search';
import { searchStocks, getBatchStockQuotes } from '@/actions/market';
import { addToWatchlist, removeFromWatchlist, getWatchlist, reorderWatchlist, createWatchlist, deleteWatchlist, getUserWatchlists, renameWatchlist } from '@/actions/watchlist';
import { createPusherClient } from '@/lib/pusher';
import { getStockNews, getBatchStockNews, NewsItem } from '@/actions/news';
import MarketCard from '@/components/MarketCard';
import Sparkline from '@/components/Sparkline';
import { SparklineBar } from '@/components/SparklineBar';
import { ChartModal } from '@/components/ChartModal';
import { NewsModal } from '@/components/NewsModal';
import { formatCurrency } from '@/utils/currency';
import { useUser } from '@clerk/nextjs';

import { useRefreshRate } from '@/hooks/useRefreshRate';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}



interface MarketData {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  sparkline: number[];
  volumeSparkline?: number[];
  timestamps?: number[];
  regularMarketTime?: number;
  order?: number; // Optional as it might not be in older cached data immediately
  marketState?: string;
  quoteType?: string;
  exchange?: string;
}

type SortColumn = 'custom' | 'symbol' | 'price' | 'change';
type SortDirection = 'asc' | 'desc';



interface SortableRowProps {
    data: MarketData;
    onRemove: (symbol: string) => void;
    onSelect: (data: MarketData) => void;
    onOpenNews: (shortName: string, symbol: string) => void;
    trendRange: '1d' | '7d' | '52w';
    highLowRange: '1d' | '52w';
    mobileActiveColumn: 'price' | 'trend' | 'range' | 'actions';
    onToggleColumn: () => void;
    isLoadingChart?: boolean;
}

function SortableRow({ data, onRemove, onSelect, onOpenNews, highLowRange, trendRange, mobileActiveColumn, onToggleColumn, isLoadingChart }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: data.symbol });

    const [swipeX, setSwipeX] = useState(0);
    const touchStart = useRef<{ x: number, y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const deltaX = e.touches[0].clientX - touchStart.current.x;
        const deltaY = e.touches[0].clientY - touchStart.current.y;

        // Disambiguate: only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
             // Only swipe right (deltaX > 0)
             if (deltaX > 0) {
                 // Resistance / Damping can be added, but linear is fine for now
                 setSwipeX(deltaX);
             }
        }
    };

    const handleTouchEnd = () => {
        if (swipeX > 150) { // Threshold for delete
             // Animate off screen
             setSwipeX(window.innerWidth); 
             // Call remove after animation
             setTimeout(() => {
                 onRemove(data.symbol);
                 // Reset after removal (though component might unmount)
                 setSwipeX(0);
             }, 300);
        } else {
             // Snap back
             setSwipeX(0);
        }
        touchStart.current = null;
    };

    const dndTransform = CSS.Transform.toString(transform);
    
    const style = {
        // Combine transforms: Dnd first (though usually null when not dragging), then Swipe
        transform: dndTransform ? dndTransform : (swipeX !== 0 ? `translateX(${swipeX}px)` : undefined),
        transition: isDragging ? undefined : (swipeX === 0 ? 'transform 0.3s ease-out' : 'transform 0.1s linear'), // Smooth snap back, linear drag
        opacity: isDragging ? 0.5 : (swipeX > 0 ? Math.max(0.2, 1 - swipeX / 300) : 1), // Fade out on swipe
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
        touchAction: 'pan-y', // Critical for handling horizontal swipe while allowing vertical scroll
    };

    const high = highLowRange === '1d' ? data.regularMarketDayHigh : data.fiftyTwoWeekHigh;
    const low = highLowRange === '1d' ? data.regularMarketDayLow : data.fiftyTwoWeekLow;

    const range = high - low;
    const position = range > 0 
      ? ((data.regularMarketPrice - low) / range) * 100 
      : 0;
    const clampedPosition = Math.min(Math.max(position, 0), 100);

    const isDailyPositive = data.regularMarketChange >= 0;
    const sparklineColor = trendRange === '1d' 
        ? (isDailyPositive ? '#16a34a' : '#dc2626') 
        : undefined; 

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors bg-white dark:bg-black relative overflow-visible" // Added overflow-visible so the negative left div shows
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <td className="px-2 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 align-middle w-[35%] sm:w-[40%] bg-white dark:bg-black relative z-10 overflow-visible">
                {/* Background for Swipe Action */}
                {swipeX > 10 && (
                    <div 
                        className="absolute inset-y-0 bg-red-500 flex items-center justify-end pr-4 text-white font-bold z-0 pointer-events-none"
                        style={{ 
                            width: `${swipeX}px`, 
                            left: `-${swipeX}px`,
                            transition: 'none' 
                        }}
                    >
                        <Trash2 size={24} />
                    </div>
                )}
                
                <div className="flex items-center gap-2 relative z-10">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none flex-shrink-0">
                        <GripVertical size={16} />
                    </button>
                    <div className="min-w-0 w-full pl-2">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white break-words leading-tight capitalize" title={data.symbol}>
                            {(data.shortName || data.symbol.replace(/\.NS$|\.BO$/, '')).toLowerCase()}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-1 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 align-middle w-[30%] sm:w-[25%] bg-white dark:bg-black relative z-10">
                <div className="flex flex-col items-center sm:items-start">
                    <div className="font-mono text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 text-center sm:text-left">
                        {formatCurrency(data.regularMarketPrice, data.currency)}
                    </div>
                    <div className={`text-[10px] sm:text-xs font-medium mt-0.5 text-center sm:text-left ${data.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.regularMarketChange >= 0 ? '+' : ''}{data.regularMarketChange.toFixed(2)} ({data.regularMarketChangePercent.toFixed(2)}%)
                    </div>
                </div>
            </td>
            <td className="px-2 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 align-middle w-[35%] sm:w-[20%] bg-white dark:bg-black relative z-10" onClick={(e) => {
                 onSelect(data);
            }}>
                <div className="cursor-pointer hover:opacity-80 transition-opacity flex justify-end sm:justify-start">
                    {isLoadingChart ? (
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-[35px] w-[90px] rounded" />
                    ) : (
                        <Sparkline 
                           data={data.sparkline} 
                        previousClose={trendRange === '1d' ? data.regularMarketPrice - data.regularMarketChange : undefined}
                        width={65} 
                        height={35} 
                        color={sparklineColor} 
                        timestamps={data.timestamps}
                        isIndian={data.symbol.endsWith('.NS') || data.symbol.endsWith('.BO') || data.symbol === '^NSEI' || data.symbol === '^BSESN'}
                        marketState={data.marketState}
                    />
                    )}
                </div>
            </td>

            <td className="hidden sm:table-cell px-6 sm:px-6 py-4 text-center sm:text-right border-b border-gray-100 dark:border-gray-800 align-middle sm:w-[15%] bg-white dark:bg-black relative z-10">
                <div className="flex items-center justify-center sm:justify-end gap-2">
                    <button 
                         onClick={() => onOpenNews(data.shortName, data.symbol)}
                         className="p-2 text-[#2070b4] hover:bg-[#2070b4]/10 rounded-lg transition-colors"
                         title="View News"
                     >
                         <Newspaper size={18} />
                     </button>
                    <button 
                        onClick={() => onRemove(data.symbol)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from Watchlist"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ... (imports remain)
interface WatchlistProps {
  filterRegion?: 'ALL' | 'IN' | 'GLOBAL';
  hideSectionTitles?: boolean;
}

export default function Watchlist({ filterRegion = 'ALL', hideSectionTitles = false }: WatchlistProps) {
// ...
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlistData, setWatchlistData] = useState<MarketData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const isIndianStock = (symbol: string) => 
      symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol === '^NSEI' || symbol === '^BSESN';

  const getFilteredBriefingData = () => {
      if (filterRegion === 'IN') {
          return watchlistData.filter(s => isIndianStock(s.symbol));
      } else if (filterRegion === 'GLOBAL') {
          return watchlistData.filter(s => !isIndianStock(s.symbol));
      }
      return watchlistData;
  };

  // Multiple Watchlists State
  const [watchlists, setWatchlists] = useState<{id: string, name: string, region: string}[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  
  const activeWatchlistRegion = useMemo(() => {
      if (!activeWatchlistId) return filterRegion === 'ALL' ? 'IN' : filterRegion; 
      return watchlists.find(w => w.id === activeWatchlistId)?.region || 'GLOBAL';
  }, [watchlists, activeWatchlistId, filterRegion]);

  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const  startEditing = (id: string, currentName: string) => {
      setEditingListId(id);
      setEditName(currentName);
  };

  const handleRename = async (id: string) => {
      if (!editName.trim()) return;
      
      const result = await renameWatchlist(id, editName);
      if (result.success) {
          setWatchlists(prev => prev.map(l => l.id === id ? { ...l, name: editName } : l));
          setEditingListId(null);
      } else {
          alert('Failed to rename');
      }
  };

  
  const [sortColumn, setSortColumn] = useState<SortColumn>('custom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [trendRange, setTrendRange] = useState<'1d' | '7d' | '52w'>('1d');
  const [highLowRange, setHighLowRange] = useState<'1d' | '52w'>('1d');
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  
  const selectedStock = useMemo(() => {
      if (!selectedStockId) return null;
      return watchlistData.find(s => s.symbol === selectedStockId) || null;
  }, [watchlistData, selectedStockId]);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<'price' | 'trend' | 'range' | 'actions'>('price');

  const cycleMobileColumn = () => {
    const columns: ('price' | 'trend' | 'range' | 'actions')[] = ['price', 'trend', 'range', 'actions'];
    const currentIndex = columns.indexOf(mobileActiveColumn);
    const nextIndex = (currentIndex + 1) % columns.length;
    setMobileActiveColumn(columns[nextIndex]);
  };
  const [newsActiveStock, setNewsActiveStock] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [watchlistBriefing, setWatchlistBriefing] = useState<Record<string, NewsItem[]>>({});
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isSwitchingRange, setIsSwitchingRange] = useState(false);
  const { refreshRate } = useRefreshRate();
  const tableRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTable = (title: string, direction: 'left' | 'right') => {
      const el = tableRefs.current[title];
      if (!el) return;
      const scrollAmount = window.innerWidth * 0.55; // Scroll by one data column width
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };


  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // Requires 8px movement before drag starts (good for mouse)
        }
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250, // Press and hold for 250ms to drag on touch
            tolerance: 5, // Allow 5px movement during delay
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleOpenNews(name: string, symbol?: string) {
    setNewsActiveStock(name);
    setNewsLoading(true);
    setNewsItems([]); // Clear previous
    try {
        const news = await getStockNews(name, symbol);
        setNewsItems(news);
    } catch (error) {
        console.error('Failed to load news', error);
    } finally {
        setNewsLoading(false);
    }
  }

  async function handleManualNewsSearch(query: string) {
    setNewsLoading(true);
    setNewsItems([]); 
    try {
      const news = await getStockNews(query);
      setNewsItems(news);
    } catch (error) {
      console.error('Failed to load news', error);
    } finally {
      setNewsLoading(false);
    }
  }

  // Fetch watchlist from DB on mount
  // Fetch watchlist from DB on mount
  // Fetch watchlists on mount
  // Fetch watchlists on mount and when region changes
  useEffect(() => {
    const loadLists = async () => {
        // Map 'ALL' to undefined for the action if needed, or pass 'ALL' if backend handles it (it does)
        let lists = await getUserWatchlists(filterRegion);
        
        // If no lists exist, create a default one explicitly to avoid empty state
        if (lists.length === 0 && user) {
             const regionInit = filterRegion === 'ALL' ? 'IN' : filterRegion;
             const result = await createWatchlist('My Portfolio', regionInit);
             if (result.success && result.watchlist) {
                 lists = [result.watchlist];
             }
        }

        setWatchlists(lists);
        // If current active list is NOT in the new set of lists, switch to first one
        if (lists.length > 0) {
            const currentStillExists = lists.some((l: { id: string }) => l.id === activeWatchlistId);
            if (!currentStillExists || !activeWatchlistId) {
                setActiveWatchlistId(lists[0].id);
            }
        } else {
             setActiveWatchlistId(null);
        }
    };
    if (user) loadLists();
  }, [user, filterRegion]);

  const handleCreateList = async () => {
      if (!newListName.trim()) return;
      // If region is ALL, default to IN for new lists?
      // Or maybe restrict creation when in ALL mode? 
      // For now default to IN if ALL.
      const regionToCreate = filterRegion === 'ALL' ? 'IN' : filterRegion;
      const result = await createWatchlist(newListName, regionToCreate);
      if (result.success && result.watchlist) {
          setWatchlists(prev => [...prev, result.watchlist]);
          setActiveWatchlistId(result.watchlist.id);
          setNewListName('');
          setIsCreatingList(false);
      } else {
          alert('Failed to create list: ' + result.error);
      }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, listId: string | null, listName: string }>({ isOpen: false, listId: null, listName: '' });

  const handleDeleteList = (id: string, name: string) => {
      setDeleteConfirmation({ isOpen: true, listId: id, listName: name });
  };

  const confirmDeleteList = async () => {
      if (!deleteConfirmation.listId) return;
      
      const result = await deleteWatchlist(deleteConfirmation.listId);
      if (result.success) {
          const remaining = watchlists.filter(w => w.id !== deleteConfirmation.listId);
          setWatchlists(remaining);
          if (activeWatchlistId === deleteConfirmation.listId) {
              setActiveWatchlistId(remaining[0]?.id || null);
          }
      }
      setDeleteConfirmation({ isOpen: false, listId: null, listName: '' });
  };

  // Fetch watchlist items
  const fetchWatchlist = async (includeHistory = true) => {
    if (!activeWatchlistId) return;

    // Only show loading on initial fetch
    if (watchlistData.length === 0 && includeHistory) setIsLoadingData(true);
    try {
      const data = await getWatchlist(activeWatchlistId, trendRange, includeHistory);
      
      if (includeHistory) {
          // Full replace
          setWatchlistData(data);
      } else {
          // Merge updates (Price only) with existing charts
          setWatchlistData(prev => {
              return prev.map(existingItem => {
                  const newItem = data.find(d => d.symbol === existingItem.symbol);
                  if (!newItem) return existingItem;
                  return {
                      ...existingItem,
                      ...newItem, 
                      sparkline: existingItem.sparkline,
                      volumeSparkline: existingItem.volumeSparkline,
                      timestamps: existingItem.timestamps
                  };
              });
          });
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      if (includeHistory) setIsLoadingData(false);
    }
  };

  const prevActiveWatchlistId = useRef<string | null>(null);
  const prevTrendRange = useRef(trendRange);

  // Effect to fetch items when Active List or Range changes
  useEffect(() => {
    if (activeWatchlistId) {
        let isListSwitch = false;

        // If switching lists, clear old data to avoid showing wrong list
        if (activeWatchlistId !== prevActiveWatchlistId.current) {
            setWatchlistData([]); 
            setIsLoadingData(true);
            prevActiveWatchlistId.current = activeWatchlistId;
            prevTrendRange.current = trendRange;
            isListSwitch = true;
        }

        // If switching range
        if (trendRange !== prevTrendRange.current) {
             setIsSwitchingRange(true); // Partial load
             prevTrendRange.current = trendRange;
        }

        // Fetch new data
        fetchWatchlist(true).finally(() => {
             setIsSwitchingRange(false);
        });
    }
  }, [activeWatchlistId, trendRange]);

  // Fetch Briefing News when watchlist changes
  useEffect(() => {
    const fetchBriefing = async () => {
        if (watchlistData.length === 0) return;
        
        // Avoid refetching if we already have news for these symbols? 
        // For simplicity, just fetch if list ID changes or initial load.
        // We can check if we have data for current symbols.
        const symbolsNeeded = watchlistData.map(i => i.symbol);
        const hasAllData = symbolsNeeded.every(s => watchlistBriefing[s]);
        
        if (hasAllData && !isLoadingData) return;

        setIsBriefingLoading(true);
        try {
            const itemsToFetch = watchlistData.map(i => ({ name: i.shortName, symbol: i.symbol }));
            const newsMap = await getBatchStockNews(itemsToFetch);
            setWatchlistBriefing(prev => ({ ...prev, ...newsMap }));
        } catch (error) {
            console.error('Failed to fetch briefing:', error);
        } finally {
            setIsBriefingLoading(false);
        }
    };

    // Debounce slightly to wait for full list load
    const timeout = setTimeout(fetchBriefing, 2000);
    return () => clearTimeout(timeout);
  }, [watchlistData.map(w=>w.symbol).join(','), activeWatchlistId]);

  // Ref to track latest data without triggering re-renders in the loop
  const watchlistRef = useRef(watchlistData);
  useEffect(() => {
     watchlistRef.current = watchlistData;
  }, [watchlistData]);

  // Pusher Subscription & Keep-Alive Stream
  useEffect(() => {
    // 1. Subscribe to Pusher
    const pusher = createPusherClient();
    const channel = pusher.subscribe('market-data');

    channel.bind('update', (updates: MarketData[]) => {
        // Merge logic
        setWatchlistData(prev => {
            return prev.map(existingItem => {
                const update = updates.find(u => u.symbol === existingItem.symbol);
                if (!update) return existingItem;
                return { 
                    ...existingItem, 
                    ...update,
                    // Append new data point if valid and newer
                    sparkline: (update.regularMarketTime && update.regularMarketTime > ((existingItem.timestamps && existingItem.timestamps.length > 0) ? existingItem.timestamps[existingItem.timestamps.length - 1] : 0))
                        ? [...existingItem.sparkline, update.regularMarketPrice]
                        : existingItem.sparkline,
                    volumeSparkline: (update.regularMarketTime && update.regularMarketTime > ((existingItem.timestamps && existingItem.timestamps.length > 0) ? existingItem.timestamps[existingItem.timestamps.length - 1] : 0))
                        ? [...(existingItem.volumeSparkline || []), 0] 
                        : existingItem.volumeSparkline,
                    timestamps: (update.regularMarketTime && update.regularMarketTime > ((existingItem.timestamps && existingItem.timestamps.length > 0) ? existingItem.timestamps[existingItem.timestamps.length - 1] : 0))
                        ? [...(existingItem.timestamps || []), update.regularMarketTime]
                        : existingItem.timestamps
                };
            });
        });
    });

    return () => {
        pusher.unsubscribe('market-data');
        pusher.disconnect();
    };
  }, []);

  // 2. Keep the Server Stream Alive
  useEffect(() => {
    if (refreshRate === 0 || !activeWatchlistId) return;

    let isMounted = true;
    let isFetching = false;

    const startStream = async () => {
        if (isFetching || !isMounted) return;
        
        // Get symbols from REF to avoid stale closure, but only stream if we have data
        const currentData = watchlistRef.current;
        if (currentData.length === 0) {
            // If no data, wait a bit and try again (maybe initial load)
            setTimeout(startStream, 1000);
            return;
        }

        const symbols = currentData.map(d => d.symbol);
        isFetching = true;

        try {
             // Call the API that runs for ~9 seconds
             await fetch('/api/stream-prices', {
                 method: 'POST',
                 body: JSON.stringify({ symbols }),
             });
        } catch (e) {
            console.error('Stream trigger error:', e);
            await new Promise(r => setTimeout(r, 2000));
        } finally {
            isFetching = false;
            // Immediately trigger next batch if mounted
            if (isMounted && refreshRate !== 0) {
                startStream();
            }
        }
    };

    startStream();
    
    return () => {
        isMounted = false;
    };
  }, [activeWatchlistId, refreshRate]); // Restart stream loop if List changes or we Pause/Resume 

  // Search logic
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchStocks(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleAddToWatchlist = async (symbol: string) => {
    setQuery('');
    setSearchResults([]);
    
    try {
        // Pass undefined if null so server logic kicks in to find/create default
        const result = await addToWatchlist(symbol, activeWatchlistId || undefined);
        
        if (result.success) {
            // If a new list was auto-created, update state
            if (result.createdWatchlist) {
                const newList = result.createdWatchlist;
                setWatchlists(prev => [...prev, newList]);
            }
            
            // If we didn't have an active list (or it changed), set it now
            // This will trigger the useEffect to fetch data
            if (result.watchlistId && activeWatchlistId !== result.watchlistId) {
                setActiveWatchlistId(result.watchlistId);
            } else {
                // Otherwise just refresh current list
                fetchWatchlist();
            }
        } else {
            alert('Failed to add to watchlist: ' + result.error);
        }
    } catch (error) {
        console.error('Network error adding to watchlist:', error);
        alert('Failed to connect to the server. Please check your network connection or try again later.');
    }
  };

  const [removedItem, setRemovedItem] = useState<{data: MarketData, index: number} | null>(null);

  // Auto-dismiss undo toast
  useEffect(() => {
    if (removedItem) {
        const timer = setTimeout(() => setRemovedItem(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [removedItem]);

  const handleRemoveFromWatchlist = async (symbol: string) => {
    if (!activeWatchlistId) return;

    const itemIndex = watchlistData.findIndex(i => i.symbol === symbol);
    const item = watchlistData[itemIndex];
    if (item) {
        setRemovedItem({ data: item, index: itemIndex });
    }

    setWatchlistData(prev => prev.filter(item => item.symbol !== symbol));
    
    try {
        const result = await removeFromWatchlist(symbol, activeWatchlistId);
        if (!result.success) {
            console.error('Failed to remove from watchlist:', result.error);
             // Optionally fetchWatchlist() here if we want to be strict, but for swipe UX ignoring is smoother unless critical.
        }
    } catch (e) {
        console.error('Network error during remove:', e);
    }
  };

  const handleUndo = async () => {
    if (!removedItem || !activeWatchlistId) return;
    
    const { data, index } = removedItem;
    const idToRestore = activeWatchlistId; // Capture current ID
    
    // Optimistic Restore
    setWatchlistData(prev => {
        const newArr = [...prev];
        if (index >= 0 && index <= newArr.length) {
            newArr.splice(index, 0, data);
        } else {
            newArr.push(data);
        }
        return newArr;
    });
    
    setRemovedItem(null); 

    // Backend Restore
    try {
        await addToWatchlist(data.symbol, idToRestore);
        // Note: Backend append order might differ until refresh, but UI looks correct immediately.
    } catch (error) {
        console.error('Undo failed', error);
        fetchWatchlist();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
        // Find indices in the CURRENT valid data list
        // Note: sorting is based on 'custom' usually for drag and drop
        const sourceList = sortColumn === 'custom' ? watchlistData : sortedData;
        
        // Prevent sorting between sections
        if (isIndianStock(active.id as string) !== isIndianStock(over?.id as string)) {
             return;
        }

        const oldIndex = sourceList.findIndex((item) => item.symbol === active.id);
        const newIndex = sourceList.findIndex((item) => item.symbol === over?.id);

        if (oldIndex === -1 || newIndex === -1) return;
        
        const newItems = arrayMove(sourceList, oldIndex, newIndex);

        // Optimistic Update
        setWatchlistData(newItems);
        
        // If we were sorting by something else, switch to custom so the user sees their drop result
        if (sortColumn !== 'custom') {
            setSortColumn('custom');
        }
        
        // Sync to backend
        const orderUpdate = newItems.map((item, index) => ({
            symbol: item.symbol,
            order: index
        }));
        
        // Wrap in setTimeout to ensure it doesn't conflict with render cycle (paranoia, but safe)
        setTimeout(() => {
             if (activeWatchlistId) {
                reorderWatchlist(activeWatchlistId, orderUpdate);
             }
        }, 0);
    }
  };

  const handleSort = (column: SortColumn) => {
      if (sortColumn === column) {
          // Toggle direction
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortColumn(column);
          setSortDirection('asc'); // Default to asc for new column
      }
  };

  const sortedData = useMemo(() => {
    if (sortColumn === 'custom') return watchlistData;

    return [...watchlistData].sort((a, b) => {
        let valA, valB;
        switch (sortColumn) {
            case 'symbol':
                valA = a.symbol;
                valB = b.symbol;
                break;
            case 'price':
                valA = a.regularMarketPrice;
                valB = b.regularMarketPrice;
                break;
            case 'change':
                valA = a.regularMarketChangePercent;
                valB = b.regularMarketChangePercent;
                break;
            default:
                return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }, [watchlistData, sortColumn, sortDirection]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-2 mb-4">
            


            {/* Header / Toolbar */}
            <div className="flex items-center justify-between gap-4 w-full overflow-hidden mt-8">
                
                {/* Scrollable List Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1 mask-linear-fade">
                    {watchlists.map(list => {
                        if (editingListId === list.id) {
                            return (
                                <form 
                                    key={list.id}
                                    onSubmit={(e) => { e.preventDefault(); handleRename(list.id); }}
                                    className="flex items-center gap-1 bg-white dark:bg-black px-2 py-1 rounded-full shrink-0 border border-violet-600"
                                >
                                    <input 
                                        type="text" 
                                        autoFocus
                                        className="bg-transparent border-none text-xs outline-none w-20 text-gray-900 dark:text-white font-medium"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => { /* Optional: save on blur or cancel? Let's just keep buttons */ }}
                                    />
                                    <button type="submit" className="text-green-600 p-0.5 hover:bg-green-50 rounded">
                                        <Check size={12} />
                                    </button>
                                     <button type="button" onClick={() => setEditingListId(null)} className="text-red-500 p-0.5 hover:bg-red-50 rounded">
                                        <X size={12} />
                                    </button>
                                </form>
                            );
                        }

                        const isActive = activeWatchlistId === list.id;
                        
                        return (
                        <div key={list.id} className="relative group shrink-0 flex items-center">
                             <button
                                onClick={() => setActiveWatchlistId(list.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                                    isActive 
                                    ? 'bg-transparent border-violet-600 text-violet-600 dark:text-violet-400' 
                                    : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <span>{list.name}</span>
                                
                                {isActive && (
                                    <div className="flex items-center gap-1 ml-1 pl-2 border-l border-violet-200 dark:border-violet-800">
                                         <span 
                                            role="button"
                                            onClick={(e) => { e.stopPropagation(); startEditing(list.id, list.name); }}
                                            className="text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded p-0.5 transition-colors"
                                            title="Rename"
                                         >
                                             <Pencil size={10} />
                                         </span>
                                         {watchlists.length > 1 && (
                                             <span 
                                                role="button"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id, list.name); }}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-0.5 transition-colors"
                                                title="Delete"
                                             >
                                                 <Trash2 size={10} />
                                             </span>
                                         )}
                                    </div>
                                )}
                            </button>
                        </div>
                    )})}
                    
                    {/* New List Trigger */}
                     {isCreatingList ? (
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleCreateList(); }}
                            className="flex items-center gap-1 bg-white dark:bg-black px-2 py-1 rounded-full shrink-0 border border-violet-600 animate-in fade-in slide-in-from-left-2"
                        >
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Name"
                                className="bg-transparent border-none text-xs outline-none w-16 text-gray-900 dark:text-white placeholder:text-gray-400"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                            />
                             <button type="submit" disabled={!newListName.trim()} className="text-green-600 hover:text-green-700 p-0.5 disabled:opacity-50">
                                <Plus size={12}/>
                             </button>
                             <button type="button" onClick={() => setIsCreatingList(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                                <X size={12} />
                             </button>
                        </form>
                    ) : (
                        <button 
                            onClick={() => setIsCreatingList(true)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-full transition-colors shrink-0"
                            title="Create New List"
                        >
                            <Plus size={16} /> 
                        </button>
                    )}
                </div>

            </div>

            {/* Row 2: Add Symbol Action */}
            <div className="flex justify-end px-1">
                 <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all hover:scale-105 active:scale-95"
                    title="Add Symbol"
                 >
                    <Plus size={18} />
                 </button>
            </div>
        </div>

        {isLoadingData && watchlistData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading watchlist...</p>
            </div>
        ) : watchlistData.length === 0 ? (
           // Empty state
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="inline-block bg-violet-100 dark:bg-violet-900/20 p-4 rounded-full mb-4 hover:bg-violet-200 dark:hover:bg-violet-900/40 transition-colors cursor-pointer group"
            >
                <Plus className="w-8 h-8 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
            </button>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your watchlist is empty</h3>
            <p className="text-gray-500">Search for stocks above to start tracking them.</p>
          </div>
        ) : (
          <div className="w-full sm:rounded-xl sm:border sm:border-gray-200 sm:dark:border-gray-800">
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {(() => {
                    const indianStocks = sortedData.filter(d => isIndianStock(d.symbol));
                    const globalStocks = sortedData.filter(d => !isIndianStock(d.symbol));

                    const renderSection = (title: string, stocks: MarketData[]) => {
                        if (stocks.length === 0) return null;
                        return (
                            <div className="mb-8">
                                {!hideSectionTitles && (
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        {title === 'Indian Markets' ? (
                                            <>
                                                <IndianRupee size={24} />
                                                {title}
                                                <span className={`text-xs ml-2 px-2 py-0.5 rounded-full border ${
                                                    (() => {
                                                        const now = new Date();
                                                        const istTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
                                                        const [h, m] = istTime.split(':').map(Number);
                                                        const val = h * 100 + m;
                                                        const isOpen = val >= 915 && val < 1530;
                                                        return isOpen 
                                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                                            : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
                                                    })()
                                                }`}>
                                                    {(() => {
                                                        const now = new Date();
                                                        const istTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
                                                        const [h, m] = istTime.split(':').map(Number);
                                                        const val = h * 100 + m;
                                                        return val >= 915 && val < 1530 ? 'Market Open' : 'Market Closed';
                                                    })()}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mt-1">
                                                    <DollarSign size={24} />
                                                </div>
                                                {title}
                                                 <span className={`text-xs ml-2 px-2 py-0.5 rounded-full border ${
                                                    (() => {
                                                        const now = new Date();
                                                        const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
                                                        const [h, m] = estTime.split(':').map(Number);
                                                        const val = h * 100 + m;
                                                        const isOpen = val >= 930 && val < 1600;
                                                        return isOpen 
                                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                                            : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
                                                    })()
                                                }`}>
                                                     {(() => {
                                                        const now = new Date();
                                                        const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
                                                        const [h, m] = estTime.split(':').map(Number);
                                                        const val = h * 100 + m;
                                                        return val >= 930 && val < 1600 ? 'Market Open' : 'Market Closed';
                                                    })()}
                                                </span>
                                            </>
                                        )}
                                    </h2>
                                )}
                                    <div className="relative group">
                                         {/* Removed mobile scroll buttons as we now fit 3 columns */}

                                        <div 
                                            ref={(el) => { tableRefs.current[title] = el; }}
                                            className="w-full sm:rounded-xl sm:border sm:border-gray-200 sm:dark:border-gray-800 bg-white dark:bg-black overflow-hidden"
                                        >
                                    <table className="w-full text-left text-sm sm:text-base table-fixed">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs sm:text-sm">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white w-[35%] sm:w-[40%]" onClick={() => handleSort('symbol')}>
                                                    <div className="flex items-center gap-1 pl-2">
                                                        Company
                                                        {sortColumn === 'symbol' && (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                                    </div>
                                                </th>
                                                <th className="px-1 sm:px-6 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white w-[30%] sm:w-[25%] text-center sm:text-left" onClick={() => handleSort('price')}>
                                                     <div className="flex items-center justify-center sm:justify-start gap-1">
                                                        Price
                                                        {sortColumn === 'price' && (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                                    </div>
                                                </th>
                                                <th className="px-2 sm:px-6 py-3 font-medium text-gray-500 dark:text-gray-400 w-[35%] sm:w-[20%] text-right sm:text-left align-middle">
                                                     <div className="flex flex-row items-center justify-end sm:justify-start">
                                                         {/* Micro-range selector */}
                                                         <div className="flex bg-gray-100 dark:bg-gray-800/50 rounded-lg p-0.5 text-xs sm:text-sm origin-right sm:origin-left">
                                                             <button
                                                                 onClick={() => setTrendRange('1d')}
                                                                 className={`px-2 py-1 rounded-md transition-all ${trendRange === '1d' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                             >
                                                                 1D
                                                             </button>
                                                             <button
                                                                 onClick={() => setTrendRange('52w')}
                                                                 className={`px-2 py-1 rounded-md transition-all ${trendRange === '52w' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                             >
                                                                 52W
                                                             </button>
                                                        </div>
                                                     </div>
                                                </th>

                                                <th className="hidden sm:table-cell px-6 sm:px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-center sm:text-right sm:w-[15%]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-black">
                                            <SortableContext 
                                                items={stocks.map(d => d.symbol)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {stocks.map((data) => (
                                                    <SortableRow 
                                                        key={data.symbol} 
                                                        data={data} 
                                                        onRemove={handleRemoveFromWatchlist}
                                                        onSelect={(s) => setSelectedStockId(s.symbol)} 
                                                        onOpenNews={handleOpenNews}
                                                        highLowRange={highLowRange}
                                                        trendRange={trendRange}
                                                        mobileActiveColumn={mobileActiveColumn}
                                                        onToggleColumn={cycleMobileColumn}
                                                        isLoadingChart={isSwitchingRange}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </tbody>
                                    </table>
                                </div>
                                    </div> {/* Close relative wrapper */}
                            </div>
                        );
                    };

                    return (
                        <>
                            {(filterRegion === 'ALL' || filterRegion === 'IN') && renderSection('Indian Markets', indianStocks)}
                            {(filterRegion === 'ALL' || filterRegion === 'GLOBAL') && renderSection('Global Markets', globalStocks)}
                        </>
                    );
                })()}
            </DndContext>
          </div>
        )}

        {/* Watchlist Briefing Section */}
        {watchlistData.length > 0 && (
            <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
                <div className="flex items-center gap-2 mb-6">
                    <Newspaper className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Watchlist Briefing</h2>
                </div>
                
                {isBriefingLoading && Object.keys(watchlistBriefing).length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3].map(i => (
                            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-48 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {watchlistData
                            .filter(stock => {
                                if (filterRegion === 'IN') return isIndianStock(stock.symbol);
                                if (filterRegion === 'GLOBAL') return !isIndianStock(stock.symbol);
                                return true;
                            })
                            .map(stock => {
                            const news = watchlistBriefing[stock.symbol];
                            if (!news || news.length === 0) return null;

                            return (
                                <div key={stock.symbol} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                        {stock.symbol}
                                        <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                                            {stock.shortName}
                                        </span>
                                    </h3>
                                    <div className="space-y-4">
                                        {news.map((item, idx) => (
                                            <a 
                                                key={idx}
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block group"
                                            >
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug mb-1">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                    <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{item.source}</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        <ChartModal 
            isOpen={!!selectedStock}
            onClose={() => setSelectedStockId(null)}
            symbol={selectedStock?.symbol || ''}
            priceData={selectedStock?.sparkline || []}
            volumeData={selectedStock?.volumeSparkline || []}
            timestamps={selectedStock?.timestamps || []}
            range={trendRange === '7d' ? '1w' : trendRange === '52w' ? '1y' : trendRange}
            hideActiveVolume={selectedStock ? !isIndianStock(selectedStock.symbol) : false}
            currentPrice={selectedStock?.regularMarketPrice}
            change={selectedStock?.regularMarketChange}
            changePercent={selectedStock?.regularMarketChangePercent}
        />

        <NewsModal 
            isOpen={!!newsActiveStock}
            onClose={() => setNewsActiveStock(null)}
            symbol={newsActiveStock || ''}
            newsItems={newsItems}
            loading={newsLoading}
            onSearch={handleManualNewsSearch}
        />

        {/* Search Modal */}
        {isSearchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
                <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                    <SearchComponent 
                        watchlistId={activeWatchlistId ?? undefined} 
                        region={activeWatchlistRegion}
                        onAdd={() => fetchWatchlist(true)}
                    />
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-100 dark:border-gray-800 scale-100 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="space-y-2">
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete "{deleteConfirmation.listName}"?</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">
                                This action cannot be undone. All items in this watchlist will be permanently removed.
                             </p>
                        </div>
                        <div className="flex gap-3 w-full mt-2">
                            <button 
                                onClick={() => setDeleteConfirmation({ isOpen: false, listId: null, listName: '' })}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteList}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* Undo Toast */}
        {removedItem && (
            <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-full shadow-lg shadow-black/5 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto ring-1 ring-black/5">
                <span className="text-xs sm:text-sm font-medium pl-1">Deleted <span className="text-gray-900 dark:text-gray-200">{removedItem.data.symbol}</span></span>
                <button 
                    onClick={handleUndo}
                    className="ml-2 text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors px-2 py-0.5 rounded-md hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                    Undo
                </button>
                <button 
                    onClick={() => setRemovedItem(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <X size={14} />
                </button>
            </div>
        )}
    </div>
  );
}

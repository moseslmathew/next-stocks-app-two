'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search as SearchIcon, Plus, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Newspaper, X, IndianRupee, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';
import SearchComponent from '@/components/Search';
import { searchStocks, getBatchStockQuotes } from '@/actions/market';
import { addToWatchlist, removeFromWatchlist, getWatchlist, reorderWatchlist, createWatchlist, deleteWatchlist, getUserWatchlists } from '@/actions/watchlist';
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
}

function SortableRow({ data, onRemove, onSelect, onOpenNews, highLowRange, trendRange, mobileActiveColumn, onToggleColumn }: SortableRowProps) {
    // ... (hooks remain same)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: data.symbol });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    const high = highLowRange === '1d' ? data.regularMarketDayHigh : data.fiftyTwoWeekHigh;
    const low = highLowRange === '1d' ? data.regularMarketDayLow : data.fiftyTwoWeekLow;

    const range = high - low;
    const position = range > 0 
      ? ((data.regularMarketPrice - low) / range) * 100 
      : 0;
    const clampedPosition = Math.min(Math.max(position, 0), 100);

    // Color logic:
    // If 1D: strictly match the daily change sign (Change = Current - Prev Close).
    // If >1D: let Sparkline decide locally (Start vs End of graph).
    // Or better: Always match the Daily Change color for consistency? 
    // Usually "Trend" implies the graph's own trend.
    // However, if the user sees Green Text, they expect Green Graph for 1D.
    const isDailyPositive = data.regularMarketChange >= 0;
    const sparklineColor = trendRange === '1d' 
        ? (isDailyPositive ? '#16a34a' : '#dc2626') 
        : undefined; // undefined = let Sparkline calculate slope

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors bg-white dark:bg-black">
            <td className="px-2 sm:px-6 py-4 sticky left-0 bg-white dark:bg-black z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle w-[45vw] min-w-[45vw] sm:w-[40%] sm:min-w-0">
                <div className="flex items-center gap-2">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none flex-shrink-0">
                        <GripVertical size={16} />
                    </button>
                    <div className="min-w-0 w-full">
                        <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words" title={data.symbol}>
                            {data.symbol.replace(/\.NS$|\.BO$/, '')}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 sm:px-6 py-4 align-middle w-[55vw] min-w-[55vw] sm:w-[25%] sm:min-w-0 snap-start">
                <div className="flex flex-col items-center sm:items-start">
                    <div className="font-mono text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 text-center sm:text-left">
                        {formatCurrency(data.regularMarketPrice, data.currency)}
                    </div>
                    <div className={`text-xs font-medium mt-0.5 text-center sm:text-left ${data.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.regularMarketChange >= 0 ? '+' : ''}{data.regularMarketChange.toFixed(2)} ({data.regularMarketChangePercent.toFixed(2)}%)
                    </div>
                </div>
            </td>
            <td className="px-6 sm:px-6 py-4 align-middle w-[55vw] min-w-[55vw] sm:w-[20%] sm:min-w-0 snap-start" onClick={() => onSelect(data)}>
                <div className="cursor-pointer hover:opacity-80 transition-opacity flex justify-center sm:justify-start">
                    <Sparkline data={data.sparkline} width={90} height={35} color={sparklineColor} />
                </div>
            </td>

            <td className="px-6 sm:px-6 py-4 text-center sm:text-right align-middle w-[55vw] min-w-[55vw] sm:w-[15%] sm:min-w-0 snap-start">
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
  const [watchlists, setWatchlists] = useState<{id: string, name: string}[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  
  const [sortColumn, setSortColumn] = useState<SortColumn>('custom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [trendRange, setTrendRange] = useState<'1d' | '7d' | '52w'>('1d');
  const [highLowRange, setHighLowRange] = useState<'1d' | '52w'>('1d');
  const [selectedStock, setSelectedStock] = useState<MarketData | null>(null);
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

  const handleDeleteList = async (id: string) => {
      if (confirm('Are you sure? This will delete the list and all items in it.')) {
          const result = await deleteWatchlist(id);
          if (result.success) {
              const remaining = watchlists.filter(w => w.id !== id);
              setWatchlists(remaining);
              if (activeWatchlistId === id) {
                  setActiveWatchlistId(remaining[0]?.id || null);
              }
          }
      }
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

  // Effect to fetch items when Active List or Range changes
  useEffect(() => {
    if (activeWatchlistId) {
        // If switching lists, clear old data to avoid showing wrong list
        if (activeWatchlistId !== prevActiveWatchlistId.current) {
            setWatchlistData([]); 
            setIsLoadingData(true);
            prevActiveWatchlistId.current = activeWatchlistId;
        }
        // Fetch new data (for list or new trend range)
        fetchWatchlist(true);
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

  // Polling Effect
  useEffect(() => {
    if (refreshRate === 0 || !activeWatchlistId) return;

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const runLoop = async () => {
        const now = new Date();
        
        // India: 9:15 - 15:30 IST
        const istTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
        const [iH, iM] = istTime.split(':').map(Number);
        const iVal = iH * 100 + iM;
        const isIndianOpen = iVal >= 915 && iVal < 1530; // 9:15 AM - 3:30 PM IST

        // US: 9:30 - 16:00 ET (approximate, timezone dependent)
        const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
        const [uH, uM] = estTime.split(':').map(Number);
        const uVal = uH * 100 + uM;
        const isUSOpen = uVal >= 930 && uVal < 1600; // 9:30 AM - 4:00 PM ET

        // Filter symbols to update
        const currentData = watchlistRef.current;
        const symbolsToUpdate: string[] = [];
        
        currentData.forEach(item => {
            const isIndian = isIndianStock(item.symbol);
            if (isIndian && isIndianOpen) {
                symbolsToUpdate.push(item.symbol);
            } else if (!isIndian && isUSOpen) {
                symbolsToUpdate.push(item.symbol);
            }
        });

        const isAnyMarketOpen = isIndianOpen || isUSOpen;

        if (symbolsToUpdate.length > 0) {
            try {
                const updates = await getBatchStockQuotes(symbolsToUpdate);
                
                if (isMounted) {
                    setWatchlistData(prev => {
                        return prev.map(existingItem => {
                            const update = updates.find(u => u.symbol === existingItem.symbol);
                            if (!update) return existingItem;
                            return { 
                                ...existingItem, 
                                ...update,
                                // Preserve sparklines from full fetch
                                sparkline: existingItem.sparkline,
                                volumeSparkline: existingItem.volumeSparkline,
                                timestamps: existingItem.timestamps
                            };
                        });
                    });
                }
            } catch (error) {
                console.warn('Refresh skipped:', error);
            }
        }

        // Schedule next tick
        // If any relevant market is open: use fast rate (e.g. 5s)
        // If all closed: check every 1 minute
        const nextDelay = isAnyMarketOpen ? refreshRate : 60000;
        
        if (isMounted) {
            timeoutId = setTimeout(runLoop, nextDelay);
        }
    };

    // Start the loop
    runLoop();
    
    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
    };
  }, [user, refreshRate, activeWatchlistId]); 

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

  const handleRemoveFromWatchlist = async (symbol: string) => {
    if (!activeWatchlistId) return;
    setWatchlistData(prev => prev.filter(item => item.symbol !== symbol));
    const result = await removeFromWatchlist(symbol, activeWatchlistId);
    if (!result.success) {
        alert('Failed to remove from watchlist: ' + result.error);
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
        <div className="flex flex-col gap-6 mb-8">
            
            {/* Row 1: List Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto w-full p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {watchlists.map(list => (
                    <div key={list.id} className="relative group shrink-0">
                         <button
                            onClick={() => setActiveWatchlistId(list.id)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                activeWatchlistId === list.id 
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {list.name}
                        </button>
                        {/* Delete Button (Hover) */}
                        {watchlists.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                title="Delete List"
                            >
                                <Trash2 size={10} />
                            </button>
                        )}
                    </div>
                ))}
                
                {/* Add New List */}
                {isCreatingList ? (
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleCreateList(); }}
                        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg shrink-0 border border-gray-200 dark:border-gray-700"
                    >
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="List Name"
                            className="bg-transparent border-none text-sm px-2 py-1 outline-none w-32 text-gray-900 dark:text-white"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                        />
                         <button type="submit" disabled={!newListName.trim()} className="text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                            <Plus size={16}/>
                         </button>
                         <button type="button" onClick={() => setIsCreatingList(false)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded">×</button>
                    </form>
                ) : (
                    <button 
                        onClick={() => setIsCreatingList(true)}
                        className="h-[42px] px-4 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-2 shrink-0 bg-transparent"
                    >
                        <Plus size={16} /> 
                        <span className="hidden sm:inline">New List</span>
                        <span className="sm:hidden">New</span>
                    </button>
                )}
            </div>

            {/* Row 2: Actions */}
            <div className="flex items-center">
                 <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 font-medium text-sm transform hover:-translate-y-0.5 active:translate-y-0"
                 >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Add Symbol</span>
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
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
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
                                        <button 
                                            onClick={() => scrollTable(title, 'left')}
                                            className="sm:hidden absolute left-[45vw] top-0 h-[84px] z-40 px-1 bg-gradient-to-r from-gray-50/80 dark:from-gray-900/80 to-transparent flex items-center text-gray-400 hover:text-blue-500 justify-center"
                                        >
                                            <ChevronLeft size={20} strokeWidth={3} />
                                        </button>
                                        <button 
                                            onClick={() => scrollTable(title, 'right')}
                                            className="sm:hidden absolute right-0 top-0 h-[84px] z-40 px-1 bg-gradient-to-l from-gray-50/80 dark:from-gray-900/80 to-transparent flex items-center text-gray-400 hover:text-blue-500 justify-center"
                                        >
                                            <ChevronRight size={20} strokeWidth={3} />
                                        </button>

                                        <div 
                                            ref={(el) => { tableRefs.current[title] = el; }}
                                            className="overflow-x-auto snap-x snap-mandatory scroll-pl-[45vw] no-scrollbar rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
                                        >
                                    <table className="w-full text-left text-sm sm:text-base table-fixed">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs sm:text-sm">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white sticky left-0 bg-gray-50 dark:bg-gray-900 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[45vw] min-w-[45vw] sm:w-[40%] sm:min-w-0" onClick={() => handleSort('symbol')}>
                                                    <div className="flex items-center gap-1">
                                                        Company
                                                        {sortColumn === 'symbol' && (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                                    </div>
                                                </th>
                                                <th className="px-6 sm:px-6 py-4 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white w-[55vw] min-w-[55vw] sm:w-[25%] sm:min-w-0 snap-start text-center sm:text-left" onClick={() => handleSort('price')}>
                                                     <div className="flex items-center justify-center sm:justify-start gap-1">
                                                        Price
                                                        {sortColumn === 'price' && (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                                    </div>
                                                </th>
                                                <th className="px-6 sm:px-6 py-4 font-medium text-gray-500 dark:text-gray-400 w-[55vw] min-w-[55vw] sm:w-[20%] sm:min-w-0 snap-start text-center sm:text-left">
                                                     <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                                                         <span className="text-xs sm:text-sm uppercase tracking-wider">Trend</span>
                                                         <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5 text-xs">
                                                             <button
                                                                 onClick={() => setTrendRange('1d')}
                                                                 className={`px-1.5 py-0.5 rounded-md transition-all ${trendRange === '1d' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                             >
                                                                 1D
                                                             </button>
                                                             <button
                                                                 onClick={() => setTrendRange('7d')}
                                                                 className={`px-1.5 py-0.5 rounded-md transition-all ${trendRange === '7d' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                             >
                                                                 7D
                                                             </button>
                                                             <button
                                                                 onClick={() => setTrendRange('52w')}
                                                                 className={`px-1.5 py-0.5 rounded-md transition-all ${trendRange === '52w' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                             >
                                                                 52W
                                                             </button>
                                                        </div>
                                                     </div>
                                                </th>

                                                <th className="px-6 sm:px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-center sm:text-right w-[55vw] min-w-[55vw] sm:w-[15%] sm:min-w-0 snap-start">Actions</th>
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
                                                        onSelect={setSelectedStock} 
                                                        onOpenNews={handleOpenNews}
                                                        highLowRange={highLowRange}
                                                        trendRange={trendRange}
                                                        mobileActiveColumn={mobileActiveColumn}
                                                        onToggleColumn={cycleMobileColumn}
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
            onClose={() => setSelectedStock(null)}
            symbol={selectedStock?.symbol || ''}
            priceData={selectedStock?.sparkline || []}
            volumeData={selectedStock?.volumeSparkline || []}
            timestamps={selectedStock?.timestamps || []}
            range={trendRange === '7d' ? '1w' : trendRange === '52w' ? '1y' : trendRange}
            hideActiveVolume={selectedStock ? !isIndianStock(selectedStock.symbol) : false}
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
                <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add to Watchlist</h3>
                        <p className="text-sm text-gray-500">Search for a stock or ETF to add.</p>
                    </div>
                    <SearchComponent 
                        watchlistId={activeWatchlistId ?? undefined} 
                        onAdd={() => fetchWatchlist(true)}
                    />
                </div>
            </div>
        )}
    </div>
  );
}

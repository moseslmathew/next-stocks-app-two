'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getWatchlistData } from '@/actions/market';
import { useRefreshRate } from '@/hooks/useRefreshRate';
import { formatCurrency } from '@/utils/currency';
import Sparkline from '@/components/Sparkline';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import { ChartModal } from '@/components/ChartModal';
import { createPusherClient } from '@/lib/pusher';

interface MarketData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  shortName: string;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  currency: string;
  sparkline: number[];
  volumeSparkline?: number[];
  timestamps?: number[];
  // Time properties for merging updates
  regularMarketTime?: number;
}

interface LiveMarketTableProps {
  initialData: any[]; // Ideally strict, but 'any' matches previous code for now
  symbols: string[];
  title?: React.ReactNode;
  children?: React.ReactNode;
}

export default function LiveMarketTable({ initialData, symbols, title, children }: LiveMarketTableProps) {
  const router = useRouter();
  const [marketData, setMarketData] = useState<MarketData[]>(initialData);
  const [trendRange, setTrendRange] = useState<'1d' | '7d' | '52w'>('1d');
  const [selectedStock, setSelectedStock] = useState<MarketData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshRate } = useRefreshRate(); // Still use this for pause/resume check

  // Ref to track latest data without triggering re-renders in the loop
  const marketDataRef = useRef(marketData);
  useEffect(() => {
     marketDataRef.current = marketData;
  }, [marketData]);

  const fetchData = async () => {
      const data = await getWatchlistData(symbols, trendRange);
      setMarketData(data);
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          await Promise.all([
              fetchData(),
              router.refresh()
          ]);
      } finally {
          setIsRefreshing(false);
      }
  };

  // Initial Fetch on Mount or Range Change
  useEffect(() => {
    fetchData();
  }, [symbols, trendRange]);

   // Pusher Subscription
   useEffect(() => {
    const pusher = createPusherClient();
    const channel = pusher.subscribe('market-data');

    channel.bind('update', (updates: MarketData[]) => {
        setMarketData(prev => {
            return prev.map(existingItem => {
                const update = updates.find(u => u.symbol === existingItem.symbol);
                if (!update) return existingItem;
                return { 
                    ...existingItem, 
                    ...update,
                    sparkline: (update.regularMarketTime && update.regularMarketTime > ((existingItem.timestamps && existingItem.timestamps.length > 0) ? existingItem.timestamps[existingItem.timestamps.length - 1] : 0))
                        ? [...existingItem.sparkline, update.regularMarketPrice]
                        : existingItem.sparkline,
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

  // Keep Alive / Stream Trigger
  useEffect(() => {
    if (refreshRate === 0) return; // Pause if globally paused

    let isMounted = true;
    let isFetching = false;

    const startStream = async () => {
        if (isFetching || !isMounted) return;
        
        const currentData = marketDataRef.current;
        if (currentData.length === 0) {
            setTimeout(startStream, 1000);
            return;
        }

        const symbolsToTrack = currentData.map(d => d.symbol);
        isFetching = true;

        try {
             await fetch('/api/stream-prices', {
                 method: 'POST',
                 body: JSON.stringify({ symbols: symbolsToTrack }),
             });
        } catch (e) {
            console.error('Stream trigger error:', e);
            await new Promise(r => setTimeout(r, 2000));
        } finally {
            isFetching = false;
            if (isMounted && refreshRate !== 0) {
                startStream();
            }
        }
    };

    startStream();
    
    return () => {
        isMounted = false;
    };
  }, [refreshRate, symbols]); // Restart if symbols or pause state changes

  if (marketData.length === 0) {
      return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                 <div>{title}</div>
                 <button onClick={handleRefresh} className="text-blue-600 hover:underline text-sm">Retry</button>
            </div>
            {children}
            <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
               <p className="text-gray-500">Unable to load market data.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="mb-4">
             {title}
        </div>

        {children}

        <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
          <tr>
            <th className="px-4 sm:px-6 py-3 w-[40%]">Company</th>
            <th className="px-4 sm:px-6 py-3 w-[25%]">Price</th>
            <th className="px-4 sm:px-6 py-3 w-[35%]">
                <div className="flex items-center justify-end">
                    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5 text-xs">
                        <button
                            onClick={() => setTrendRange('1d')}
                            className={`px-2 py-0.5 rounded-md transition-all ${trendRange === '1d' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            1D
                        </button>
                        <button
                            onClick={() => setTrendRange('52w')}
                            className={`px-2 py-0.5 rounded-md transition-all ${trendRange === '52w' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            52W
                        </button>
                    </div>
                </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {marketData.map((data) => {
            const isPositive = data.regularMarketChange >= 0;
            const previousClose = data.regularMarketPrice - data.regularMarketChange;
            const isIndian = data.symbol.includes('^NSE') || data.symbol.includes('^BSE') || data.symbol === 'USDINR=X';

            return (
              <tr key={data.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-4 sm:px-6 py-4 align-middle">
                  <div className="flex items-center">
                    <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white whitespace-normal leading-tight">{data.shortName}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 capitalize truncate mt-0.5">{(data.shortName || data.symbol).toLowerCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 align-middle">
                    <div className="flex flex-col items-start">
                        <div className="font-mono text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                           {formatCurrency(data.regularMarketPrice, data.currency)}
                        </div>
                        <div className={`text-[10px] sm:text-xs font-medium mt-0.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{data.regularMarketChange.toFixed(2)} ({data.regularMarketChangePercent.toFixed(2)}%)
                        </div>
                    </div>
                </td>
                <td className="px-4 sm:px-6 py-4 align-middle cursor-pointer" onClick={() => setSelectedStock(data)} title="Click to view chart">
                    <div className="flex justify-end">
                        <Sparkline 
                            data={data.sparkline} 
                            timestamps={data.timestamps}
                            previousClose={previousClose}
                            isIndian={isIndian}
                            width={120} 
                            height={40} 
                            className="w-20 sm:w-32"
                            color={trendRange === '1d' ? (isPositive ? '#16a34a' : '#dc2626') : undefined} 
                        />
                    </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      {selectedStock && (
        <ChartModal
            isOpen={!!selectedStock}
            onClose={() => setSelectedStock(null)}
            symbol={selectedStock.symbol}
            priceData={selectedStock.sparkline}
            volumeData={selectedStock.volumeSparkline || []}
            timestamps={selectedStock.timestamps || []}
            range={trendRange as any}
        />
      )}
    </div>
  );
}

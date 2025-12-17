'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Added
import { getWatchlistData } from '@/actions/market';
import { useRefreshRate } from '@/hooks/useRefreshRate';
import { formatCurrency } from '@/utils/currency';
import Sparkline from '@/components/Sparkline';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react'; // Added RefreshCcw
import { ChartModal } from '@/components/ChartModal';

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
}

interface LiveMarketTableProps {
  initialData: any[];
  symbols: string[];
}

export default function LiveMarketTable({ initialData, symbols }: LiveMarketTableProps) {
  const router = useRouter();
  const [marketData, setMarketData] = useState<MarketData[]>(initialData);
  const [trendRange, setTrendRange] = useState<'1d' | '7d' | '52w'>('1d');
  const [selectedStock, setSelectedStock] = useState<MarketData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshRate } = useRefreshRate();

  const fetchData = async () => {
      const data = await getWatchlistData(symbols, trendRange);
      setMarketData(data);
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          await Promise.all([
              fetchData(),
              router.refresh() // Refreshes server components (like GoldRates)
          ]);
      } finally {
          setIsRefreshing(false);
      }
  };

  useEffect(() => {
    if (refreshRate === 0) return;

    const interval = setInterval(fetchData, refreshRate);
    // Also fetch immediately when range changes (if not initial render)
    fetchData();
    return () => clearInterval(interval);
  }, [symbols, refreshRate, trendRange]);

  if (marketData.length === 0) {
      return (
        <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
           <p className="text-gray-500">Unable to load market data.</p>
           <button onClick={handleRefresh} className="mt-4 text-blue-600 hover:underline">Retry</button>
        </div>
      );
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end px-2">
            <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
                <RefreshCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
            </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
          <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Price</th>
            <th className="px-6 py-4">Change</th>
            <th className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span>Trend</span>
                    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5 text-xs">
                        <button
                            onClick={() => setTrendRange('1d')}
                            className={`px-2 py-0.5 rounded-md transition-all ${trendRange === '1d' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            1D
                        </button>
                        <button
                            onClick={() => setTrendRange('7d')}
                            className={`px-2 py-0.5 rounded-md transition-all ${trendRange === '7d' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            7D
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
            <th className="px-6 py-4 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {marketData.map((data) => {
            const isPositive = data.regularMarketChange >= 0;
            return (
              <tr key={data.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{data.shortName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{data.symbol}</div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-gray-900 dark:text-gray-100">
                   {formatCurrency(data.regularMarketPrice, data.currency)}
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    <span className="font-medium">
                        {Math.abs(data.regularMarketChange).toFixed(2)} ({Math.abs(data.regularMarketChangePercent).toFixed(2)}%)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedStock(data)} title="Click to view chart">
                    <Sparkline data={data.sparkline} width={120} height={40} color={trendRange === '1d' ? (isPositive ? '#16a34a' : '#dc2626') : undefined} />
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="text-xs text-gray-400 font-mono">
                      H: {formatCurrency(data.regularMarketDayHigh, data.currency)}
                      <span className="mx-2">|</span>
                      L: {formatCurrency(data.regularMarketDayLow, data.currency)}
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
            range={trendRange}
        />
      )}
    </div>
  );
}

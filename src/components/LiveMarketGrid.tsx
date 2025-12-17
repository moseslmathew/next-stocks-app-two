'use client';

import { useState, useEffect } from 'react';
import MarketCard from '@/components/MarketCard';
import { getWatchlistData } from '@/actions/market';

import { useRefreshRate } from '@/hooks/useRefreshRate';

interface LiveMarketGridProps {
  initialData: any[];
  symbols: string[];
}

export default function LiveMarketGrid({ initialData, symbols }: LiveMarketGridProps) {
  const [marketData, setMarketData] = useState(initialData);
  const { refreshRate } = useRefreshRate();

  useEffect(() => {
    // Poll based on refreshRate
    if (refreshRate === 0) return;

    const fetch = async () => {
      const data = await getWatchlistData(symbols);
      setMarketData(data);
    };

    const interval = setInterval(fetch, refreshRate);
    return () => clearInterval(interval);
  }, [symbols, refreshRate]);

  if (marketData.length === 0) {
      return (
          <div className="col-span-full p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">Unable to load market data. Please try again later.</p>
          </div>
      );
  }

  return (
    <>
      {marketData.map((data) => (
        <MarketCard
          key={data.symbol}
          name={data.shortName}
          price={data.regularMarketPrice}
          change={data.regularMarketChange}
          changePercent={data.regularMarketChangePercent}
          currency={data.currency}
        />
      ))}
    </>
  );
}

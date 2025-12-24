'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getStockQuote } from '@/actions/market';
import { formatCurrency } from '@/utils/currency';
import { createPusherClient } from '@/lib/pusher';
import { useRefreshRate } from '@/hooks/useRefreshRate';

interface LiveQuoteProps {
  initialData: any;
  symbol: string;
}

export default function LiveQuote({ initialData, symbol }: LiveQuoteProps) {
  const [data, setData] = useState(initialData);
  const { refreshRate } = useRefreshRate();

  useEffect(() => {
    // 1. Subscribe to Pusher
    const pusher = createPusherClient();
    const channel = pusher.subscribe('market-data');

    channel.bind('update', (updates: any[]) => {
       const update = updates.find((u: any) => u.symbol === symbol);
       if (update) {
           setData((prev: any) => ({
               ...prev,
               price: update.regularMarketPrice,
               change: update.regularMarketChange,
               changePercent: update.regularMarketChangePercent,
           }));
       }
    });

    return () => {
        pusher.unsubscribe('market-data');
        pusher.disconnect();
    };
  }, [symbol]);

  // 2. Keep Alive Stream
  useEffect(() => {
    if (refreshRate === 0) return;

    let isMounted = true;
    let isFetching = false;

    const startStream = async () => {
        if (isFetching || !isMounted) return;
        isFetching = true;
        try {
             await fetch('/api/stream-prices', {
                 method: 'POST',
                 body: JSON.stringify({ symbols: [symbol] }),
             });
        } catch (e) {
            console.error(e);
            await new Promise(r => setTimeout(r, 2000));
        } finally {
            isFetching = false;
            // Loop if still mounted and not paused
            if (isMounted && refreshRate !== 0) {
                startStream();
            }
        }
    };

    startStream();
    
    return () => { isMounted = false; };
  }, [symbol, refreshRate]);

  const isPositive = data.change >= 0;

  return (
    <div className="text-right flex flex-col items-end gap-3">
        {/* We will inject WatchlistButton via parent or slot if needed, but for now just price */}
        
        <div className="text-5xl font-bold tracking-tighter text-gray-900 dark:text-gray-100 mt-2 mb-2 animate-in fade-in duration-300">
        {formatCurrency(data.price, data.currency)}
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-medium transition-colors duration-300 ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
        {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
        <span>{data.change > 0 ? '+' : ''}{data.change.toFixed(2)}</span>
        <span className="opacity-80">({data.changePercent.toFixed(2)}%)</span>
        </div>
    </div>
  );
}

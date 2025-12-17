'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getStockQuote } from '@/actions/market';
import { formatCurrency } from '@/utils/currency';

import { useRefreshRate } from '@/hooks/useRefreshRate';

interface LiveQuoteProps {
  initialData: any;
  symbol: string;
}

export default function LiveQuote({ initialData, symbol }: LiveQuoteProps) {
  const [data, setData] = useState(initialData);
  const { refreshRate } = useRefreshRate();

  useEffect(() => {
    if (refreshRate === 0) return;

    const fetchData = async () => {
      const quote = await getStockQuote(symbol);
      if (quote) setData(quote);
    };

    const interval = setInterval(fetchData, refreshRate);
    return () => clearInterval(interval);
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

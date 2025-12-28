'use client';

import { useEffect, useState, useRef } from 'react';
import { getIndicesData } from '@/actions/ticker';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketData } from '@/services/marketData';

const SYMBOL_NAMES: Record<string, string> = {
    '^NSEI': 'NIFTY 50',
    '^BSESN': 'SENSEX',
    '^NSEBANK': 'BANK NIFTY',
    '^GSPC': 'S&P 500',
    '^IXIC': 'NASDAQ',
    'GC=F': 'GOLD',
    '^CNXIT': 'NIFTY IT'
};

interface MarketIndicesTickerProps {
    mode?: 'cards' | 'ticker';
}

export default function MarketIndicesTicker({ mode = 'cards' }: MarketIndicesTickerProps) {
    const [indices, setIndices] = useState<MarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const data = await getIndicesData();
            setIndices(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch indices", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Update every 5s
        return () => clearInterval(interval);
    }, []);

    // Horizontal scroll capability is managed by CSS (overflow-x-auto)
    // We can add drag-to-scroll later if needed, but for now native touch/scroll is fine.

    if (loading && indices.length === 0) {
        return (
            <div className="flex items-center gap-3 overflow-hidden h-12 w-full max-w-xl animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-full w-28 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (!loading && indices.length === 0) {
        return (
            <div className="flex items-center justify-center h-12 w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 border-dashed">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-red-400"/>
                    Market Data Unavailable
                    <button onClick={fetchData} className="ml-2 hover:text-violet-500 underline">Retry</button>
                </div>
            </div>
        );
    }

    if (mode === 'ticker') {
        return (
            <div className="w-full overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar whitespace-nowrap py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {indices.map((index) => {
                         const isPositive = index.regularMarketChange >= 0;
                         const colorClass = isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
                         
                         return (
                            <div key={index.symbol} className="flex items-baseline gap-2 text-xs sm:text-sm shrink-0">
                                <span className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                                     {SYMBOL_NAMES[index.symbol] || index.shortName}
                                </span>
                                <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">
                                     {index.regularMarketPrice.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                </span>
                                <span className={`font-mono font-medium ${colorClass}`}>
                                    {index.regularMarketChange > 0 ? '+' : ''}{index.regularMarketChange.toFixed(2)} ({Math.abs(index.regularMarketChangePercent).toFixed(2)}%)
                                </span>
                            </div>
                         );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden group">
             {/* Gradient Masks for Overflow indication */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none md:hidden" />

            <div 
                ref={scrollRef}
                className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth w-full select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {indices.map((index) => {
                    const isPositive = index.regularMarketChange >= 0;
                    const Icon = isPositive ? TrendingUp : TrendingDown;
                    const colorClass = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                    const bgClass = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

                    return (
                        <div 
                            key={index.symbol}
                            className={`flex flex-col justify-center min-w-[110px] px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors cursor-default whitespace-nowrap`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {SYMBOL_NAMES[index.symbol] || index.shortName}
                                </span>
                                {index.regularMarketChange !== 0 ? (
                                     <Icon size={10} className={colorClass} />
                                ) : (
                                     <Minus size={10} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                                    {index.regularMarketPrice.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })}
                                </span>
                                <span className={`text-[10px] font-medium font-mono ${colorClass}`}>
                                    {isPositive ? '+' : ''}{index.regularMarketChangePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

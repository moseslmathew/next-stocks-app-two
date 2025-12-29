'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { createPusherClient } from '@/lib/pusher';
import { useRefreshRate } from '@/hooks/useRefreshRate';

interface IndexData {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    // ... any other needed fields
}

interface GlobalIndicesClientProps {
    initialMarketData: any[]; // Using any[] to match existing loosely typed structures
    scrapedGold: any;
    indicesConfig: any[];
}

export default function GlobalIndicesClient({ initialMarketData, scrapedGold, indicesConfig }: GlobalIndicesClientProps) {
    const [marketData, setMarketData] = useState<any[]>(initialMarketData);
    const { refreshRate } = useRefreshRate();
    const marketDataRef = useRef(marketData);

    useEffect(() => {
        marketDataRef.current = marketData;
    }, [marketData]);

    // Pusher Subscription
    useEffect(() => {
        const pusher = createPusherClient();
        const channel = pusher.subscribe('market-data');

        channel.bind('update', (updates: any[]) => {
            setMarketData(prev => {
                const newData = [...prev];
                let hasChanges = false;
                
                updates.forEach(update => {
                    const index = newData.findIndex(item => item.symbol === update.symbol);
                    if (index !== -1) {
                         // Merge update
                         newData[index] = { ...newData[index], ...update };
                         hasChanges = true;
                    }
                });

                return hasChanges ? newData : prev;
            });
        });

        return () => {
            pusher.unsubscribe('market-data');
            pusher.disconnect();
        };
    }, []);

    // Keep Alive Stream
    useEffect(() => {
        if (refreshRate === 0) return;

        let isMounted = true;
        let isFetching = false;

        const startStream = async () => {
            if (isFetching || !isMounted) return;

            // Only request standard symbols, exclude custom ones like KERALA_GOLD
            const symbolsToTrack = indicesConfig
                .filter(i => !i.type) // Exclude type='derived'
                .map(i => i.symbol);

            if (symbolsToTrack.length === 0) return;

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

        return () => { isMounted = false; };
    }, [refreshRate, indicesConfig]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full relative z-20">
            {indicesConfig.map((index: any) => {
                let price = 0;
                let change = 0;
                let percent = 0;
                let isPositive = true;

                if (index.symbol === 'KERALA_GOLD') {
                    if (scrapedGold.success && scrapedGold.price1g22k) {
                        const price1g = scrapedGold.price1g22k;
                        const change1g = scrapedGold.change1g22k || 0;
                        price = price1g * 8; 
                        const prevPrice1g = price1g - change1g;
                        percent = prevPrice1g !== 0 ? (change1g / prevPrice1g) * 100 : 0;
                        isPositive = change1g >= 0;
                    }
                } else {
                    const quote = marketData.find((d) => d.symbol === index.symbol);
                    price = quote?.regularMarketPrice || 0;
                    change = quote?.regularMarketChange || 0;
                    percent = quote?.regularMarketChangePercent || 0;
                    isPositive = change >= 0;
                }

                const baseStyle = index.isGold 
                    ? 'bg-amber-50/40 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/30'
                    : index.isSilver
                    ? 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-700/30'
                    : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700';

                return (
                    <div
                        key={index.symbol}
                        className={`${baseStyle} backdrop-blur-md border p-5 rounded-xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group ${index.hoverBorder} flex flex-col justify-between h-full min-h-[110px] relative overflow-hidden`}
                    >
                        <div className="relative z-10 flex justify-between items-start mb-2 gap-2">
                           <div className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight flex items-center gap-1.5">
                            {(index.symbol === 'GC=F' || index.symbol === 'SI=F') && <Globe size={14} className="stroke-[2.5px] text-blue-500/80 dark:text-blue-400" />}
                            {index.name}
                           </div>
                           <div className={`text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 mt-0.5 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {Math.abs(percent).toFixed(2)}%
                           </div>
                        </div>
                        
                        <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {price ? (
                                (index.symbol === 'GC=F' || index.symbol === 'SI=F') 
                                ? `$ ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` 
                                : index.symbol === 'KERALA_GOLD'
                                ? `₹ ${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                                : price.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                            ) : '---'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

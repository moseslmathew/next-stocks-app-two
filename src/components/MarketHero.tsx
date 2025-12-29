import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import Sparkline from '@/components/Sparkline';

interface MarketData {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    shortName: string;
    currency: string;
    sparkline: number[];
    timestamps?: number[];
    marketState?: string;
}

export default function MarketHero({ data }: { data: MarketData[] }) {
    const getMarketStatus = (state?: string) => {
        if (!state) return { label: 'Unknown', color: 'gray' };
        
        switch(state) {
            case 'REGULAR': return { label: 'Live', color: 'green', pulsing: true };
            case 'PRE': return { label: 'Pre-Market', color: 'orange', pulsing: true };
            case 'POST': return { label: 'After Hours', color: 'blue', pulsing: false };
            case 'CLOSED': return { label: 'Closed', color: 'red', pulsing: false };
            default: return { label: state, color: 'gray' };
        }
    };

    return (
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-3 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-4 md:pb-0 md:mx-0 md:px-0 md:overflow-visible mb-8 snap-x snap-mandatory hide-scrollbar">
            {data.map((item) => {
                const isPositive = item.regularMarketChange >= 0;
                const previousClose = item.regularMarketPrice - item.regularMarketChange;
                const status = getMarketStatus(item.marketState);
                
                // Color mapping for status
                const statusColors: {[key: string]: string} = {
                    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                    red: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                };

                return (
                    <div key={item.symbol} className="min-w-[160px] w-[160px] md:w-auto shrink-0 snap-start bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[110px]">
                         {/* Subtle Background Gradient */}
                         <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${isPositive ? 'from-green-500/5' : 'from-red-500/5'} to-transparent rounded-full blur-2xl pointer-events-none`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-0.5">
                                <div className="flex items-center gap-2 min-w-0 pr-1">
                                    <h3 className="font-medium text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest truncate" title={item.shortName}>
                                        {item.shortName || item.symbol}
                                    </h3>
                                    {item.marketState === 'REGULAR' && (
                                        <span className="relative flex h-1.5 w-1.5 shrink-0" title="Market Open">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-500"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[9px] px-1 py-0.5 rounded ${isPositive ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {isPositive ? '+' : ''}{item.regularMarketChangePercent.toFixed(2)}%
                                </span>
                            </div>
                            
                            <div className="mt-0.5">
                                <span className="text-base md:text-lg font-mono font-medium text-gray-900 dark:text-white tracking-tight">
                                    {formatCurrency(item.regularMarketPrice, item.currency)}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-2 h-6 md:h-8 opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
                            <Sparkline 
                                data={item.sparkline} 
                                timestamps={item.timestamps}
                                width={150} 
                                height={30} 
                                color={isPositive ? '#16a34a' : '#dc2626'} 
                                previousClose={previousClose}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

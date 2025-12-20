
import { getMarketData } from '@/services/marketData';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const INDICES = [
  { 
    symbol: '^NSEI', name: 'Nifty 50', region: 'IN', 
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-500 dark:text-orange-400',
    hoverBorder: 'group-hover:border-orange-200 dark:group-hover:border-orange-800'
  },
  { 
    symbol: '^IXIC', name: 'Nasdaq', region: 'US',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-400',
    hoverBorder: 'group-hover:border-blue-200 dark:group-hover:border-blue-800'
  },
  { 
    symbol: '^GSPC', name: 'S&P 500', region: 'US',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    hoverBorder: 'group-hover:border-indigo-200 dark:group-hover:border-indigo-800'
  },
  { 
    symbol: '^N225', name: 'Nikkei 225', region: 'JP',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-500 dark:text-rose-400',
    hoverBorder: 'group-hover:border-rose-200 dark:group-hover:border-rose-800'
  },
  { 
    symbol: 'GC=F', name: 'Gold', region: 'US',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500 dark:text-amber-400',
    hoverBorder: 'group-hover:border-amber-200 dark:group-hover:border-amber-800'
  },
];

export default async function GlobalIndices() {
  const data = await getMarketData(INDICES.map(i => i.symbol), '1d', false);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-7xl mx-auto px-4 relative z-20">
      {INDICES.map((index) => {
        const quote = data.find((d) => d.symbol === index.symbol);
        const price = quote?.regularMarketPrice;
        const change = quote?.regularMarketChange || 0;
        const percent = quote?.regularMarketChangePercent || 0;
        const isPositive = change >= 0;

        return (
          <div
            key={index.symbol}
            className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group ${index.hoverBorder}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${index.badgeColor}`}>
                {index.region}
              </span>
              <Activity size={16} className={`${index.iconColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 truncate">
                {index.name}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
                <div className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                    {price ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
                </div>
            </div>
            <div className={`text-xs font-bold flex items-center gap-1 mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{percent.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

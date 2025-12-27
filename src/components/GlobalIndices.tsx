import { getMarketData } from '@/services/marketData';
import { getScrapedGoldRate } from '@/actions/gold';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';

const INDICES = [
  { 
    symbol: '^NSEI', name: 'Nifty 50', region: 'IN', 
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    hoverBorder: 'group-hover:border-orange-200 dark:group-hover:border-orange-800'
  },
  { 
    symbol: '^BSESN', name: 'Sensex', region: 'IN',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
    hoverBorder: 'group-hover:border-fuchsia-200 dark:group-hover:border-fuchsia-800'
  },
  { 
    symbol: '^NSEBANK', name: 'Bank Nifty', region: 'IN',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    hoverBorder: 'group-hover:border-teal-200 dark:group-hover:border-teal-800'
  },
  { 
    symbol: '^IXIC', name: 'Nasdaq', region: 'US',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    hoverBorder: 'group-hover:border-blue-200 dark:group-hover:border-blue-800'
  },
  { 
    symbol: '^GSPC', name: 'S&P 500', region: 'US',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    hoverBorder: 'group-hover:border-indigo-200 dark:group-hover:border-indigo-800'
  },
  { 
    symbol: '^N225', name: 'Nikkei 225', region: 'JP',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    hoverBorder: 'group-hover:border-rose-200 dark:group-hover:border-rose-800'
  },
  { 
    symbol: 'GC=F', name: 'Gold', region: 'US',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    hoverBorder: 'group-hover:border-amber-200 dark:group-hover:border-amber-800',
    isGold: true
  },
  { 
    symbol: 'KERALA_GOLD', name: 'Gold (8g) 22K', region: 'IN', type: 'derived',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    hoverBorder: 'group-hover:border-amber-200 dark:group-hover:border-amber-800',
    isGold: true
  },
];

export default async function GlobalIndices() {
  const symbolsToFetch = INDICES.filter(i => !i.type).map(i => i.symbol);
  const uniqueSymbols = Array.from(new Set(symbolsToFetch));

  // Parallel fetch: Market Data & Scraped Gold
  const [marketData, scrapedGold] = await Promise.all([
    getMarketData(uniqueSymbols, '1d', false),
    getScrapedGoldRate()
  ]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full relative z-20">
      {INDICES.map((index: any) => {
        let price = 0;
        let change = 0;
        let percent = 0;
        let isPositive = true;

        if (index.symbol === 'KERALA_GOLD') {
             if (scrapedGold.success && scrapedGold.price1g22k) {
                 const price1g = scrapedGold.price1g22k;
                 const change1g = scrapedGold.change1g22k || 0;
                 // Formula for 22K (0.916 purity) for 8 grams
                 price = price1g * 8; 
                 const prevPrice1g = price1g - change1g;
                 // Avoid division by zero
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

        const baseStyle = 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700';

        return (
          <div
            key={index.symbol}
            className={`${baseStyle} backdrop-blur-md border p-5 rounded-xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group ${index.hoverBorder} flex flex-col justify-between h-full min-h-[110px] relative overflow-hidden`}
          >
             {/* Gold Background Illustration (Inline SVG) */}
             {index.isGold && (
                 <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-80 dark:opacity-60 pointer-events-none rotate-12 transition-transform group-hover:scale-110 duration-700">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                        <defs>
                            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FCD34D" />
                                <stop offset="30%" stopColor="#FBBF24" />
                                <stop offset="60%" stopColor="#D97706" />
                                <stop offset="100%" stopColor="#B45309" />
                            </linearGradient>
                            <linearGradient id="gold-shine" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="white" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        {/* Bottom Bar */}
                        <path d="M40 140 L140 120 L160 150 L60 170 Z" fill="url(#gold-grad)" />
                        <path d="M40 140 L140 120 L160 150 L60 170 Z" fill="url(#gold-shine)" />
                        <path d="M40 140 L50 110 L150 90 L140 120" fill="#F59E0B" />
                        <path d="M150 90 L160 150 L140 120" fill="#B45309" />
                        
                        {/* Top Bar */}
                        <path d="M30 110 L130 90 L150 120 L50 140 Z" fill="url(#gold-grad)" />
                        <path d="M30 110 L130 90 L150 120 L50 140 Z" fill="url(#gold-shine)" />
                        <path d="M30 110 L40 80 L140 60 L130 90" fill="#F59E0B" />
                        <path d="M140 60 L150 120 L130 90" fill="#B45309" />
                        
                        {/* Top Face details */}
                        <rect x="60" y="85" width="40" height="20" rx="2" transform="rotate(-12 60 85)" fill="#B45309" fillOpacity="0.2" />
                        <text x="65" y="100" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#78350F" transform="rotate(-12 65 100)">999.9</text>
                    </svg>
                 </div>
             )}

            <div className="relative z-10 flex justify-between items-start mb-2 gap-2">
               <div className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight flex items-center gap-1.5">
                {index.symbol === 'GC=F' && <Globe size={14} className="stroke-[2.5px] text-blue-500/80 dark:text-blue-400" />}
                {index.name}
               </div>
               <div className={`text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 mt-0.5 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(percent).toFixed(2)}%
               </div>
            </div>
            
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {price ? (
                    index.symbol === 'GC=F' 
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

import { getMarketData } from '@/services/marketData';
import { getScrapedGoldRate } from '@/actions/gold';
import GlobalIndicesClient from './GlobalIndicesClient';

export const INDICES = [
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
  { 
    symbol: 'SI=F', name: 'Silver', region: 'US',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    hoverBorder: 'group-hover:border-slate-200 dark:group-hover:border-slate-800',
    isSilver: true
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
    <GlobalIndicesClient 
        initialMarketData={marketData}
        scrapedGold={scrapedGold}
        indicesConfig={INDICES}
    />
  );
}

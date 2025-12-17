import { getStockQuote } from '@/actions/market';
import { isInWatchlist } from '@/actions/watchlist';
import WatchlistButton from '@/components/WatchlistButton';
import LiveQuote from '@/components/LiveQuote';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Calendar, Activity } from 'lucide-react';

export const revalidate = 60;

// Use 'any' for params to avoid type issues with Next.js versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function QuotePage({ params }: any) {
  // Await params if it's a promise (Next.js 15 change)
  const resolvedParams = await params;
  const symbol = decodeURIComponent(resolvedParams.symbol);
  const quote = await getStockQuote(symbol);

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">Could not retrieve data for {symbol}</p>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{quote.symbol}</h1>
               <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {quote.name}
               </span>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-3">
             <WatchlistButton symbol={quote.symbol} isInDataBase={await isInWatchlist(quote.symbol)} />
             
             <LiveQuote initialData={quote} symbol={quote.symbol} />
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4 text-gray-500 dark:text-gray-400">
               <Activity size={20} />
               <span className="text-sm font-medium">Day Range</span>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Low</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${quote.dayLow?.toFixed(2) ?? 'N/A'}</span>
               </div>
               <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  {/* Visual representation of range could go here */}
                  <div className="bg-blue-500 h-full w-1/2 mx-auto rounded-full opacity-50"></div>
               </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">High</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${quote.dayHigh?.toFixed(2) ?? 'N/A'}</span>
               </div>
            </div>
         </div>

         <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-3 mb-4 text-gray-500 dark:text-gray-400">
               <BarChart2 size={20} />
               <span className="text-sm font-medium">Volume</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
               {(quote.volume ?? 0).toLocaleString()}
            </div>
         </div>
         
         <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-3 mb-4 text-gray-500 dark:text-gray-400">
               <DollarSign size={20} />
               <span className="text-sm font-medium">Market Cap</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
               {quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
            </div>
         </div>

         <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-3 mb-4 text-gray-500 dark:text-gray-400">
               <Calendar size={20} />
               <span className="text-sm font-medium">Previous Close</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
               ${quote.prevClose?.toFixed(2) ?? 'N/A'}
            </div>
         </div>
      </div>
    </div>
  );
}


import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import Watchlist from '@/components/Watchlist';
import { DollarSign } from 'lucide-react';

export const metadata = {
  title: 'US Markets - TradeMind',
  description: 'Track your favorite US and Global stocks.',
};

export default function USWatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400">
                <DollarSign size={28} />
            </div>
            US Markets
            <MarketStatusBadge market="US" />
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your favorite US and global stocks.
        </p>
      </div>
      
      <Watchlist filterRegion="GLOBAL" hideSectionTitles={true} />
    </div>
  );
}


import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import Watchlist from '@/components/Watchlist';

export const metadata = {
  title: 'US Markets - MarketPro',
  description: 'Track your favorite US and Global stocks.',
};

export default function USWatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>🇺🇸</span> US Markets
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

import { IndianRupee } from 'lucide-react';
import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import Watchlist from '@/components/Watchlist';

export const metadata = {
  title: 'Indian Markets - TradeMind',
  description: 'Track your favorite Indian stocks.',
};

export default function IndianWatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8" /> 
            <span className="whitespace-nowrap">Indian Markets</span>
            <MarketStatusBadge market="IN" />
        </h1>
      </div>
      
      <Watchlist filterRegion="IN" hideSectionTitles={true} />
    </div>
  );
}

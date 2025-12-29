
import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import Watchlist from '@/components/Watchlist';
import { DollarSign } from 'lucide-react';

export const metadata = {
  title: 'US Markets - Tensor Terminal',
  description: 'Track your favorite US and Global stocks.',
};

export default function USWatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      
      <Watchlist filterRegion="GLOBAL" hideSectionTitles={true} />
    </div>
  );
}

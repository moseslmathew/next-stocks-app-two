import { IndianRupee } from 'lucide-react';
import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import Watchlist from '@/components/Watchlist';

export const metadata = {
  title: 'Indian Markets - Tensor Terminal',
  description: 'Track your favorite Indian stocks.',
};

export default function IndianWatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      
      <Watchlist filterRegion="IN" hideSectionTitles={true} />
    </div>
  );
}

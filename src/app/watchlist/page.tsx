
import Watchlist from '@/components/Watchlist';

export const metadata = {
  title: 'My Watchlist - TradeMind',
  description: 'Track your favorite stocks and analyze market trends.',
};

export default function WatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Watchlist</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Keep track of your favorite stocks and investments in one place.
        </p>
      </div>
      
      <Watchlist />
    </div>
  );
}

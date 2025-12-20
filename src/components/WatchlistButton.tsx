'use client';

import { useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist } from '@/actions/watchlist';
import { useUser } from '@clerk/nextjs';

interface WatchlistButtonProps {
  symbol: string;
  isInDataBase: boolean;
}

export default function WatchlistButton({ symbol, isInDataBase }: WatchlistButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [isInWatchlist, setIsInWatchlist] = useState(isInDataBase);
  const [isLoading, setIsLoading] = useState(false);

  if (isLoaded && !isSignedIn) {
    return null;
  }

  const toggleWatchlist = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        const result = await removeFromWatchlist(symbol);
        if (result.success) {
          setIsInWatchlist(false);
        } else {
            console.error('Failed to remove:', result.error);
            alert('Failed to remove from watchlist: ' + result.error);
        }
      } else {
        const result = await addToWatchlist(symbol);
        if (result.success) {
          setIsInWatchlist(true);
        } else {
             console.error('Failed to add:', result.error);
             alert('Failed to add to watchlist: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="h-10 w-32 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />;
  }

  return (
    <button
      onClick={toggleWatchlist}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
        isInWatchlist
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
      }`}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isInWatchlist ? (
        <Check size={18} />
      ) : (
        <Plus size={18} />
      )}
      {isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
    </button>
  );
}

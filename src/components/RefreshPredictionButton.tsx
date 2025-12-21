'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import { useTransition } from 'react';
import { refreshMarketPrediction } from '@/actions/ai';
import { useRouter } from 'next/navigation';

export default function RefreshPredictionButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshMarketPrediction();
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all font-medium text-sm text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <RefreshCw size={14} className={`text-violet-600 dark:text-violet-400 ${isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
      <span>{isPending ? 'Refreshing Analysis...' : 'Regenerate Analysis'}</span>
    </button>
  );
}

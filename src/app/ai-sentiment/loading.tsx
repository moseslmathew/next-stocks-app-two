'use client';

import { Loader2, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Loading() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 min-w-[200px]">
        {/* Close/Cancel Button */}
        <button 
            onClick={() => router.back()}
            className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-105 transition-all"
            title="Cancel"
        >
            <X size={14} strokeWidth={2.5} />
        </button>

        <div className="relative mt-2">
             <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={14} className="text-violet-600/80" />
             </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
             <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Analyzing Market...</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">Processing sentiment data</p>
        </div>
        
        {/* Explicit Cancel Text Button */}
        <button 
            onClick={() => router.back()}
            className="mt-2 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-wide transition-colors"
        >
            Cancel
        </button>
      </div>
    </div>
  );
}

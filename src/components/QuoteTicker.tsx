'use client';

import { useState, useEffect } from 'react';
import { Quote, Sparkles, RefreshCw } from 'lucide-react';
import { getInvestingQuote, refreshInvestingQuote } from '@/actions/ai';

export default function QuoteTicker() {
  const [quote, setQuote] = useState<{ text: string, author: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const result = await getInvestingQuote();
      if (result.success && result.data) {
        setQuote(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
      try {
          setLoading(true);
          await refreshInvestingQuote();
          // Small delay to let revalidation propagate if needed, though usually instant for next.js tags
          await new Promise(r => setTimeout(r, 200)); 
          await fetchQuote();
      } catch (e) {
          console.error(e);
          setLoading(false);
      }
  };

  useEffect(() => {
    // Initial fetch
    fetchQuote();

    // Refresh every 10 minutes
    const interval = setInterval(fetchQuote, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!quote) return null;

  return (
    <div className="mt-8 flex justify-end animate-fade-in w-full pb-8">
        <div className="max-w-lg w-full px-4 text-right">
             <div className="flex justify-end items-center gap-2 mb-3">
                <button 
                    onClick={handleNext}
                    disabled={loading}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                    title="Next Quote"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                </button>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
                    <Sparkles size={10} className="text-violet-600 dark:text-violet-400" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-violet-700 dark:text-violet-300">Market Wisdom</span>
                </div>
            </div>
            
            <div className={`relative transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                <blockquote className="text-lg sm:text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed font-serif italic mb-2">
                    "{quote.text}"
                </blockquote>
                
                <div className="flex items-center justify-end gap-2 opacity-60">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        — {quote.author}
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
}

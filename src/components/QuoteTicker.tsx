'use client';

import { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';
import { getInvestingQuote } from '@/actions/ai';

export default function QuoteTicker() {
  const [quote, setQuote] = useState<{ text: string, author: string } | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const result = await getInvestingQuote();
        if (result.success && result.data) {
          setQuote(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error);
      }
    };

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
             <div className="flex justify-end mb-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
                    <Sparkles size={10} className="text-violet-600 dark:text-violet-400" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-violet-700 dark:text-violet-300">Market Wisdom</span>
                </div>
            </div>
            
            <div className="relative">
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

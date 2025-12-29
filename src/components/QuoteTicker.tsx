'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { getInvestingQuote, refreshInvestingQuote } from '@/actions/ai';
import { AUTHOR_IMAGES } from '@/data/quotes';

export default function QuoteTicker() {
  const [quote, setQuote] = useState<{ text: string, author: string, explanation?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [imageError, setImageError] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      setShowExplanation(false); 
      setImageError(false);
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
          setShowExplanation(false);
          setImageError(false);
          await refreshInvestingQuote();
          await new Promise(r => setTimeout(r, 200)); 
          await fetchQuote();
      } catch (e) {
          console.error(e);
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (showExplanation && explanationRef.current) {
          setTimeout(() => {
              explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }
  }, [showExplanation]);

  // If author changes, reset error too (double safety)
  useEffect(() => {
      setImageError(false);
  }, [quote?.author]);

  if (!quote) return null;

  return (
    <div className="w-full mt-4 px-2">
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-zinc-800 shadow-sm transition-all duration-500">
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Quote Content */}
                <div className={`flex-1 transition-all duration-500 ${loading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                             <Sparkles size={14} className="text-violet-500" />
                             <span className="text-xs font-semibold uppercase tracking-wider">Daily Wisdom</span>
                        </div>
                        <button 
                             onClick={handleNext}
                             disabled={loading}
                             className="text-gray-400 hover:text-violet-600 transition-colors"
                        >
                             <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    <blockquote className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-4">
                        "{quote.text}"
                    </blockquote>
                    
                    <div className="flex items-center gap-3">
                        <div className="h-px w-6 bg-gray-200 dark:bg-zinc-700" />
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            {quote.author}
                        </span>
                        
                        {!showExplanation && quote.explanation && (
                            <button 
                                onClick={() => setShowExplanation(true)}
                                className="ml-auto text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                            >
                                <Sparkles size={12} />
                                Insight
                            </button>
                        )}
                    </div>
                </div>

                {/* Explanation Card (Lighter, Integrated) */}
                {showExplanation && (
                     <div ref={explanationRef} className="w-full md:w-[400px] shrink-0 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="bg-violet-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-violet-100 dark:border-zinc-700/50 text-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-widest mb-1 block">AI Analysis</span>
                                <button onClick={() => setShowExplanation(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                {quote.explanation}
                            </p>
                             {AUTHOR_IMAGES[quote.author] && !imageError && (
                                     <div className="flex items-center gap-2 pt-2 border-t border-violet-200/50 dark:border-zinc-700/50">
                                        <div className="w-5 h-5 rounded-full overflow-hidden opacity-70">
                                            <img 
                                                src={AUTHOR_IMAGES[quote.author]} 
                                                alt={quote.author} 
                                                className="w-full h-full object-cover"
                                                onError={() => setImageError(true)}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-medium">Historical Context</span>
                                     </div>
                                )}
                        </div>
                     </div>
                )}
            </div>
        </div>
    </div>
  );
}

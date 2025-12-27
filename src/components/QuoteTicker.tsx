'use client';

import { useState, useEffect } from 'react';
import { Quote, Sparkles, RefreshCw } from 'lucide-react';
import { getInvestingQuote, refreshInvestingQuote } from '@/actions/ai';
import { AUTHOR_IMAGES } from '@/data/quotes';

export default function QuoteTicker() {
  const [quote, setQuote] = useState<{ text: string, author: string, explanation?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      setShowExplanation(false); // Reset explanation
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

                <div className="relative z-10">
                <blockquote className="text-lg sm:text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed font-serif italic mb-2">
                    "{quote.text}"
                </blockquote>
                
                <div className="flex items-center justify-end gap-2 opacity-60 mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        — {quote.author}
                    </span>
                </div>

                {quote.explanation && (
                    <div className="flex flex-col items-end gap-2">
                        {!showExplanation ? (
                            <button 
                                onClick={() => setShowExplanation(true)}
                                className="text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors border-b border-dashed border-violet-300 dark:border-violet-700 pb-0.5"
                            >
                                Know More
                            </button>
                        ) : (
                            <div className="relative overflow-hidden mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-gray-100 dark:border-zinc-800 text-left w-full animate-in slide-in-from-top-2 fade-in duration-300">
                                
                                {/* Author Watermark Image */}
                                {AUTHOR_IMAGES[quote.author] && (
                                    <div className="absolute -right-2 -bottom-2 w-24 h-24 opacity-[0.15] dark:opacity-[0.25] pointer-events-none select-none grayscale mix-blend-multiply dark:mix-blend-screen">
                                        <img 
                                            src={AUTHOR_IMAGES[quote.author]} 
                                            alt="" 
                                            className="w-full h-full object-cover object-top rounded-full blur-[0.5px]"
                                            style={{ maskImage: 'radial-gradient(circle, black 40%, transparent 80%)' }}
                                        />
                                    </div>
                                )}

                                <p className="relative z-10">{quote.explanation}</p>
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Quote, Sparkles, RefreshCw } from 'lucide-react';
import { getInvestingQuote, refreshInvestingQuote } from '@/actions/ai';
import { AUTHOR_IMAGES } from '@/data/quotes';

export default function QuoteTicker() {
  const [quote, setQuote] = useState<{ text: string, author: string, explanation?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to explanation when opened
  useEffect(() => {
      if (showExplanation && explanationRef.current) {
          setTimeout(() => {
              explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }
  }, [showExplanation]);

  if (!quote) return null;

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-10 w-full pb-6 md:pb-8 animate-fade-in pt-4 md:pt-8 mt-2 md:mt-4">
        
        {/* Quote Section */}
        <div className={`relative flex flex-col justify-start text-left shrink-0 transition-all duration-500 ease-in-out ${showExplanation ? 'w-full md:w-[45%]' : 'w-full md:max-w-2xl'}`}>
             <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50">
                    <Sparkles size={11} className="text-violet-600 dark:text-violet-400 fill-violet-600/20" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-violet-700 dark:text-violet-300">Market Wisdom</span>
                </div>
                <button 
                    onClick={handleNext}
                    disabled={loading}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all disabled:opacity-50 hover:rotate-180 duration-500"
                    title="Next Quote"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
            
            <div className={`relative transition-all duration-500 ${loading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'} min-h-[100px]`}>
                 {/* Decorative Quote Icon */}
                 <div className="absolute -top-6 -left-6 z-0 hidden md:block opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                    <Quote size={120} className="fill-current text-gray-900 dark:text-white" />
                 </div>

                <div className="relative z-10 pl-2 md:pl-0">
                    <blockquote className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed font-serif italic mb-3">
                        "{quote.text}"
                    </blockquote>
                    
                    <div className="flex items-center justify-start gap-3 mb-3">
                        <div className="h-px w-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {quote.author}
                        </span>
                    </div>

                    {quote.explanation && !showExplanation && (
                        <button 
                            onClick={() => setShowExplanation(true)}
                            className="group flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors mt-2"
                        >
                            <span>Read Insight</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Vertical Divider (Desktop Only) */}
        {quote.explanation && showExplanation && (
            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-2 self-stretch" />
        )}

        {/* Explanation Section (Side-by-Side) */}
        {quote.explanation && showExplanation && (
            <div ref={explanationRef} className="flex-1 w-full animate-in slide-in-from-right-4 fade-in duration-500">
                 <div className="relative overflow-hidden h-full text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-br from-violet-50/50 via-white/50 to-white/20 dark:from-zinc-900/80 dark:to-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/60 dark:border-white/10 shadow-lg shadow-violet-500/5 dark:shadow-black/20 text-left w-full group ring-1 ring-white/50 dark:ring-white/5 hover:ring-violet-200 dark:hover:ring-violet-800/30 transition-shadow">
                    
                    {/* Glass Reflection Gradients */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70" />
                    
                    {/* Author Watermark Image */}
                    {AUTHOR_IMAGES[quote.author] && (
                        <div className="absolute -right-2 -bottom-2 w-40 h-40 opacity-[0.08] dark:opacity-[0.12] pointer-events-none select-none grayscale mix-blend-multiply dark:mix-blend-screen transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3">
                            <img 
                                src={AUTHOR_IMAGES[quote.author]} 
                                alt="" 
                                className="w-full h-full object-cover object-top rounded-full blur-[0.5px]"
                                style={{ maskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-3 relative z-10 border-b border-gray-100/50 dark:border-gray-800/50 pb-2">
                        <div className="flex items-center gap-1.5">
                             <Sparkles size={12} className="text-violet-500 dark:text-violet-400" />
                             <h4 className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Analysis</h4>
                        </div>
                        <button onClick={() => setShowExplanation(false)} className="opacity-50 hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
                           <span className="sr-only">Close</span>
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <p className="relative z-10 font-medium leading-relaxed drop-shadow-sm">{quote.explanation}</p>
                </div>
            </div>
        )}

    </div>
  );
}

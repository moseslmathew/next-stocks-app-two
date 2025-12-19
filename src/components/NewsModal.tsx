'use client';

import React from 'react';
import { X, ExternalLink, Calendar, Search } from 'lucide-react';
import { NewsItem } from '@/actions/news';
import { useState, useEffect } from 'react';
import { analyzeSentiment, SentimentResult } from '@/actions/ai';
import { BrainCircuit } from 'lucide-react';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  newsItems: NewsItem[];
  loading: boolean;
  onSearch: (query: string) => void;
}

export function NewsModal({ isOpen, onClose, symbol, newsItems, loading, onSearch }: NewsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  React.useEffect(() => {
     setSearchQuery('');
     setSentiment(null);
  }, [isOpen, symbol]);

  useEffect(() => {
    if (isOpen && newsItems.length > 0 && !loading) {
        const analyze = async () => {
            setIsAnalyzing(true);
            const headlines = newsItems.slice(0, 10).map(i => i.title);
            const result = await analyzeSentiment(symbol, headlines);
            setSentiment(result);
            setIsAnalyzing(false);
        };
        analyze();
    }
  }, [isOpen, newsItems, loading, symbol]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          onSearch(searchQuery);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Latest News: {symbol}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
                </button>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="relative">
                <input
                    type="text"
                    placeholder={`Search news for ${symbol}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-24 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <button 
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Search
                </button>
            </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* AI Insight Card */}
          {(isAnalyzing || sentiment) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <BrainCircuit size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AI Market Sentiment</h3>
                            {isAnalyzing ? (
                                <span className="text-xs text-indigo-500 animate-pulse font-medium">Analyzing...</span>
                            ) : (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    sentiment?.sentiment === 'Bullish' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    sentiment?.sentiment === 'Bearish' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                    {sentiment?.sentiment} ({sentiment?.score}/100)
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            {isAnalyzing ? "Reading latest headlines to generate insight..." : sentiment?.summary}
                        </p>
                    </div>
                </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No news found for {symbol}.
            </div>
          ) : (
            newsItems.map((item, index) => (
              <a 
                key={index} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800 group"
              >
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {/* <span className="text-gray-300">|</span>
                            <span>{item.source}</span> */}
                        </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

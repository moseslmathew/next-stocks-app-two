'use client';

import { useState } from 'react';
import { Sparkles, X, BrainCircuit, AlertCircle } from 'lucide-react';

interface AIAnalysisModalProps {
  stockSymbol: string;
  stockName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({ stockSymbol, stockName, isOpen, onClose }: AIAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch analysis (mocked for now, can be connected to real AI action later)
  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock Response
        setAnalysis(`Based on the fundamental data for ${stockName} (${stockSymbol}), here is a brief AI assessment:

1. **Valuation**: The P/E ratio suggests the stock is trading at a premium compared to its historical average.
2. **Growth**: Revenue growth has been consistent, but profit margins are slightly compressing due to increased operational costs.
3. **Volatility**: A Beta of 1.2 indicates higher volatility than the broader market, suitable for aggressive investors.
4. **Dividend**: The yield is modest, but the payout ratio is sustainable.

**Overall Sentiment**: Hold/Accumulate for long-term growth, but watch for short-term corrections.`);
    } catch (err) {
        setError('Failed to generate analysis. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Trigger fetch when opened
  if (isOpen && !analysis && !isLoading && !error) {
      fetchAnalysis();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 border border-gray-100 dark:border-gray-800 shadow-2xl relative flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <BrainCircuit size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Fundamental Analysis</h3>
             </div>
             <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
             >
                <X size={20} />
             </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 pr-2">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Sparkles className="animate-spin text-violet-500" size={32} />
                    <p className="text-sm text-gray-500 font-medium animate-pulse">Analyzing market data...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <AlertCircle className="text-red-500" size={32} />
                    <p className="text-sm text-gray-900 dark:text-gray-100">{error}</p>
                    <button onClick={fetchAnalysis} className="text-xs text-blue-500 hover:underline">Try Again</button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-violet-100 dark:border-violet-800">
                         <div className="flex gap-3">
                             <Sparkles className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" size={18} />
                             <div className="space-y-1">
                                 <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-100">AI Summary</h4>
                                 <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                                     Based on the fundamental data for <span className="font-semibold">{stockName}</span> ({stockSymbol}), the overall sentiment is <span className="font-bold">Cautiously Optimistic</span>.
                                 </p>
                             </div>
                         </div>
                    </div>

                    <div className="grid gap-3">
                        {[
                            { title: 'Valuation', content: 'The P/E ratio suggests the stock is trading at a premium compared to its historical average.', type: 'neutral' },
                            { title: 'Growth', content: 'Revenue growth has been consistent, but profit margins are slightly compressing due to increased operational costs.', type: 'warning' },
                            { title: 'Volatility', content: 'A Beta of 1.2 indicates higher volatility than the broader market, suitable for aggressive investors.', type: 'info' },
                            { title: 'Dividend', content: 'The yield is modest, but the payout ratio is sustainable.', type: 'success' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                <div className={`w-1 self-stretch rounded-full shrink-0 ${
                                    item.type === 'success' ? 'bg-green-500' : 
                                    item.type === 'warning' ? 'bg-amber-500' : 
                                    item.type === 'neutral' ? 'bg-gray-400 dark:bg-gray-600' : 'bg-blue-500'
                                }`} />
                                <div>
                                    <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.title}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left">{item.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-wide font-medium">
                            Disclaimer: AI-generated analysis. Not financial advice.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

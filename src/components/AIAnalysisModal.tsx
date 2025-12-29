'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, BrainCircuit, AlertCircle, Scale } from 'lucide-react';
import { analyzeStockFundamentals } from '@/actions/ai';

interface StockData {
    price?: number;
    marketCap?: number;
    peRatio?: number;
    eps?: number;
    beta?: number;
    dividendYield?: number;
    profitMargins?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    financials?: any; // Allow full financials to be passed
    currency?: string;
}

interface AIAnalysisModalProps {
  stockSymbol: string;
  stockName: string;
  stockData: StockData;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({ stockSymbol, stockName, stockData, isOpen, onClose }: AIAnalysisModalProps) {
  const [analysisItems, setAnalysisItems] = useState<{ title: string; content: string; type: string }[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ totalTokens: number } | undefined>(undefined);
  const [model, setModel] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const result = await analyzeStockFundamentals(stockSymbol, stockName, stockData);
        
        if (result.success) {
            setAnalysisItems(result.data.insights);
            setVerdict(result.data.verdict);
            setUsage(result.data.usage);
            setModel(result.data.model);
        } else {
            setError(result.error);
        }
    } catch (err) {
        setError('Failed to generate analysis. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Trigger fetch when opened
  useEffect(() => {
    if (isOpen && analysisItems.length === 0 && !isLoading && !error) {
        fetchAnalysis();
    }
  }, [isOpen]); // Depend only on isOpen to trigger initially, internal checks prevent loops

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
                                     Based on the fundamental data for <span className="font-semibold">{stockName}</span> ({stockSymbol}), we have generated the following insights.
                                 </p>
                             </div>
                         </div>
                    </div>

                    {verdict && (
                         <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                             <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white font-bold">
                                 <Scale size={18} className="text-violet-500" />
                                 Final Verdict
                             </div>
                             <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                 {verdict}
                             </p>
                         </div>
                    )}

                    <div className="grid gap-3">
                        {analysisItems.map((item, idx) => (
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

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-wide font-medium">
                            Disclaimer: AI-generated analysis based on available data. Not financial advice.
                        </p>
                        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 font-mono">
                            {model && <span>Model: {model}</span>}
                            {usage && <span>Tokens: {usage.totalTokens}</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

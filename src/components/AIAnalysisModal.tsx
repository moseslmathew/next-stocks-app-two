'use client';

import { useState } from 'react';
import { Sparkles, X, BrainCircuit, AlertCircle } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = () => {
       const items = [];
       
       // Valuation
       if (stockData.peRatio) {
           if (stockData.peRatio < 0) {
              items.push({ title: 'Valuation', content: 'The company currently has negative earnings (P/E < 0), indicating it is not profitable at the moment.', type: 'warning' });
           } else if (stockData.peRatio > 30) {
              items.push({ title: 'Valuation', content: `A P/E ratio of ${stockData.peRatio.toFixed(2)} suggests the stock is trading at a premium, implying high growth expectations.`, type: 'neutral' });
           } else {
              items.push({ title: 'Valuation', content: `The P/E ratio of ${stockData.peRatio.toFixed(2)} appears reasonable for the current market conditions.`, type: 'success' });
           }
       } else {
           items.push({ title: 'Valuation', content: 'P/E ratio data is unavailable, making traditional valuation difficult.', type: 'neutral' });
       }

       // Volatility
       if (stockData.beta) {
            if (stockData.beta > 1.2) {
                items.push({ title: 'Volatility', content: `With a Beta of ${stockData.beta.toFixed(2)}, this stock is significantly more volatile than the market.`, type: 'warning' });
            } else if (stockData.beta < 0.8) {
                items.push({ title: 'Volatility', content: `A Beta of ${stockData.beta.toFixed(2)} indicates this stock is less volatile and more stable than the broader market.`, type: 'success' });
            } else {
                items.push({ title: 'Volatility', content: `The stock moves generally in line with the market (Beta: ${stockData.beta.toFixed(2)}).`, type: 'neutral' });
            }
       }

       // Dividend
       if (stockData.dividendYield && stockData.dividendYield > 0) {
           items.push({ title: 'Dividend', content: `The company pays a dividend with a yield of ${(stockData.dividendYield * 100).toFixed(2)}%, providing income to shareholders.`, type: 'success' });
       } else {
           items.push({ title: 'Dividend', content: 'This company does not currently pay a dividend, focusing reinvestment into growth or operations.', type: 'neutral' });
       }

       // Profitability
       if (stockData.profitMargins) {
           if (stockData.profitMargins > 0.2) {
               items.push({ title: 'Profitability', content: `Strong profit margins of ${(stockData.profitMargins * 100).toFixed(2)}% demonstrate efficient operations.`, type: 'success' });
           } else if (stockData.profitMargins < 0) {
               items.push({ title: 'Profitability', content: `Negative profit margins (${(stockData.profitMargins * 100).toFixed(2)}%) indicate the company is operating at a loss.`, type: 'warning' });
           } else {
               items.push({ title: 'Profitability', content: `Profit margins are stable at ${(stockData.profitMargins * 100).toFixed(2)}%.`, type: 'neutral' });
           }
       } else {
            // Fallback for profitability if margin missing but EPS exists
            if (stockData.eps && stockData.eps < 0) {
                 items.push({ title: 'Profitability', content: `Negative EPS (${stockData.eps.toFixed(2)}) indicates the company is not currently profitable.`, type: 'warning' });
            }
       }
       
       setAnalysisItems(items);
  };

  // Function to fetch analysis (mocked for now, can be connected to real AI action later)
  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        generateAnalysis();
    } catch (err) {
        setError('Failed to generate analysis. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Trigger fetch when opened
  if (isOpen && analysisItems.length === 0 && !isLoading && !error) {
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
                                     Based on the fundamental data for <span className="font-semibold">{stockName}</span> ({stockSymbol}), we have generated the following insights.
                                 </p>
                             </div>
                         </div>
                    </div>

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

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-wide font-medium">
                            Disclaimer: AI-generated analysis based on available data. Not financial advice.
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

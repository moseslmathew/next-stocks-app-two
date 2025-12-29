'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import SentimentView from './SentimentView';
import RefreshPredictionButton from './RefreshPredictionButton';
import { MarketPrediction } from '@/actions/ai';

interface SentimentDashboardProps {
  indiaData: { success: boolean, data?: MarketPrediction, error?: string, isQuotaExceeded?: boolean };
  usData: { success: boolean, data?: MarketPrediction, error?: string, isQuotaExceeded?: boolean };
}

export default function SentimentDashboard({ indiaData, usData }: SentimentDashboardProps) {
  const [region, setRegion] = useState<'INDIA' | 'US'>('INDIA');

  const activeData = region === 'INDIA' ? indiaData : usData;

  return (
    <div>
        {/* Header with Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
            <div className="flex flex-col items-start gap-4">
                 <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-[10px] font-bold tracking-wider uppercase mb-2">
                    <Brain size={10} />
                    <span>Tensor Core</span>
                </div>
                
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                            Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Sentiment</span>
                        </h1>
                         <RefreshPredictionButton minimal />
                    </div>

                    {/* Region Tabs */}
                    <div className="flex p-1.5 bg-gray-100/80 dark:bg-zinc-800/80 rounded-full border border-gray-200/50 dark:border-zinc-700/50 backdrop-blur-sm">
                        <button
                            onClick={() => setRegion('INDIA')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                                region === 'INDIA' 
                                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <span className="text-base">🇮🇳</span> India
                        </button>
                        <button
                            onClick={() => setRegion('US')}
                             className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                                region === 'US' 
                                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                             <span className="text-base">🇺🇸</span> US Market
                        </button>
                    </div>
                </div>

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-lg">
                    Predictive outlook for the {region === 'INDIA' ? 'Indian' : 'US'} session based on real-time news & data.
                </p>
            </div>
        </div>

        <div key={region} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <SentimentView 
                prediction={activeData.success ? activeData.data! : null} 
                error={activeData.error}
                isQuotaExceeded={activeData.isQuotaExceeded}
            />
        </div>
    </div>
  );
}

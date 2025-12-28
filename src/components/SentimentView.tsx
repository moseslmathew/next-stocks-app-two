'use Market Prediction';

import { MarketPrediction } from '@/actions/ai';
import { Activity, AlertCircle, Brain, CalendarClock, Landmark, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface SentimentViewProps {
  prediction: MarketPrediction | null;
  error?: string;
  isQuotaExceeded?: boolean;
}

export default function SentimentView({ prediction, error, isQuotaExceeded }: SentimentViewProps) {
  // Visual constants logic
  let sentimentColor = 'text-gray-500';
  let sentimentBg = 'bg-gray-100 dark:bg-gray-800';
  let sentimentIcon = <Minus className="w-8 h-8" />;

  if (prediction) {
    // Logic based on explicit sentiment text first, then fallback to score
    const isBullish = prediction.sentiment === 'Bullish';
    const isBearish = prediction.sentiment === 'Bearish';

    if (isBullish) {
        sentimentColor = 'text-green-600 dark:text-green-400';
        sentimentBg = 'bg-green-50 dark:bg-green-900/20';
        sentimentIcon = <TrendingUp className="w-8 h-8" />;
    } else if (isBearish) {
        sentimentColor = 'text-red-600 dark:text-red-400';
        sentimentBg = 'bg-red-50 dark:bg-red-900/20';
        sentimentIcon = <TrendingDown className="w-8 h-8" />;
    } else {
        sentimentColor = 'text-amber-600 dark:text-amber-400';
        sentimentBg = 'bg-amber-50 dark:bg-amber-900/20';
        sentimentIcon = <Activity className="w-8 h-8" />;
    }
  }

  if (!prediction) {
    return (
         // Error Display (Quota or Generic)
         <div className="bg-white dark:bg-gray-900 rounded-2xl p-16 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none text-center animate-fade-in">
            {isQuotaExceeded ? (
                <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI Quota Limit Exceeded</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        The AI usage limit has been reached for now. <br/>
                        Please try again later.
                    </p>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                         <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Analysis Unavailable</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        {error || "Could not generate AI prediction at this time."} <br/>
                        Please try again later.
                    </p>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Main Score Card */}
            <div className="lg:col-span-2 relative overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none flex flex-col justify-between group">
                
                {/* Ambient Background Glow */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-10 dark:opacity-20 transition-colors duration-500 ${sentimentColor.replace('text-', 'bg-')}`} />

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">
                                Market Signal
                            </h2>
                            <div className={`text-4xl sm:text-5xl font-black tracking-tight ${sentimentColor} drop-shadow-sm`}>
                                {prediction.sentiment}
                            </div>
                        </div>
                        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${sentimentBg} ${sentimentColor} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5`}>
                            {sentimentIcon}
                        </div>
                    </div>
                    
                    {/* Modern Gauge/Meter */}
                    <div className="mt-auto">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-3 tracking-wider">
                            <span>Bearish</span>
                            <span>Neutral</span>
                            <span>Bullish</span>
                        </div>
                        
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                            {/* Gradient Track */}
                            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-red-500 via-amber-400 to-green-500" />
                            
                            {/* Active Bar */}
                            <div 
                                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500 transition-all duration-1000 ease-out relative"
                                style={{ width: `${prediction.score}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-px bg-white/60 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                                <span className="text-xs font-medium text-gray-400">Confidence Score</span>
                                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                                {prediction.score}<span className="text-gray-300 dark:text-gray-600">/100</span>
                                </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Text Card */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col relative overflow-hidden group hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <Brain size={140} className="transform rotate-12" />
                    </div>
                <h3 className="relative z-10 text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                        <Activity size={18} />
                    </span>
                    AI Outlook Analysis
                </h3>
                <div className="relative z-10 flex-1 flex items-center">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg md:text-xl font-medium">
                        "{prediction.outlook}"
                    </p>
                </div>
            </div>
        </div>

        {/* Factors Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-violet-600 rounded-full inline-block"></span>
                Key Driver Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {prediction.factors.map((factor, i) => (
                    <div key={i} className="group relative p-5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-4 right-4 text-6xl font-black text-gray-100 dark:text-gray-800 group-hover:text-gray-50 dark:group-hover:text-gray-700/50 transition-colors select-none -z-0">
                            {i + 1}
                        </div>
                        <div className="relative z-10 flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                                {i + 1}
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                                {factor}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

         {/* New Strategic Context Section */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
            
            {/* Seasonality Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg shadow-amber-500/5 hover:border-amber-200 dark:hover:border-amber-900/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                        <CalendarClock size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Historical Seasonality</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {prediction.seasonality || "Historical seasonal trend analysis is currently unavailable. Please regenerate the analysis."}
                </p>
            </div>

            {/* Macro Policy Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg shadow-emerald-500/5 hover:border-emerald-200 dark:hover:border-emerald-900/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                        <Landmark size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Central Bank & Macro Policy</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {prediction.centralBankAnalysis || "Macro-economic policy analysis is currently unavailable. Please regenerate the analysis."}
                </p>
            </div>
        </div>

        {/* Model & Usage Stats (if available) */}
        {(prediction.model || prediction.usage) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400 dark:text-gray-500 animate-fade-in" style={{ animationDelay: '400ms' }}>
                {prediction.model && (
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Model</span>
                        <span className="font-mono font-bold text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-2.5">{prediction.model}</span>
                    </div>
                )}
                {prediction.usage && (
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Tokens Used</span>
                        <span className="font-mono font-bold text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-2.5">{prediction.usage.totalTokens}</span>
                    </div>
                )}
            </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 italic opacity-80">
            Disclaimer: This analysis is generated by AI ({prediction?.model || 'Artificial Intelligence'}) based on realtime news and market data. 
            It is for informational purposes only and does not constitute financial advice.
        </div>
    </div>
  );
}

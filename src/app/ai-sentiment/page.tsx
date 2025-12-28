import { getMarketPrediction } from '@/actions/ai';
import RefreshPredictionButton from '@/components/RefreshPredictionButton';
import { Brain, TrendingUp, TrendingDown, Minus, Activity, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'AI Market Sentiment - Tensor Terminal',
  description: 'AI-powered probability analysis for the next trading session.',
};

export default async function AISentimentPage() {
  const result = await getMarketPrediction();

  // If successful, prepare visual constants
  let sentimentColor = 'text-gray-500';
  let sentimentBg = 'bg-gray-100 dark:bg-gray-800';
  let sentimentIcon = <Minus className="w-8 h-8" />;

  const prediction = result.success ? result.data : null;

  if (prediction) {
    if (prediction.score > 60) {
        sentimentColor = 'text-green-600 dark:text-green-400';
        sentimentBg = 'bg-green-50 dark:bg-green-900/20';
        sentimentIcon = <TrendingUp className="w-8 h-8" />;
    } else if (prediction.score < 40) {
        sentimentColor = 'text-red-600 dark:text-red-400';
        sentimentBg = 'bg-red-50 dark:bg-red-900/20';
        sentimentIcon = <TrendingDown className="w-8 h-8" />;
    } else {
        sentimentColor = 'text-amber-600 dark:text-amber-400';
        sentimentBg = 'bg-amber-50 dark:bg-amber-900/20';
        sentimentIcon = <Activity className="w-8 h-8" />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Helper Header - Always Visible */}
        {/* Helper Header - Compact */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
            <div>
                 <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} className="text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Tensor AI Analysis</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Market Sentiment Outlook
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                    AI prediction for the next trading session based on real-time data & news.
                </p>
            </div>
            <div className="shrink-0">
                <RefreshPredictionButton />
            </div>
        </div>

        {/* Content Area */}
        {prediction ? (
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                    {/* Main Score Card */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors duration-300">
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${sentimentColor.replace('text-', 'bg-')}`} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className={`relative z-10 p-5 rounded-full ${sentimentBg} ${sentimentColor} mb-6 ring-1 ring-inset ring-black/5 dark:ring-white/5`}>
                            {sentimentIcon}
                        </div>
                        
                        <h2 className="relative z-10 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                            Market Signal
                        </h2>
                        <div className={`relative z-10 text-5xl sm:text-6xl font-black ${sentimentColor} mb-6 tracking-tight`}>
                            {prediction.sentiment}
                        </div>
                        
                        {/* Custom Meter */}
                        <div className="relative z-10 w-full max-w-[240px]">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">
                                <span>Bear</span>
                                <span>Neutral</span>
                                <span>Bull</span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/5 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-amber-400 to-green-500 opacity-20 dark:opacity-30" />
                                <div 
                                    className="absolute top-0 bottom-0 w-1.5 bg-white dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] transform -translate-x-1/2 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                                    style={{ left: `${prediction.score}%` }}
                                >
                                    <div className={`absolute -top-1 -bottom-1 -left-1 -right-1 rounded-full ${sentimentColor.replace('text-', 'bg-')} opacity-50 blur-sm`} /> 
                                </div>
                                <div 
                                    className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-red-500 via-amber-500 to-green-500 opacity-80"
                                    style={{ width: `${prediction.score}%` }}
                                />
                            </div>
                            <div className="text-center mt-3 font-mono text-xs font-medium text-gray-400">
                                Score: <span className={sentimentColor}>{prediction.score}</span>/100
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
            </div>
        ) : (
             // Error Display (Quota or Generic)
             <div className="bg-white dark:bg-gray-900 rounded-2xl p-16 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none text-center animate-fade-in">
                {!result.success && result.isQuotaExceeded ? (
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
                            Could not generate AI prediction at this time. <br/>
                            Please try again later.
                        </p>
                    </div>
                )}
            </div>
        )}
        
        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 italic opacity-80">
            Disclaimer: This analysis is generated by AI ({prediction?.model || 'Artificial Intelligence'}) based on realtime news and market data. 
            It is for informational purposes only and does not constitute financial advice.
        </div>
      </div>
    </div>
  );
}

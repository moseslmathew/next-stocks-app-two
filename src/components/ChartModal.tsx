import React from 'react';
import { X, BarChart2, Loader2, RotateCcw } from 'lucide-react';
import { getWatchlistData } from '@/actions/market';
import { TradingViewChart, TradingViewChartHandle } from './TradingViewChart';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  priceData: number[];
  volumeData: number[];
  timestamps: number[];
  color?: string;
  range?: '1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '5y' | 'max';
  hideActiveVolume?: boolean;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

export function ChartModal({ isOpen, onClose, symbol, priceData, volumeData, timestamps, range = '1d', hideActiveVolume = false, currentPrice: propCurrentPrice, change: propChange, changePercent: propChangePercent }: ChartModalProps) {
  const [activeRange, setActiveRange] = React.useState<'1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '5y' | 'max'>(range);
  const [internalData, setInternalData] = React.useState<{ price: number[], volume: number[], timestamps: number[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeData, setActiveData] = React.useState<{ price: number, volume: number, timestamp: number } | null>(null);
  const [showVolume, setShowVolume] = React.useState(true);
  const chartRef = React.useRef<TradingViewChartHandle>(null);

  // Sync activeRange with prop when modal opens/prop changes
  React.useEffect(() => {
    setActiveRange(range);
    setInternalData(null);
  }, [range, symbol, isOpen]);

  // Use either internal fetched data or initial props
  const currentPriceData = internalData?.price || priceData;
  const currentVolumeData = internalData?.volume || volumeData;
  const currentTimestamps = internalData?.timestamps || timestamps;

  // Handle range switching
  React.useEffect(() => {
    if (!isOpen) return;
    if (activeRange === range && !internalData) {
        return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await getWatchlistData([symbol], activeRange);
            if (result && result.length > 0) {
                const stock = result[0];
                setInternalData({
                    price: stock.sparkline,
                    volume: stock.volumeSparkline,
                    timestamps: stock.timestamps
                });
            }
        } catch (error) {
            console.error('Failed to fetch modal data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (activeRange !== range || (activeRange === range && internalData)) {
        fetchData();
    }
  }, [activeRange, symbol, range, isOpen]);

  const referencePrice = React.useMemo(() => {
      if (activeRange === '1d' && propCurrentPrice !== undefined && propChange !== undefined) {
          return propCurrentPrice - propChange;
      }
      return undefined;
  }, [activeRange, propCurrentPrice, propChange]);

  const latestData = React.useMemo(() => {
     if (currentPriceData.length === 0) return null;
     return {
        price: currentPriceData[currentPriceData.length - 1],
        volume: currentVolumeData[currentVolumeData.length - 1] || 0,
        timestamp: currentTimestamps[currentTimestamps.length - 1]
     };
  }, [currentPriceData, currentVolumeData, currentTimestamps]);

  const isPositive = React.useMemo(() => {
      // For 1D, match the main indicator (Change vs Prev Close)
      if (activeRange === '1d' && propChange !== undefined) {
          return propChange >= 0;
      }
      // For other ranges, compare Last vs First point
      if (currentPriceData.length > 0) {
          return currentPriceData[currentPriceData.length - 1] >= currentPriceData[0];
      }
      return true;
  }, [activeRange, propChange, currentPriceData]);

  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  const handleCursorUpdate = React.useCallback((data: any) => {
    setActiveData(data);
  }, []);

  // Format data for TradingView (requires seconds)
  const { tvPriceData, tvVolumeData } = React.useMemo(() => {
    const tvPriceData = currentPriceData.map((price, i) => ({
      time: Math.floor((currentTimestamps[i] || Date.now()) / 1000),
      value: price,
    }));

    const tvVolumeData = currentVolumeData.map((volume, i) => ({
      time: Math.floor((currentTimestamps[i] || Date.now()) / 1000),
      value: volume,
      color: (i > 0 && currentPriceData[i] >= currentPriceData[i - 1]) ? '#22c55e' : '#ef4444',
    }));
    
    // Ensure unique timestamps just in case (filter if multiple checks needed, but assuming unique)
    // Lightweight charts might crash on duplicates.
    // Ideally we filter out duplicates.
    const uniqueMap = new Map();
    tvPriceData.forEach(d => uniqueMap.set(d.time, d));
    const uniquePrice = Array.from(uniqueMap.values());
    
    const uniqueVolMap = new Map();
    tvVolumeData.forEach(d => uniqueVolMap.set(d.time, d));
    const uniqueVol = Array.from(uniqueVolMap.values());

    return { tvPriceData: uniquePrice, tvVolumeData: uniqueVol };

  }, [currentPriceData, currentVolumeData, currentTimestamps]);

  if (!isOpen) return null;


  
  const displayData = activeData || latestData || { price: 0, volume: 0, timestamp: 0 };
  
  const formatDate = (val: number) => {
      if (!val) return '';
      const date = new Date(val);
      if (activeRange === '1d' || activeRange === '1w') {
          return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentPrice = activeData ? activeData.price : (propCurrentPrice ?? (latestData?.price || 0));
  const startPrice = currentPriceData.length > 0 ? currentPriceData[0] : 0;
  
  let change: number, changePercent: number;

  if (activeData) {
      change = activeData.price - startPrice;
      changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  } else {
      if (propChange !== undefined && propChangePercent !== undefined) {
          change = propChange;
          changePercent = propChangePercent;
      } else {
          change = currentPrice - startPrice;
          changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
      }
  }

  const isCurrentlyPositive = change >= 0;
  
  // Display timestamp logic
  const displayTimestamp = activeData ? activeData.timestamp : (latestData?.timestamp || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl border-t sm:border border-gray-200 dark:border-white/10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-500 ease-out h-[85dvh] sm:h-[90vh] flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center py-4">
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>

        <div className="px-6 sm:px-10 pb-4 sm:py-8 flex-1 overflow-hidden flex flex-col">
            {/* Header / Controls Row */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {symbol}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white shrink-0">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Price & Primary Info Block */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 mb-8 items-end">
                <div className="md:col-span-5">
                    <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-4xl sm:text-5xl font-mono font-black text-gray-900 dark:text-white tracking-tighter">
                            {currentPrice.toFixed(2)}
                        </span>
                        <div className={`flex items-center text-sm sm:text-lg font-bold ${isCurrentlyPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isCurrentlyPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                        {!activeData && 'Last Traded • '} {propCurrentPrice && !activeData ? 'Live' : formatDate(displayTimestamp)}
                    </p>
                </div>

                {!hideActiveVolume && (
                    <div className="md:col-span-4 border-l border-gray-100 dark:border-white/5 pl-6 hidden md:block">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                            Active Volume
                        </span>
                        <div className="text-xl font-mono font-bold text-gray-700 dark:text-gray-300">
                            {activeData ? activeData.volume?.toLocaleString() : '--'}
                        </div>
                    </div>
                )}
            </div>

            {/* Range & Volume Controls - Moved Below Price */}
            <div className="flex justify-between mb-6 w-full">
                 <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-xl border border-gray-200 dark:border-white/10 w-full">
                        {/* Range Selectors */}
                        <div className="flex items-center justify-between gap-0.5 sm:gap-1 overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {[
                                { label: '1D', value: '1d' },
                                { label: '1W', value: '1w' },
                                { label: '1M', value: '1m' },
                                { label: '3M', value: '3m' },
                                { label: '1Y', value: '1y' },
                                { label: '2Y', value: '2y' },
                                { label: '5Y', value: '5y' },
                                { label: 'All', value: 'max' },
                            ].map((r) => (
                                <button 
                                    key={r.value}
                                    onClick={(e) => { e.stopPropagation(); setActiveRange(r.value as any); }}
                                    className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                                        activeRange === r.value 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                         <div className="w-px h-4 bg-gray-300 dark:bg-white/20 mx-1" />

                         <button 
                            onClick={(e) => { e.stopPropagation(); chartRef.current?.resetChart(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
                            title="Reset Chart Zoom"
                        >
                            <RotateCcw size={14} />
                            <span className="hidden sm:inline">Reset</span>
                        </button>

                         <button 
                            onClick={(e) => { e.stopPropagation(); setShowVolume(!showVolume); }}
                            className={`p-1.5 rounded-lg transition-all ${showVolume ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Toggle Volume"
                        >
                            <BarChart2 size={16} />
                        </button>
                    </div>
            </div>

            <div className="flex-1 min-h-0 w-full px-2 sm:px-6 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-[1px] animate-in fade-in duration-200">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                    </div>
                )}
                <TradingViewChart 
                    ref={chartRef}
                    data={tvPriceData}
                    volumeData={tvVolumeData}
                    chartColor={chartColor}
                    showVolume={showVolume}
                    referencePrice={referencePrice}
                    visibleRange={activeRange}
                    onCrosshairMove={handleCursorUpdate}
                />
            </div>
            </div>
      </div>
    </div>
  );
}

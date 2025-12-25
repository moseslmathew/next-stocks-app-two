import React from 'react';
import { X, BarChart2, Loader2, RotateCcw, MousePointer, BoxSelect, HelpCircle, Activity, History } from 'lucide-react';
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
  const [internalData, setInternalData] = React.useState<{ price: number[], volume: number[], timestamps: number[], quoteType?: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeData, setActiveData] = React.useState<{ price: number, volume: number, timestamp: number, x?: number, y?: number } | null>(null);
  const [showVolume, setShowVolume] = React.useState(true);
  const [selectionMode, setSelectionMode] = React.useState<'point' | 'area'>('point');
  const [selectionStats, setSelectionStats] = React.useState<{ change: number; percent: number; startTime: number; endTime: number } | null>(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const chartRef = React.useRef<TradingViewChartHandle>(null);

  // Sync activeRange with prop when modal opens/prop changes
  React.useEffect(() => {
    setActiveRange(range);
    setInternalData(null);
  }, [range, symbol, isOpen]);



  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Use either internal fetched data or initial props
  const currentPriceData = internalData?.price || priceData;
  const currentVolumeData = internalData?.volume || volumeData;
  const currentTimestamps = internalData?.timestamps || timestamps;

  // Handle range switching
  React.useEffect(() => {
    if (!isOpen) return;
    // If 1d, always fetch to get extended history (props only have simple 1d)
    if (activeRange === range && !internalData && activeRange !== '1d') {
        return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch extended history for 1d to allow scrolling back
            const keepHistory = activeRange === '1d';
            const result = await getWatchlistData([symbol], activeRange, keepHistory);
            if (result && result.length > 0) {
                const stock = result[0];
                setInternalData({
                    price: stock.sparkline,
                    volume: stock.volumeSparkline,
                    timestamps: stock.timestamps,
                    quoteType: stock.quoteType
                });
            }
        } catch (error) {
            console.error('Failed to fetch modal data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (activeRange !== range || (activeRange === range && internalData) || activeRange === '1d') {
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

  // Calculate initial visible range for 1D view
  // Calculate initial visible range for 1D view
  const initialVisibleRange = React.useMemo(() => {
     if (activeRange !== '1d' || tvPriceData.length === 0) return undefined;

     const lastPoint = tvPriceData[tvPriceData.length - 1];
     let startIndex = 0;
     const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol === '^NSEI' || symbol === '^BSESN';

     // STRATEGY: Find the True Session Start (09:15 IST or 09:30 US Local)
     // 1. Overnight Gap Detection: This is the most robust way to find the session boundary.
     //    Find the last gap > 30 minutes.
     let foundGap = false;
     for (let i = tvPriceData.length - 1; i > 0; i--) {
        if (tvPriceData[i].time - tvPriceData[i - 1].time > 1800) {
            startIndex = i;
            foundGap = true;
            break;
        }
     }
     if (!foundGap) startIndex = 0; // If no gap, assume start of data is session start (unlikely for 7d history but safe fallback)

     // 2. Filter Pre-Market Data (Crucial for US Stocks where data starts at 4:00 AM)
     if (!isIndian) {
         // US Market Open is 13:30 UTC (Summer) or 14:30 UTC (Winter).
         // We must strictly filter out pre-market data (< 9:30 AM) to match user request.
         const month = new Date().getMonth();
         const isSummer = month > 2 && month < 10; 
         const marketOpenHour = isSummer ? 13 : 14;

         let currentP = startIndex;
         while (currentP < tvPriceData.length - 1) {
             const d = new Date(tvPriceData[currentP].time * 1000);
             const h = d.getUTCHours();
             const m = d.getUTCMinutes();
             
             // Skip if before Market Open Hour
             if (h < marketOpenHour) {
                 currentP++;
                 continue;
             }
             // Skip if in Market Open Hour but minutes < 30
             if (h === marketOpenHour && m < 30) {
                 currentP++;
                 continue;
             }
             // If we reach here, we are >= 9:30 AM
             break;
         }
         startIndex = currentP;
     }

     const startPoint = tvPriceData[startIndex];

     // 3. Crypto Exception: Continuous trading, just show last 5 hours window
     const quoteType = internalData?.quoteType;
     if (quoteType === 'CRYPTOCURRENCY' || quoteType === 'CRYPTO') {
          return { from: startPoint.time, to: lastPoint.time + 300 };
     }

     // 4. Canonical Axis Alignment (User Request: Consistent Time Lines)
     // Snap the chart Start to exact 09:15:00 or 09:30:00 to ensure grid lines (hours) align perfectly across all charts.
     const startObj = new Date(startPoint.time * 1000);
     if (isIndian) {
         startObj.setUTCMinutes(15);
     } else {
         startObj.setUTCMinutes(30);
     }
     startObj.setUTCSeconds(0);
     const canonicalStart = Math.floor(startObj.getTime() / 1000);

     // 5. Fixed Session Duration (User Request: Divide axis equally)
     const duration = isIndian ? 22500 : 23400; // 6h 15m or 6h 30m

     return { from: canonicalStart, to: canonicalStart + duration };
  }, [activeRange, tvPriceData, internalData, symbol]);

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

  // Fixed Header Logic (Ignore Hover)
  const currentPrice = propCurrentPrice ?? (latestData?.price || 0);
  const startPrice = currentPriceData.length > 0 ? currentPriceData[0] : 0;
  
  let change: number, changePercent: number;

  if (activeRange === '1d' && propChange !== undefined && propChangePercent !== undefined) {
      change = propChange;
      changePercent = propChangePercent;
  } else {
      change = currentPrice - startPrice;
      changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  }

  const isCurrentlyPositive = change >= 0;
  
  // Display timestamp logic
  const displayTimestamp = activeData ? activeData.timestamp : (latestData?.timestamp || 0);



  const formatDuration = (start: number, end: number) => {
      const diff = end - start;
      if (diff < 86400) {
           return `${new Date(start * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(end * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      }
      const days = Math.round(diff / 86400);
      if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
      const months = Math.floor(days / 30); 
      if (months < 12) return `${months} mo ${days % 30 > 0 ? `${days % 30} d` : ''}`;
      const years = Math.floor(months / 12);
      return `${years} yr ${months % 12 > 0 ? `${months % 12} mo` : ''}`;
  };

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

        <div className="px-1 sm:px-10 pb-4 sm:py-8 flex-1 overflow-hidden flex flex-col">
            {/* Header / Controls Row */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 px-2">
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

            {/* Primary Info Block (Price + Active Volume) */}
            <div className="flex items-end justify-between px-2 mb-6">
                {/* Price */}
                <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                        {/* Main Price (Always Visible) */}
                        <span className="text-4xl sm:text-5xl font-mono font-black text-gray-900 dark:text-white tracking-tighter">
                            {currentPrice.toFixed(2)}
                        </span>
                        
                        {/* Change Indicator (Always Daily/Active) */}
                         <div className={`flex items-center text-sm sm:text-lg font-bold ${isCurrentlyPositive ? 'text-green-500' : 'text-red-500'}`}>
                             {isCurrentlyPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                         </div>

                        {/* Time Label */}
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {latestData?.timestamp ? `• ${formatDate(latestData.timestamp)}` : ''}
                        </span>
                    </div>

                    {/* Selection Stats (Separate) */}
                    {selectionStats && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg px-2 py-1.5 w-fit animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Selected:</span>
                            <div className={`flex items-center text-xs sm:text-sm font-bold ${selectionStats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {selectionStats.change >= 0 ? '+' : ''}{selectionStats.change.toFixed(2)} ({selectionStats.change >= 0 ? '+' : ''}{selectionStats.percent.toFixed(2)}%)
                            </div>
                            <span className="text-xs text-gray-400">• {formatDuration(selectionStats.startTime, selectionStats.endTime)}</span>
                        </div>
                    )}
                </div>

                {/* Active Volume (Desktop Only) */}
                {!hideActiveVolume && (
                    <div className="border-l border-gray-100 dark:border-white/5 pl-6 hidden md:block mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                            Active Volume
                        </span>
                        <div className="text-xl font-mono font-bold text-gray-700 dark:text-gray-300">
                            {displayData.volume ? displayData.volume.toLocaleString() : '--'}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Row (Below Price) */}
            <div className="flex flex-row flex-nowrap items-center justify-between sm:justify-start gap-1.5 sm:gap-2 w-full px-2 mb-6 sm:mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  {/* Range Selectors */}
                  <div className="flex shrink-0 bg-gray-100 dark:bg-white/5 p-0.5 sm:p-1 rounded-xl">
                      {(['1d', '1w', '1m', '3m', '1y', '5y', 'max'] as const).map((r) => (
                          <button
                              key={r}
                              onClick={(e) => { e.stopPropagation(); setActiveRange(r); }}
                              className={`
                                  px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap
                                  ${activeRange === r 
                                      ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
                              `}
                          >
                              {r === 'max' ? 'ALL' : r.toUpperCase()}
                          </button>
                      ))}
                  </div>

                   <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                       {/* Selection Mode Toggle */}
                       <div className="flex shrink-0 bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg border border-gray-200 dark:border-white/10">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectionMode('point'); }}
                                className={`p-1 sm:p-1.5 rounded-md transition-all ${selectionMode === 'point' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Point Selection"
                            >
                                <MousePointer size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectionMode('area'); }}
                                className={`p-1 sm:p-1.5 rounded-md transition-all ${selectionMode === 'area' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Area Selection"
                            >
                                <BoxSelect size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                       </div>

                       {/* Volume Toggle */}
                       <button 
                          onClick={(e) => { e.stopPropagation(); setShowVolume(!showVolume); }}
                          className={`
                              flex shrink-0 items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all border
                              ${showVolume 
                                  ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' 
                                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}
                          `}
                      >
                          <BarChart2 size={14} className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Volume</span>
                      </button>

                       {/* Help Toggle */}
                       <button 
                          onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                          className="flex shrink-0 items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10"
                          title="Chart Guide"
                      >
                          <HelpCircle size={14} className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                      </button>
                   </div>
            </div>

            <div className="flex-1 w-full bg-transparent relative pl-4 pr-0 py-2 sm:p-6 mb-8 group min-h-0">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-[1px] animate-in fade-in duration-200">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                    </div>
                )}
                
                {/* Help Overlay */}
                {showHelp && (
                    <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm p-6 sm:p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Chart Guide</h3>
                        <div className="grid gap-6 max-w-lg text-left text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg h-fit text-blue-600"><Activity size={20} /></div>
                                <div>
                                    <strong className="block text-gray-900 dark:text-white mb-1">Market Data</strong>
                                    Real-time price & daily change. Active Volume shows trading activity for the current session.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg h-fit text-purple-600"><MousePointer size={20} /></div>
                                <div>
                                    <strong className="block text-gray-900 dark:text-white mb-1">Pointer & Area</strong>
                                    Use <strong>Point</strong> (Arrow) to inspect specific prices. Use <strong>Area</strong> (Box) to drag and measure performance changes.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg h-fit text-teal-600"><BarChart2 size={20} /></div>
                                <div>
                                    <strong className="block text-gray-900 dark:text-white mb-1">Volume Control</strong>
                                    Toggle the <strong>Volume</strong> button to show or hide the trading volume bars on the chart.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg h-fit text-orange-600"><History size={20} /></div>
                                <div>
                                    <strong className="block text-gray-900 dark:text-white mb-1">Trend Ranges</strong>
                                    Switch between 1D (Intraday) up to 5Y history. Range selector allows scrolling on mobile.
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowHelp(false)}
                            className="mt-8 px-8 py-2 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-90 transition-opacity"
                        >
                            Got it
                        </button>
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
                    initialVisibleRange={initialVisibleRange}
                    // timezone={...} // Removed to use local system time (Indian Time for user)
                    onCrosshairMove={setActiveData}
                    onSelectionChange={setSelectionStats}
                    selectionMode={selectionMode}
                />
                
                {/* Lifted Tooltip (Always Visible) */}
                {activeData && activeData.x !== undefined && activeData.y !== undefined && (
                     <>

                     <div 
                        className="absolute z-50 text-xs font-bold text-gray-900 dark:text-white pointer-events-none whitespace-nowrap"
                        style={{ 
                            left: activeData.x,
                            top: Math.max(10, activeData.y - 40),
                            transform: 'translateX(-50%)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                     >
                          <span className="bg-white/90 dark:bg-black/80 backdrop-blur-[2px] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
                              {activeData.price.toFixed(2)} <span className="opacity-50 mx-1">|</span> {new Date(activeData.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                     </div>
                     </>
                )}
            </div>
            </div>
      </div>
    </div>
  );
}

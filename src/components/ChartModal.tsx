import React from 'react';
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Cell,
  CartesianGrid
} from 'recharts';
import { X, BarChart2, Loader2 } from 'lucide-react';
import { getWatchlistData } from '@/actions/market';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  priceData: number[];
  volumeData: number[];
  timestamps: number[];
  color?: string;
  range?: '1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '5y' | 'max';
}

// Helper to extract state from Tooltip without rendering it
const ChartCursorHandler = ({ active, payload, onUpdate, latestData }: any) => {
  const lastTimestamp = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (active && payload && payload.length) {
      const newData = payload[0].payload;
      if (newData.timestamp !== lastTimestamp.current) {
        lastTimestamp.current = newData.timestamp;
        onUpdate(newData);
      }
    } else {
       // Reset to latest when not active
       if (latestData && latestData.timestamp !== lastTimestamp.current) {
          lastTimestamp.current = latestData.timestamp;
          onUpdate(latestData);
       }
    }
  }, [active, payload, onUpdate, latestData]);

  return null;
};

// Memoized Chart Component to prevent re-renders on parent state changes (cursor hover)
const MemoizedChart = React.memo(({ 
  data, 
  chartColor, 
  showVolume, 
  activeRange, 
  onCursorUpdate, 
  latestData 
}: {
  data: any[];
  chartColor: string;
  showVolume: boolean;
  activeRange: string;
  onCursorUpdate: (data: any) => void;
  latestData: any;
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%" className="!outline-none [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none [&_:focus]:!outline-none">
        <ComposedChart data={data} margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
            {/* ... defs and grid ... */}
            <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="50%" stopColor={chartColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3" 
                stroke="currentColor" 
                opacity={0.1}
            />
            <XAxis 
                dataKey="timestamp" 
                tickFormatter={(val) => {
                    if (!val || typeof val !== 'number') return '';
                    const date = new Date(val);
                    // Show time for intraday and 1 week (short intervals)
                    if (activeRange === '1d' || activeRange === '1w') {
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    // For 1 month (hourly/daily), show Day
                    if (activeRange === '1m') {
                        return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
                    }
                    // For others show Date
                    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
                }}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
                dy={10}
            />
            <YAxis 
                yAxisId="price" 
                domain={['auto', 'auto']} 
                orientation="right" 
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                tickFormatter={(val) => val.toFixed(2)}
                axisLine={false}
                tickLine={false}
                width={60}
            />
            {showVolume && (
                <YAxis 
                    yAxisId="volume" 
                    orientation="left" 
                    hide 
                />
            )}
            <Tooltip 
                content={<ChartCursorHandler onUpdate={onCursorUpdate} latestData={latestData} />}
                cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                isAnimationActive={false}
            />
            {showVolume && (
                <Bar 
                    yAxisId="volume" 
                    dataKey="volume" 
                    barSize={3} 
                    radius={[2, 2, 0, 0]}
                    opacity={0.6}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.volumeColor} />
                    ))}
                </Bar>
            )}
            <Area 
                yAxisId="price"
                type="monotone" 
                dataKey="price" 
                stroke={chartColor} 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                strokeWidth={2.5}
                animationDuration={1000}
            />
        </ComposedChart>
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
    return (
        prevProps.data === nextProps.data &&
        prevProps.chartColor === nextProps.chartColor &&
        prevProps.showVolume === nextProps.showVolume &&
        prevProps.activeRange === nextProps.activeRange &&
        prevProps.latestData === nextProps.latestData
    );
});

export function ChartModal({ isOpen, onClose, symbol, priceData, volumeData, timestamps, range = '1d' }: ChartModalProps) {
  const [activeRange, setActiveRange] = React.useState<'1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '5y' | 'max'>(range);
  const [internalData, setInternalData] = React.useState<{ price: number[], volume: number[], timestamps: number[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeData, setActiveData] = React.useState<{ price: number, volume: number, timestamp: number } | null>(null);
  const [showVolume, setShowVolume] = React.useState(true);

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

  const latestData = React.useMemo(() => {
     if (currentPriceData.length === 0) return null;
     return {
        price: currentPriceData[currentPriceData.length - 1],
        volume: currentVolumeData[currentVolumeData.length - 1] || 0,
        timestamp: currentTimestamps[currentTimestamps.length - 1]
     };
  }, [currentPriceData, currentVolumeData, currentTimestamps]);

  // Initialize active data
  React.useEffect(() => {
    if (latestData) setActiveData(latestData);
  }, [latestData]);

  const handleCursorUpdate = React.useCallback((data: any) => {
    setActiveData(data);
  }, []);



  // Prepare data for Recharts - Memoized to prevent re-mapping on every cursor move
  const chartData = React.useMemo(() => {
    return currentPriceData.map((price, i) => ({
      timestamp: currentTimestamps[i] || i,
      price,
      volume: currentVolumeData[i] || 0,
      volumeColor: (i > 0 && price >= currentPriceData[i - 1]) ? '#22c55e' : '#ef4444'
    }));
  }, [currentPriceData, currentVolumeData, currentTimestamps]);

  if (!isOpen) return null;

  const isPositive = currentPriceData.length > 0 && currentPriceData[currentPriceData.length - 1] >= currentPriceData[0];
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  
  const displayData = activeData || latestData || { price: 0, volume: 0, timestamp: 0 };
  
  const formatDate = (val: number) => {
      if (!val) return '';
      const date = new Date(val);
      if (activeRange === '1d' || activeRange === '1w') {
          return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentPrice = displayData.price || 0;
  const startPrice = currentPriceData[0] || 0;
  const change = currentPrice - startPrice;
  const changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  const isCurrentlyPositive = change >= 0;


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
                    {/* Range & Volume Controls - Header */}


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
                        {!activeData && 'Last Traded • '} {formatDate(displayData.timestamp)}
                    </p>
                </div>

                <div className="md:col-span-4 border-l border-gray-100 dark:border-white/5 pl-6 hidden md:block">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Active Volume
                    </span>
                    <div className="text-xl font-mono font-bold text-gray-700 dark:text-gray-300">
                        {displayData.volume?.toLocaleString()}
                    </div>
                </div>
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
                <MemoizedChart 
                    data={chartData}
                    chartColor={chartColor}
                    showVolume={showVolume}
                    activeRange={activeRange}
                    onCursorUpdate={handleCursorUpdate}
                    latestData={latestData}
                />


            </div>
            </div>



      </div>
    </div>
  );
}

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
  range?: '1d' | '7d' | '52w';
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

export function ChartModal({ isOpen, onClose, symbol, priceData, volumeData, timestamps, range = '1d' }: ChartModalProps) {
  const [activeRange, setActiveRange] = React.useState<'1d' | '7d' | '52w'>(range);
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

  if (!isOpen) return null;

  // Prepare data for Recharts - Memoized to prevent re-mapping on every cursor move
  const chartData = React.useMemo(() => {
    return currentPriceData.map((price, i) => ({
      timestamp: currentTimestamps[i] || i,
      price,
      volume: currentVolumeData[i] || 0,
      volumeColor: (i > 0 && price >= currentPriceData[i - 1]) ? '#22c55e' : '#ef4444'
    }));
  }, [currentPriceData, currentVolumeData, currentTimestamps]);

  const isPositive = currentPriceData.length > 0 && currentPriceData[currentPriceData.length - 1] >= currentPriceData[0];
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  
  const displayData = activeData || latestData || { price: 0, volume: 0, timestamp: 0 };
  
  const formatDate = (val: number) => {
      if (!val) return '';
      const date = new Date(val);
      if (activeRange === '1d') {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const currentPrice = displayData.price || 0;
  const startPrice = currentPriceData[0] || 0;
  const change = currentPrice - startPrice;
  const changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  const isCurrentlyPositive = change >= 0;


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl border-t sm:border border-gray-200 dark:border-white/10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-500 ease-out" 
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center py-4">
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>

        <div className="px-6 sm:px-10 pb-8 sm:py-8">
            {/* Header / Controls Row */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {symbol}
                    </h2>
                    <div className="hidden sm:flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                        {(['1d', '7d', '52w'] as const).map((r) => (
                            <button 
                                key={r}
                                onClick={() => setActiveRange(r)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    activeRange === r 
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
                        <button 
                            onClick={() => setShowVolume(!showVolume)}
                            className="relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors bg-gray-300 dark:bg-gray-700"
                        >
                            <span 
                                className={`pointer-events-none block h-3 w-3 rounded-full shadow-lg ring-0 transition-all ${showVolume ? 'translate-x-[18px] bg-blue-500' : 'translate-x-[2px] bg-gray-500'}`}
                            />
                        </button>
                        <BarChart2 size={16} className={showVolume ? 'text-blue-500' : 'text-gray-500'} />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Mobile Range Selector */}
            <div className="sm:hidden flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 mb-6 w-fit mx-auto">
                {(['1d', '7d', '52w'] as const).map((r) => (
                    <button 
                        key={r}
                        onClick={() => setActiveRange(r)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeRange === r 
                            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {r.toUpperCase()}
                    </button>
                ))}
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Last Traded • {formatDate(displayData.timestamp)}
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

            <div className="h-[280px] sm:h-[400px] w-full px-2 sm:px-6 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-[1px] animate-in fade-in duration-200">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
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
                                return activeRange === '1d' 
                                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : date.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
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
                            content={<ChartCursorHandler onUpdate={handleCursorUpdate} latestData={latestData} />}
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
                                {chartData.map((entry, index) => (
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
            </div>
        </div>
      </div>
    </div>
  );
}

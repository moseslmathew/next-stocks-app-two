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
  }, [range, symbol]);

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

  if (!isOpen) return null;

  // Prepare data for Recharts
  const chartData = currentPriceData.map((price, i) => ({
    timestamp: currentTimestamps[i] || i,
    price,
    volume: currentVolumeData[i] || 0,
    volumeColor: (i > 0 && price >= currentPriceData[i - 1]) ? '#22c55e' : '#ef4444'
  }));

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

  const low = currentPriceData.length > 0 ? Math.min(...currentPriceData) : 0;
  const high = currentPriceData.length > 0 ? Math.max(...currentPriceData) : 0;
  const range_position = high !== low ? ((currentPrice - low) / (high - low)) * 100 : 50;
  const clampedRangePosition = Math.max(0, Math.min(100, range_position));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl border-t sm:border border-gray-200 dark:border-white/10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-500 ease-out" 
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center py-4">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>

        <div className="px-6 sm:px-10 pb-8 sm:py-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 truncate">
              {symbol}
              <div className="flex bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg border border-gray-200 dark:border-white/10 scale-90 sm:scale-100">
                {(['1d', '7d', '52w'] as const).map((r) => (
                    <button 
                        key={r}
                        onClick={() => setActiveRange(r)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                            activeRange === r 
                            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {r.toUpperCase()}
                    </button>
                ))}
              </div>
            </h2>
            
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 items-start gap-x-4 gap-y-3">
                 <div>
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest block mb-0.5">Price</span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-gray-900 dark:text-white">
                        {currentPrice.toFixed(2)}
                    </div>
                    <div className={`text-[10px] font-bold ${isCurrentlyPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isCurrentlyPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                    </div>
                </div>

                <div className="col-span-2 sm:col-span-1 order-last sm:order-none">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest block mb-1.5">Range ({activeRange})</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-400">
                        <span className="flex-shrink-0">{low.toFixed(2)}</span>
                        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full relative">
                            <div 
                                className="absolute top-0 bottom-0 w-2 h-2 -mt-0.5 bg-[#2070b4] rounded-full shadow-sm ring-2 ring-white dark:ring-[#0a0a0a]"
                                style={{ left: `${clampedRangePosition}%` }}
                            />
                        </div>
                        <span className="flex-shrink-0">{high.toFixed(2)}</span>
                    </div>
                </div>

                {showVolume && (
                    <div className="sm:ml-auto">
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest block mb-0.5">Volume</span>
                        <div className="text-base sm:text-lg font-mono font-bold text-gray-700 dark:text-gray-300">
                            {displayData.volume?.toLocaleString()}
                        </div>
                    </div>
                )}
                 <div className="sm:ml-auto">
                     <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest block mb-0.5">Time Point</span>
                     <div className="text-xs sm:text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(displayData.timestamp)}
                     </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center ml-2">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-tighter sm:hidden">Vol</span>
                <button 
                    onClick={() => setShowVolume(!showVolume)}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-200 dark:bg-gray-800"
                >
                    <span 
                        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${showVolume ? 'translate-x-[18px] bg-blue-500' : 'translate-x-[2px] bg-gray-400'}`}
                    />
                </button>
                <BarChart2 size={16} className={showVolume ? 'text-blue-500' : 'text-gray-400'} />
            </div>
            
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors -mr-1">
                <X size={20} className="text-gray-500" />
            </button>
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
                        content={<ChartCursorHandler onUpdate={setActiveData} latestData={latestData} />}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5 5' }}
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
  );
}

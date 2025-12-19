import React from 'react';
import {
  AreaChart,
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
import { X, BarChart2 } from 'lucide-react';

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

export function ChartModal({ isOpen, onClose, symbol, priceData, volumeData, timestamps, color = '#22c55e', range = '1d' }: ChartModalProps) {
  const latestData = React.useMemo(() => {
     if (priceData.length === 0) return null;
     return {
        price: priceData[priceData.length - 1],
        volume: volumeData[volumeData.length - 1] || 0,
        timestamp: timestamps[timestamps.length - 1]
     };
  }, [priceData, volumeData, timestamps]);

  const [activeData, setActiveData] = React.useState<{ price: number, volume: number, timestamp: number } | null>(null);
  const [showVolume, setShowVolume] = React.useState(true);

  // Initialize
  React.useEffect(() => {
    if (latestData) setActiveData(latestData);
  }, [latestData]);

  if (!isOpen) return null;

  // Prepare data for Recharts
  const chartData = priceData.map((price, i) => ({
    timestamp: timestamps[i] || i, // Fallback to index if no timestamp
    price,
    volume: volumeData[i] || 0,
    volumeColor: (i > 0 && price >= priceData[i - 1]) ? '#22c55e' : '#ef4444'
  }));

  const isPositive = priceData.length > 0 && priceData[priceData.length - 1] >= priceData[0];
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  
  const displayData = activeData || latestData || { price: 0, volume: 0, timestamp: 0 };
  
  const formatDate = (val: number) => {
      if (!val) return '';
      const date = new Date(val);
      if (range === '1d') {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const currentPrice = displayData.price || 0;
  const startPrice = priceData[0] || 0;
  const change = currentPrice - startPrice;
  const changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  const isCurrentlyPositive = change >= 0;

  const low = priceData.length > 0 ? Math.min(...priceData) : 0;
  const high = priceData.length > 0 ? Math.max(...priceData) : 0;
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
              {symbol}
              <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                {range}
              </span>
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
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest block mb-1.5">Range ({range})</span>
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

        <div className="h-[280px] sm:h-[400px] w-full px-2 sm:px-6">
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
                            return range === '1d' 
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
                            hide // Hide volume axis scale to keep it clean, bars just show relative magnitude
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

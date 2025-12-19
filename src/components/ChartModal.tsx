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
  Cell
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl border-t sm:border border-gray-200 dark:border-white/10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-500 ease-out" 
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center py-3">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-800 rounded-full" />
        </div>

        <div className="p-5 sm:p-8">
            <div className="flex justify-between items-start mb-6 sm:mb-8">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                      {symbol}
                    </h2>
                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {range}
                    </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-mono font-bold text-gray-900 dark:text-white tracking-tighter">
                            {currentPrice.toFixed(2)}
                        </span>
                        <div className={`flex items-center text-sm sm:text-base font-bold ${isCurrentlyPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isCurrentlyPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest">Volume</span>
                    <button 
                        onClick={() => setShowVolume(!showVolume)}
                        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors bg-gray-300 dark:bg-gray-700"
                    >
                        <span 
                            className={`pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-all ${showVolume ? 'translate-x-[18px] bg-blue-500' : 'translate-x-[2px] bg-gray-500'}`}
                        />
                    </button>
                    <BarChart2 size={16} className={showVolume ? 'text-blue-500' : 'text-gray-500'} />
                </div>
                
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all text-gray-500 dark:text-gray-400 hover:scale-110 active:scale-95 shadow-sm border border-gray-200 dark:border-white/10">
                    <X size={20} />
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="sm:hidden flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 col-span-2">
                    <div className="flex-1">
                        <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest block">Show Volume</span>
                        <span className="text-xs font-medium text-gray-400">Toggle bars in chart</span>
                    </div>
                    <button 
                        onClick={() => setShowVolume(!showVolume)}
                        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors bg-gray-300 dark:bg-gray-700"
                    >
                        <span 
                            className={`pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-all ${showVolume ? 'translate-x-[22px] bg-blue-500' : 'translate-x-[4px] bg-gray-500'}`}
                        />
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-gray-200 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest block mb-1">Volume (Active)</span>
                    <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                        {displayData.volume?.toLocaleString()}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-gray-200 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest block mb-1">Time Point</span>
                    <div className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300">
                        {formatDate(displayData.timestamp)}
                    </div>
                </div>
            </div>

        <div className="h-[300px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(val) => {
                            if (!val || typeof val !== 'number') return '';
                            const date = new Date(val);
                            return range === '1d' 
                                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : date.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
                        }}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis 
                        yAxisId="price" 
                        domain={['auto', 'auto']} 
                        orientation="right" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(val) => val.toFixed(2)}
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
                        cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    {showVolume && (
                        <Bar yAxisId="volume" dataKey="volume" barSize={4} fill="#60a5fa">
                            {
                                chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.volumeColor} />
                                ))
                            }
                        </Bar>
                    )}
                    <Area 
                        yAxisId="price"
                        type="monotone" 
                        dataKey="price" 
                        stroke={chartColor} 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        strokeWidth={2}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
        </div>
      </div>
    </div>
  );
}

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
      return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {symbol}
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {range.toUpperCase()}
              </span>
            </h2>
            <div className="mt-1 flex items-baseline gap-4">
                 <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Price</span>
                    <div className="text-2xl font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {displayData.price?.toFixed(2)}
                    </div>
                </div>
                {showVolume && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Volume</span>
                        <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
                            {displayData.volume?.toLocaleString()}
                        </div>
                    </div>
                )}
                 <div>
                     <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Date</span>
                     <div className="text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(displayData.timestamp)}
                     </div>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowVolume(!showVolume)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                    showVolume 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${showVolume ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${showVolume ? 'left-4.5' : 'left-0.5'}`} style={{ left: showVolume ? 'calc(100% - 14px)' : '2px' }} />
                </div>
                Volume
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="h-[400px] w-full">
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
  );
}

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface MarketCardProps {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

export default function MarketCard({ name, price, change, changePercent, currency = 'USD' }: MarketCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{name}</h3>
        <div className={`p-2 rounded-full ${
          isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 
          isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 
          'bg-gray-100 dark:bg-gray-800 text-gray-600'
        }`}>
          {isPositive ? <TrendingUp size={20} /> : isNegative ? <TrendingDown size={20} /> : <Minus size={20} />}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(price, currency)}
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
        }`}>
          <span>{change > 0 ? '+' : ''}{change.toFixed(2)}</span>
          <span className="opacity-75">({changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
}

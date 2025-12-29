'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface TrackStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  initialEntryPrice?: number;
  initialTargetPrice?: number;
  onSave: (entryPrice: number, targetPrice: number) => Promise<void>;
  currency: string;
}

export function TrackStockModal({ 
    isOpen, 
    onClose, 
    symbol, 
    currentPrice, 
    initialEntryPrice, 
    initialTargetPrice, 
    onSave,
    currency 
}: TrackStockModalProps) {
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEntryPrice(initialEntryPrice?.toString() || '');
      setTargetPrice(initialTargetPrice?.toString() || '');
    }
  }, [isOpen, initialEntryPrice, initialTargetPrice]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const entry = parseFloat(entryPrice);
    const target = parseFloat(targetPrice);

    if (!isNaN(entry) && !isNaN(target)) {
        await onSave(entry, target);
        onClose();
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Track {symbol}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Set tracking parameters</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Entry Price ({currency})</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-gray-900 dark:text-white font-mono"
                        placeholder="0.00"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Target Price ({currency})</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all text-gray-900 dark:text-white font-mono"
                        placeholder="0.00"
                        required
                    />
                </div>
                
                <div className="pt-2">
                     <button 
                         type="button" 
                         onClick={() => {
                             // Quick preset: Current Price for Entry
                             setEntryPrice(currentPrice.toString());
                         }}
                         className="text-xs text-blue-500 hover:text-blue-600 mb-4 block"
                     >
                         Use Current Price ({currentPrice}) for Entry
                     </button>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check size={18} />
                                Start Tracking
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}

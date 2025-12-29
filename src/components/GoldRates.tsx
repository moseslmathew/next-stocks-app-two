'use client';

import { TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface GoldRatesProps {
    spotPriceInr?: number; // Price per Ounce in INR
    price1g22k?: number | null;
    price1g24k?: number | null;
    change1g24k?: number;
    change1g22k?: number;
    change?: number; // Deprecated/Generic fallback
    changePercent?: number;
}

export default function GoldRates({ spotPriceInr, price1g22k, price1g24k, change1g24k, change1g22k, change, changePercent }: GoldRatesProps) {
    if (!spotPriceInr && !price1g22k) return null;

    // Use specific changes if available, else fallback to generic 'change' prop (1g)
    const ch24k = change1g24k !== undefined ? change1g24k : (change || 0);
    const ch22k = change1g22k !== undefined ? change1g22k : (change || 0);

    // Logic: If direct prices provided, use them. Else derive from spot.
    let gold24k, gold22k;
    let isEstimate = true;

    if (price1g24k && price1g22k) {
        // Use Scraped Data
        gold24k = {
            g10: price1g24k * 10,
            g8: price1g24k * 8,
            g1: price1g24k
        };
        gold22k = {
            g10: price1g22k * 10,
            g8: price1g22k * 8,
            g1: price1g22k
        };
        isEstimate = false;
    } else if (spotPriceInr) {
        // Fallback to calculation
        const pricePerGram = spotPriceInr / 31.1035;
        gold24k = {
            g10: pricePerGram * 10,
            g8: pricePerGram * 8,
            g1: pricePerGram
        };
        gold22k = {
            g10: pricePerGram * 10 * 0.916,
            g8: pricePerGram * 8 * 0.916,
            g1: pricePerGram * 0.916
        };
    } else {
        return null;
    }
    
    // Helper to render change pill
    const renderChange = (gramMultiplier: number, baseChange: number) => {
        if (baseChange === 0) return null;
        const amount = baseChange * gramMultiplier;
        const isPos = amount >= 0;
        return (
             <span className={`text-xs font-medium ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                ({isPos ? '+' : ''}{formatCurrency(amount, 'INR')})
            </span>
        );
    };

    return (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 24 Karat */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-yellow-100 dark:border-yellow-900/20">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-500">
                            <Coins size={16} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Gold 24K</h3>
                    </div>
                    <span className="text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-wide">99.9% Pure</span>
                </div>
                {gold24k && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">10 Grams</span>
                            <div className="flex flex-col items-end">
                                <span className="font-mono font-medium text-gray-900 dark:text-white text-base">{formatCurrency(gold24k.g10, 'INR')}</span>
                                {renderChange(10, ch24k)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-100 dark:border-gray-800">
                            <span className="text-sm text-gray-500 dark:text-gray-400">8 Grams</span>
                            <div className="flex flex-col items-end">
                                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(gold24k.g8, 'INR')}</span>
                                {renderChange(8, ch24k)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-100 dark:border-gray-800">
                             <span className="text-sm text-gray-500 dark:text-gray-400">1 Gram</span>
                             <div className="flex flex-col items-end">
                                 <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(gold24k.g1, 'INR')}</span>
                                {renderChange(1, ch24k)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 22 Karat */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-orange-100 dark:border-orange-900/20">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-500">
                            <Coins size={16} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Gold 22K</h3>
                    </div>
                    <span className="text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wide">Standard</span>
                </div>
                {gold22k && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">10 Grams</span>
                            <div className="flex flex-col items-end">
                                <span className="font-mono font-medium text-gray-900 dark:text-white text-base">{formatCurrency(gold22k.g10, 'INR')}</span>
                                {renderChange(10, ch22k)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-100 dark:border-gray-800">
                            <span className="text-sm text-gray-500 dark:text-gray-400">8 Grams</span>
                            <div className="flex flex-col items-end">
                                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(gold22k.g8, 'INR')}</span>
                                {renderChange(8, ch22k)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-100 dark:border-gray-800">
                             <span className="text-sm text-gray-500 dark:text-gray-400">1 Gram</span>
                             <div className="flex flex-col items-end">
                                 <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(gold22k.g1, 'INR')}</span>
                                {renderChange(1, ch22k)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="md:col-span-2 text-center">
                 <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {isEstimate 
                        ? '* Live estimates excluding GST' 
                        : '* Rates sourced from BankBazaar. Excludes GST.'}
                </p>
            </div>
        </div>
    );
}

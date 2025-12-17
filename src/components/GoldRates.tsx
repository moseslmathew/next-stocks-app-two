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
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 p-6">
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-700 dark:text-yellow-500">
                        <Coins size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gold Rates (India)</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isEstimate ? 'Live estimates based on spot rates' : 'Market rates'}
                        </p>
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 24 Karat */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-yellow-100 dark:border-yellow-900/20">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-yellow-700 dark:text-yellow-500">24 Karat (99.9%)</h3>
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded">Pure Gold</span>
                    </div>
                    {gold24k && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">10 Grams</span>
                                <div className="flex items-center gap-2">
                                    {renderChange(10, ch24k)}
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{formatCurrency(gold24k.g10, 'INR')}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">8 Grams</span>
                                <div className="flex items-center gap-2">
                                    {renderChange(8, ch24k)}
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{formatCurrency(gold24k.g8, 'INR')}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                                 <span className="text-xs text-gray-500">1 Gram</span>
                                 <div className="flex items-center gap-2">
                                     {renderChange(1, ch24k)}
                                     <span className="text-xs font-mono text-gray-500">{formatCurrency(gold24k.g1, 'INR')}</span>
                                 </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 22 Karat */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-orange-100 dark:border-orange-900/20">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-orange-700 dark:text-orange-500">22 Karat (91.6%)</h3>
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2 py-0.5 rounded">Standard Jewellery</span>
                    </div>
                    {gold22k && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">10 Grams</span>
                                <div className="flex items-center gap-2">
                                    {renderChange(10, ch22k)}
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{formatCurrency(gold22k.g10, 'INR')}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">8 Grams</span>
                                <div className="flex items-center gap-2">
                                    {renderChange(8, ch22k)}
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{formatCurrency(gold22k.g8, 'INR')}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                                 <span className="text-xs text-gray-500">1 Gram</span>
                                 <div className="flex items-center gap-2">
                                     {renderChange(1, ch22k)}
                                     <span className="text-xs font-mono text-gray-500">{formatCurrency(gold22k.g1, 'INR')}</span>
                                 </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
             <p className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-wider">
                {isEstimate 
                    ? '* Rates are estimated market averages excluding GST & Making Charges' 
                    : '* Rates sourced from BankBazaar. Excludes GST.'}
            </p>
        </div>
    );
}

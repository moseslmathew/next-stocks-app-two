'use client';

import { useState, useEffect } from 'react';
import { Activity, PieChart, BarChart3, DollarSign, HelpCircle, X, Info } from 'lucide-react';

interface StockData {
    marketCap?: number;
    peRatio?: number;
    forwardPE?: number;
    eps?: number;
    beta?: number;
    dividendYield?: number;
    profitMargins?: number;
    roe?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
}

const METRIC_DEFINITIONS: Record<string, { title: string, definition: string, importance: string }> = {
    'Market Cap': {
        title: 'Market Capitalization',
        definition: 'The total market value of a company\'s outstanding shares of stock. Calculated by multiplying the total number of shares by the current share price.',
        importance: 'It helps investors categorize companies by size (Small, Mid, Large, or Mega Cap), indicating the risk and growth potential. Large caps are generally more stable, while small caps may offer higher growth but with more risk.'
    },
    'P/E Ratio': {
        title: 'Price-to-Earnings (P/E) Ratio',
        definition: 'The ratio for valuing a company that measures its current share price relative to its earnings per share (EPS).',
        importance: 'A high P/E ratio could mean that a company\'s stock is overvalued, or else that investors are expecting high growth rates in the future. A low P/E might indicate an undervalued stock or a stable "value" stock.'
    },
    'EPS (TTM)': {
        title: 'Earnings Per Share (EPS) - Trailing Twelve Months',
        definition: 'The portion of a company\'s profit allocated to each outstanding share of common stock, calculated over the last 12 months.',
        importance: 'EPS is a direct indicator of profitability. Increasing EPS typically leads to higher stock prices. It is the most important component in calculating the P/E ratio.'
    },
    'Beta': {
        title: 'Beta',
        definition: 'A measure of the volatility—or systematic risk—of a security or portfolio compared to the market as a whole (usually the S&P 500).',
        importance: 'A beta of 1 means the stock moves with the market. >1 means it is more volatile (more risk, more potential reward). <1 means it is less volatile (stable). Negative beta means it moves inversely to the market.'
    },
    'Div Yield': {
        title: 'Dividend Yield',
        definition: 'A financial ratio (dividend/price) that shows how much a company pays out in dividends each year relative to its stock price.',
        importance: 'It is important for income-focused investors. A high yield can provide steady income, but an extremely high yield might signal a company in trouble (since yield rises as price falls).'
    },
    'Profit Margin': {
        title: 'Profit Margin',
        definition: 'The percentage of revenue that remains as profit after all expenses are deducted.',
        importance: 'It measures how efficiently a company manages its expenses. Higher margins generally mean the company has a strong competitive advantage or "moat" and can weather economic downturns better.'
    },
    'ROE': {
        title: 'Return on Equity (ROE)',
        definition: 'A measure of financial performance calculated by dividing net income by shareholders\' equity.',
        importance: 'It shows how effectively management is using a company’s assets to create profits. A higher ROE usually indicates a more efficient company.'
    },
    '52 Week Range': {
        title: '52 Week Range',
        definition: 'The lowest and highest price at which a stock has traded during the previous 52 weeks.',
        importance: 'It gives investors a sense of the stock\'s volatility and current valuation relative to its recent history. Trading near the low might indicate value (or trouble), while trading near the high might indicate momentum (or overvaluation).'
    }
};

export default function StockFundamentals({ stock }: { stock: StockData }) {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    useEffect(() => {
        if (selectedMetric) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedMetric]);

    const formatLargeNumber = (num?: number) => {
        if (!num) return '---';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        return num.toLocaleString();
    };
    
    const formatPercent = (num?: number) => {
        if (num === undefined || num === null) return '---';
        return (num * 100).toFixed(2) + '%';
    };

    const StatItem = ({ label, value, icon: Icon, subValue }: { label: string, value: string | number, icon?: any, subValue?: string }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
            {Icon && <Icon size={14} className="text-violet-500" />}
            <span className="truncate">{label}</span>
            <button 
                onClick={() => setSelectedMetric(label)}
                className="opacity-50 hover:opacity-100 transition-opacity"
                title="Click for details"
            >
                <HelpCircle size={12} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white truncate" title={String(value)}>
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-gray-400 truncate">
               {subValue}
            </div>
          )}
        </div>
    );

    const metricInfo = selectedMetric ? METRIC_DEFINITIONS[selectedMetric] : null;

    return (
        <>
            <section className="py-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Activity className="text-violet-600" size={16} />
                    Fundamentals
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                    <StatItem 
                        label="Market Cap" 
                        value={formatLargeNumber(stock.marketCap)} 
                        icon={PieChart}
                    />
                     <StatItem 
                        label="P/E Ratio" 
                        value={stock.peRatio ? stock.peRatio.toFixed(2) : '---'} 
                        subValue={stock.forwardPE ? `Fwd P/E: ${stock.forwardPE.toFixed(2)}` : undefined}
                        icon={BarChart3}
                    />
                    <StatItem 
                        label="EPS (TTM)" 
                        value={stock.eps ? stock.eps.toFixed(2) : '---'} 
                        icon={DollarSign}
                    />
                    <StatItem 
                        label="Beta" 
                        value={stock.beta ? stock.beta.toFixed(2) : '---'} 
                        icon={Activity}
                    />
                     <StatItem 
                        label="Div Yield" 
                        value={formatPercent(stock.dividendYield)} 
                        icon={PieChart}
                    />
                     <StatItem 
                        label="Profit Margin" 
                        value={formatPercent(stock.profitMargins)} 
                        icon={BarChart3}
                    />
                     <StatItem 
                        label="ROE" 
                        value={formatPercent(stock.roe)} 
                        icon={Activity}
                    />
                    <StatItem 
                        label="52 Week Range" 
                        value={`${stock.fiftyTwoWeekLow?.toLocaleString() || '---'} - ${stock.fiftyTwoWeekHigh?.toLocaleString() || '---'}`}
                        icon={Activity}
                    />
                </div>
            </section>

            {/* Modal */}
            {selectedMetric && metricInfo && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedMetric(null)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedMetric(null)}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-violet-600 dark:text-violet-400">
                                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-full">
                                    <Info size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {metricInfo.title}
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Definition</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {metricInfo.definition}
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                        Why is it important?
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                        "{metricInfo.importance}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

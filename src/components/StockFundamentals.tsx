'use client';

import { AIAnalysisModal } from './AIAnalysisModal';
import { useState, useEffect } from 'react';
import { HelpCircle, X, Info, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    Cell,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Legend, 
    ResponsiveContainer,
    LabelList 
} from 'recharts';

interface FinancialMetric {
    date: string | Date;
    [key: string]: any;
}

interface IncomeStatementItem extends FinancialMetric {
    revenue: number;
    netIncome: number;
    grossProfit: number;
    operatingIncome: number;
}

interface BalanceSheetItem extends FinancialMetric {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    cash: number;
}

interface StockData {
    symbol?: string;
    currency?: string;
    name?: string;
    price?: number;
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
    financials?: {
        incomeStatement: {
            annual: IncomeStatementItem[];
            quarterly: IncomeStatementItem[];
        };
        balanceSheet: {
            annual: BalanceSheetItem[];
            quarterly: BalanceSheetItem[];
        };
    };
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

// Helper to determine scale based on a maximum value
const getScaleConfig = (maxVal: number, currency?: string) => {
    const absVal = Math.abs(maxVal);
    if (!currency || currency !== 'INR') {
         if (absVal >= 1e12) return { unit: 'T', divisor: 1e12, label: 'Trillion' };
         if (absVal >= 1e9) return { unit: 'B', divisor: 1e9, label: 'Billion' };
         if (absVal >= 1e6) return { unit: 'M', divisor: 1e6, label: 'Million' };
         return { unit: '', divisor: 1, label: '' };
    } else {
        // INR
         if (absVal >= 1e7) return { unit: 'Cr', divisor: 1e7, label: 'Crores' };
         if (absVal >= 1e5) return { unit: 'L', divisor: 1e5, label: 'Lakhs' };
         return { unit: '', divisor: 1, label: '' };
    }
};

// Helper to check valid number (including 0 and negatives)
const isValid = (val: any): val is number => val !== undefined && val !== null && !isNaN(val);

// Type definition for the tabs
type ChartMetric = 'revenue' | 'netIncome' | 'totalAssets' | 'totalLiabilities' | 'totalEquity';

const CHART_TABS: { id: ChartMetric; label: string; source: 'income' | 'balance'; color: string }[] = [
    { id: 'revenue', label: 'Revenue', source: 'income', color: '#3B82F6' },
    { id: 'netIncome', label: 'Net Profit', source: 'income', color: '#10B981' },
    { id: 'totalAssets', label: 'Assets', source: 'balance', color: '#3B82F6' },
    { id: 'totalLiabilities', label: 'Liabilities', source: 'balance', color: '#EF4444' },
    { id: 'totalEquity', label: 'Equity', source: 'balance', color: '#6366F1' },
];

export default function StockFundamentals({ stock }: { stock: StockData }) {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ChartMetric>('revenue');
    const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
    const [showDetails, setShowDetails] = useState(false);

    // Initial check for data validity
    const hasFinancials = !!stock.financials;

    // Helper to get current data based on active tab
    const activeTabConfig = CHART_TABS.find(t => t.id === activeTab) || CHART_TABS[0];
    
    const currentData = stock.financials 
        ? (activeTabConfig.source === 'income' 
            ? stock.financials.incomeStatement[period] 
            : stock.financials.balanceSheet[period])
        : [];

    // Calculate max value for scaling based on the ACTIVE metric only
    const maxValue = currentData.reduce((max, item) => Math.max(max, item[activeTab] || 0), 0);

    const { unit, divisor, label: unitLabel } = getScaleConfig(maxValue, stock.currency);

    const formatScaled = (val: number, compact: boolean = false) => {
        if (!val && val !== 0) return '-';
        const scaled = val / divisor;
        
        if (compact) {
            return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(scaled);
        }
        
        return scaled.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    useEffect(() => {
        if (selectedMetric || isAIModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedMetric, isAIModalOpen]);

    const formatLargeNumber = (num?: number, currency?: string) => {
        if (!num && num !== 0) return '---';
        
        const absNum = Math.abs(num);
        const sign = num < 0 ? '-' : '';

        if (currency === 'INR') {
            if (absNum >= 1e7) {
                const crores = absNum / 1e7;
                if (crores >= 100000) return sign + (crores / 100000).toFixed(2) + 'L Cr';
                return sign + crores.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Cr';
            }
            if (absNum >= 100000) return sign + (absNum / 100000).toFixed(2) + 'L';
            return sign + absNum.toLocaleString('en-IN');
        }

        if (absNum >= 1e12) return sign + (absNum / 1e12).toFixed(2) + 'T';
        if (absNum >= 1e9) return sign + (absNum / 1e9).toFixed(2) + 'B';
        if (absNum >= 1e6) return sign + (absNum / 1e6).toFixed(2) + 'M';
        return num.toLocaleString();
    };
    
    const formatPercent = (num?: number) => {
        if (num === undefined || num === null) return '---';
        return (num * 100).toFixed(2) + '%';
    };

    const formatCurrencyShort = (val?: number, currency?: string) => {
        if (!val && val !== 0) return '---';
        return formatLargeNumber(val, currency);
    };

    const formatDate = (date: string | Date) => {
        if (typeof date === 'string' && (date.includes('Q') || date.length < 10) && period === 'quarterly') {
            return date;
        }
        const d = new Date(date);
        return period === 'quarterly' 
            ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) // e.g., Dec 23
            : d.getFullYear().toString(); // e.g., 2023
    };

    // Calculated / Fallback Metrics
    const peVal = isValid(stock.peRatio) 
        ? stock.peRatio 
        : (isValid(stock.price) && isValid(stock.eps) && stock.eps !== 0 ? stock.price! / stock.eps! : null);

    const StatItem = ({ label, value, subValue }: { label: string, value: string | number, subValue?: string }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wider">
            <span className="truncate">{label}</span>
            <button 
                onClick={() => setSelectedMetric(label)}
                className="opacity-40 hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
                title="Click for details"
            >
                <HelpCircle size={14} />
            </button>
          </div>
          <div className="text-right">
             <div className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 tabular-nums tracking-tight" title={String(value)}>
                {value}
             </div>
             {subValue && (
                <div className="text-[10px] sm:text-xs text-gray-400 font-medium">
                   {subValue}
                </div>
             )}
          </div>
        </div>
    );

    const metricInfo = selectedMetric ? METRIC_DEFINITIONS[selectedMetric] : null;

    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Fundamentals
                    </h2>
                    <button 
                        onClick={() => setIsAIModalOpen(true)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800/50"
                    >
                        <Sparkles size={12} />
                        AI Analysis
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 bg-white dark:bg-zinc-900/50 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm">
                    <div className="space-y-1"> 
                        <StatItem label="Market Cap" value={formatLargeNumber(stock.marketCap, stock.currency)} />
                        <StatItem 
                            label="P/E Ratio" 
                            value={isValid(peVal) ? peVal.toFixed(2) : '---'} 
                            subValue={isValid(stock.forwardPE) ? `Fwd: ${stock.forwardPE!.toFixed(2)}` : undefined} 
                        />
                        <StatItem label="EPS (TTM)" value={isValid(stock.eps) ? stock.eps!.toFixed(2) : '---'} />
                        <StatItem label="Beta" value={isValid(stock.beta) ? stock.beta!.toFixed(2) : '---'} />
                    </div>
                    <div className="space-y-1 text-left">
                        <StatItem label="Div Yield" value={formatPercent(stock.dividendYield ?? 0)} />
                        {/* Use isValid to ensure 0 and negative percentages are shown */}
                        <StatItem label="Profit Margin" value={isValid(stock.profitMargins) ? formatPercent(stock.profitMargins) : '---'} />
                        <StatItem label="ROE" value={isValid(stock.roe) ? formatPercent(stock.roe) : '---'} />
                    </div>
                </div>

                {/* 52 Week Range Bar */}
                <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">52 Week Range</span>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-6 pb-2 relative">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums min-w-[3ch] text-right">{formatCurrencyShort(stock.fiftyTwoWeekLow)}</span>
                        
                        <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full flex-1">
                             <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-800" />
                             
                             <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-90"
                                style={{
                                    width: `${Math.min(Math.max(((stock.price || 0) - (stock.fiftyTwoWeekLow || 0)) / ((stock.fiftyTwoWeekHigh || 0) - (stock.fiftyTwoWeekLow || 0)) * 100, 0), 100)}%`
                                }}
                             />
                             
                            <div 
                                className="absolute top-1/2 w-4 h-4 bg-white border-[3px] border-blue-600 shadow-lg rounded-full z-10 transition-all duration-500 group cursor-help"
                                style={{
                                    left: `${Math.min(Math.max(((stock.price || 0) - (stock.fiftyTwoWeekLow || 0)) / ((stock.fiftyTwoWeekHigh || 0) - (stock.fiftyTwoWeekLow || 0)) * 100, 0), 100)}%`,
                                    transform: 'translate(-50%, -50%)' 
                                }}
                            >
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-t-gray-900 dark:after:border-t-white after:border-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    {formatCurrencyShort(stock.price, stock.currency)}
                                </div>
                            </div>
                        </div>
                        
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums min-w-[3ch]">{formatCurrencyShort(stock.fiftyTwoWeekHigh)}</span>
                    </div>
                    <div className="flex justify-between px-10 text-[10px] text-gray-400 font-medium">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            </section>

            {/* NEW Financial Analysis Section */}
            {stock.financials && (
                <section className="py-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col mb-6">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex flex-col">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                     <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                    Financial Analysis
                                </h2>
                                {unitLabel && (
                                    <span className="text-[10px] text-gray-400 font-medium ml-3 mt-0.5">
                                        All values in {stock.currency === 'INR' ? 'INR' : 'USD'} {unitLabel} ({unit})
                                    </span>
                                )}
                            </div>
                            
                            {/* Period (Quarterly / Annual) - Small Switch on the Right */}
                            <div className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg flex items-center">
                                <button
                                    onClick={() => setPeriod('quarterly')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${period === 'quarterly' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    Quarterly
                                </button>
                                <button
                                    onClick={() => setPeriod('annual')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${period === 'annual' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    Annual
                                </button>
                            </div>
                         </div>

                        {/* Financial Metric Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade-right">
                            {CHART_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-full transition-all border ${
                                        activeTab === tab.id 
                                        ? '' // Active styles applied inline below to use dynamic color
                                        : 'bg-white dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                    }`}
                                    style={activeTab === tab.id ? { 
                                        backgroundColor: `${tab.color}15`, 
                                        color: tab.color, 
                                        borderColor: `${tab.color}40`,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    } : {}}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[280px] mb-6 w-full bg-linear-to-b from-white to-gray-50 dark:from-zinc-900/50 dark:to-zinc-900/0 rounded-xl p-4 border border-gray-50 dark:border-zinc-800/50">
                        {(!currentData || currentData.length === 0) ? (
                             <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                                No financial data available for {period} {activeTabConfig.label}
                             </div>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[...currentData].reverse().slice(-activeSliceCount(period))}
                                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                                barGap={8}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.4} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(val) => formatDate(val)} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} 
                                    dy={10}
                                />
                                <YAxis hide={true} />
                                <Legend 
                                    iconType="circle" 
                                    iconSize={6}
                                    wrapperStyle={{ 
                                        fontSize: '11px', 
                                        fontWeight: 600, 
                                        paddingTop: '20px',
                                        color: '#4B5563' 
                                    }} 
                                    formatter={(value) => <span style={{ color: '#374151', marginLeft: '4px' }}>{activeTabConfig.label}</span>}
                                />
                                <Bar 
                                    dataKey={activeTab} 
                                    name={activeTabConfig.label} 
                                    fill={activeTabConfig.color} 
                                    radius={[4, 4, 0, 0]} 
                                    maxBarSize={40}
                                >
                                    {
                                        activeTab === 'netIncome' && ([...currentData].reverse().slice(-activeSliceCount(period))).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={(entry.netIncome || 0) >= 0 ? '#10B981' : '#EF4444'} />
                                            ))
                                    }
                                    <LabelList 
                                        dataKey={activeTab} 
                                        position="top" 
                                        formatter={(val: any) => formatScaled(val, true)} 
                                        style={{ fontSize: '10px', fill: '#6B7280', fontWeight: 600 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>

                    <div className="flex justify-center mb-2">
                        <button 
                            onClick={() => setShowDetails(!showDetails)}
                            className="group flex items-center gap-2 px-6 py-2 rounded-full bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold text-gray-600 dark:text-gray-300 transition-all border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md"
                        >
                            {showDetails ? (
                                <>Hide {activeTabConfig.source === 'income' ? 'Income' : 'Balance Sheet'} Data <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform text-gray-400" /></>
                            ) : (
                                <>View {activeTabConfig.source === 'income' ? 'Income' : 'Balance Sheet'} Data <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform text-gray-400" /></>
                            )}
                        </button>
                    </div>

                    {showDetails && (
                        <div className="overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-300 rounded-xl border border-gray-100 dark:border-zinc-800 p-1 mt-6 bg-white dark:bg-zinc-900/50 shadow-sm">
                            <table className="w-full text-xs text-right border-collapse">
                                <thead>
                                    <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-zinc-800/50">
                                        <th className="text-left py-3 px-4 font-semibold">Period</th>
                                        {activeTabConfig.source === 'income' ? (
                                            <>
                                                <th className="py-3 px-2 font-semibold">Revenue <span className="text-[9px] opacity-70">({unit})</span></th>
                                                <th className="py-3 px-2 font-semibold">Net Income <span className="text-[9px] opacity-70">({unit})</span></th>
                                                <th className="py-3 px-2 font-semibold">Op. Income <span className="text-[9px] opacity-70">({unit})</span></th>
                                                <th className="py-3 px-4 font-semibold">Margin</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="py-3 px-2 font-semibold">Assets <span className="text-[9px] opacity-70">({unit})</span></th>
                                                <th className="py-3 px-2 font-semibold">Liabilities <span className="text-[9px] opacity-70">({unit})</span></th>
                                                <th className="py-3 px-2 font-semibold">Equity <span className="text-[9px] opacity-70">({unit})</span></th>
                                                <th className="py-3 px-4 font-semibold">Cash <span className="text-[9px] opacity-70">({unit})</span></th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/30">
                                    {activeTabConfig.source === 'income' ? (
                                        (currentData as IncomeStatementItem[]).length > 0 ? (
                                            (currentData as IncomeStatementItem[]).slice(0, 5).map((item, i) => (
                                                <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                                                    <td className="text-left py-3 px-4 font-bold text-gray-700 dark:text-gray-200">{formatDate(item.date)}</td>
                                                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300 font-medium">{formatScaled(item.revenue)}</td>
                                                    <td className={`py-3 px-2 font-bold ${item.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{formatScaled(item.netIncome)}</td>
                                                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{item.operatingIncome ? formatScaled(item.operatingIncome) : '---'}</td>
                                                    <td className="py-3 px-4 font-mono text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-zinc-800/20 rounded-r-lg">{item.revenue && item.netIncome ? ((item.netIncome / item.revenue) * 100).toFixed(1) + '%' : '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Data unavailable</td></tr>
                                        )
                                    ) : (
                                        (currentData as BalanceSheetItem[]).length > 0 ? (
                                            (currentData as BalanceSheetItem[]).slice(0, 5).map((item, i) => (
                                                <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                                    <td className="text-left py-3 px-4 font-bold text-gray-700 dark:text-gray-200">{formatDate(item.date)}</td>
                                                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300 font-medium">{formatScaled(item.totalAssets)}</td>
                                                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300 font-medium">{formatScaled(item.totalLiabilities)}</td>
                                                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300 font-medium">{formatScaled(item.totalEquity)}</td>
                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">{formatScaled(item.cash)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Info size={24} className="mb-1 opacity-40" />
                                                        <span className="font-medium">Balance Sheet data unavailable</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* AI Analysis Modal */}
            <AIAnalysisModal 
                stockSymbol={stock.symbol || '---'} 
                stockName={stock.name || 'Stock'} 
                stockData={stock}
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
            />

            {/* Metric Details Modal */}
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
                            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                    <Info size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {metricInfo.title}
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Definition</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {metricInfo.definition}
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
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
        </div>
    );
}

// Helper to determine number of bars to show based on period
function activeSliceCount(period: 'annual' | 'quarterly'): number {
    return period === 'quarterly' ? 6 : 5;
}

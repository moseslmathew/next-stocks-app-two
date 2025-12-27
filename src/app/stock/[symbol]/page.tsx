import { getStockDetails } from '@/actions/market';
import Link from 'next/link';
import { ArrowLeft, Globe, Building2, Users, TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/utils/currency';

export default async function StockDetailsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: symbolParam } = await params;
  const symbol = decodeURIComponent(symbolParam);
  
  if (!symbol || symbol === 'undefined') {
    notFound(); 
  }

  const stock = await getStockDetails(symbol);

  if (!stock) {
    notFound();
  }

  const isPositive = (stock.change || 0) >= 0;

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

  const StatCard = ({ label, value, icon: Icon, subValue }: { label: string, value: string | number, icon?: any, subValue?: string }) => (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
        {Icon && <Icon size={14} />}
        {label}
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-gray-400">
           {subValue}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-20">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">{stock.name}</h1>
            <div className="text-xs text-gray-500 font-mono">{stock.symbol}</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        
        {/* Price Section */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 pb-8 border-b border-gray-100 dark:border-gray-800">
           <div>
               <div className="text-sm text-gray-500 mb-1">Current Price</div>
               <div className="text-5xl sm:text-6xl font-black tracking-tighter">
                   {formatCurrency(stock.price || 0, stock.currency || 'USD')}
               </div>
           </div>
           <div className={`flex items-center gap-2 text-xl font-bold mb-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
               {isPositive ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
               <span>
                 {isPositive ? '+' : ''}{(stock.change || 0).toFixed(2)}
               </span>
               <span className="bg-current/10 px-2 py-0.5 rounded-md text-lg">
                 {(stock.changePercent || 0).toFixed(2)}%
               </span>
           </div>
        </div>

        {/* About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                
                {/* Fundamentals Grid */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="text-violet-600" />
                        Key Fundamentals
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard 
                            label="Market Cap" 
                            value={formatLargeNumber(stock.marketCap)} 
                            icon={PieChart}
                        />
                         <StatCard 
                            label="P/E Ratio" 
                            value={stock.peRatio ? stock.peRatio.toFixed(2) : '---'} 
                            subValue={stock.forwardPE ? `Fwd P/E: ${stock.forwardPE.toFixed(2)}` : undefined}
                            icon={BarChart3}
                        />
                        <StatCard 
                            label="EPS (TTM)" 
                            value={stock.eps ? stock.eps.toFixed(2) : '---'} 
                            icon={DollarSign}
                        />
                        <StatCard 
                            label="Beta" 
                            value={stock.beta ? stock.beta.toFixed(2) : '---'} 
                            icon={Activity}
                        />
                         <StatCard 
                            label="Div Yield" 
                            value={formatPercent(stock.dividendYield)} 
                            icon={PieChart}
                        />
                         <StatCard 
                            label="Profit Margin" 
                            value={formatPercent(stock.profitMargins)} 
                            icon={BarChart3}
                        />
                    </div>
                </section>

                <section className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-bold mb-4">Price Range (52 Week)</h2>
                    <div className="relative pt-6 pb-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full overflow-hidden">
                            {/* We can calculate a marker position if needed, but for now just static range text is fine */}
                             <div className="absolute top-0 left-0 text-sm font-semibold text-gray-500">
                                Low: {stock.fiftyTwoWeekLow?.toLocaleString()}
                             </div>
                             <div className="absolute top-0 right-0 text-sm font-semibold text-gray-500">
                                High: {stock.fiftyTwoWeekHigh?.toLocaleString()}
                             </div>
                        </div>
                    </div>
                </section>

                {stock.description && (
                    <section>
                        <h2 className="text-xl font-bold mb-3">About {stock.name}</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                            {stock.description}
                        </p>
                    </section>
                )}
            </div>

            {/* Sidebar / Profile */}
            <div className="space-y-6">
                 <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Company Profile</h3>
                    
                    {stock.sector && (
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sector</div>
                            <div className="font-medium flex items-center gap-2">
                                <Building2 size={16} className="text-violet-500" />
                                {stock.sector}
                            </div>
                        </div>
                    )}
                    
                    {stock.industry && (
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Industry</div>
                            <div className="font-medium text-sm">
                                {stock.industry}
                            </div>
                        </div>
                    )}

                     {stock.employees && (
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Employees</div>
                            <div className="font-medium flex items-center gap-2">
                                <Users size={16} className="text-blue-500" />
                                {stock.employees.toLocaleString()}
                            </div>
                        </div>
                    )}

                    {stock.website && (
                         <div className="pt-2">
                             <a 
                                href={stock.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                             >
                                 <Globe size={16} />
                                 Visit Website
                             </a>
                         </div>
                    )}
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
}

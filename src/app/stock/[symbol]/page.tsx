import { getStockDetails } from '@/actions/market';
import StockFundamentals from '@/components/StockFundamentals';
import BackButton from '@/components/BackButton';
import { Globe, Building2, Users, TrendingUp, TrendingDown } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-20">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-lg font-bold leading-tight">{stock.name}</h1>
            <div className="text-xs text-gray-500 font-mono">{stock.symbol}</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        
        {/* Price Section */}
        {/* Price Section */}
        <div className="pb-2">
           <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Current Price</div>
           <div className="flex items-baseline gap-3">
               <div className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                   {formatCurrency(stock.price || 0, stock.currency || 'USD')}
               </div>
               <div className={`flex items-center gap-2 text-lg font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                   <span className="flex items-center gap-1">
                        {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        {isPositive ? '+' : ''}{(stock.change || 0).toFixed(2)}
                   </span>
                   <span className="bg-current/10 px-2 py-0.5 rounded-md text-sm font-bold">
                     {(stock.changePercent || 0).toFixed(2)}%
                   </span>
               </div>
           </div>
        </div>

        {/* About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                
                {/* Fundamentals Grid (Client Component) */}
                <StockFundamentals stock={stock} />

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

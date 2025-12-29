import { getMarketData } from '@/services/marketData';
import LiveMarketTable from '@/components/LiveMarketTable';
import MarketHero from '@/components/MarketHero';
import { Globe, TrendingUp, Zap } from 'lucide-react';
import GoldRates from '@/components/GoldRates';
import { getScrapedGoldRate } from '@/actions/gold';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function GlobalMarketPage() {
  const indianSymbols = ['^NSEI', '^BSESN', '^NSEBANK'];
  const globalSymbols = ['^GSPC', '^DJI', '^IXIC', '^FTSE', '^N225'];
  const commoditySymbols = ['GC=F', 'SI=F', 'BTC-USD', 'USDINR=X'];
  
  const allSymbols = [...indianSymbols, ...globalSymbols, ...commoditySymbols];
  
  const [allMarketData, scrapedGold] = await Promise.all([
      getMarketData(allSymbols, '7d'),
      getScrapedGoldRate()
  ]);
  
  const indianIndicesData = allMarketData.filter(d => indianSymbols.includes(d.symbol));
  const globalIndicesData = allMarketData.filter(d => globalSymbols.includes(d.symbol));
  
  // Filter out USDINR from the table list, pass it separately to the component logic
  const commodityTableData = allMarketData.filter(d => commoditySymbols.includes(d.symbol) && d.symbol !== 'USDINR=X');
  
  const goldUsdData = allMarketData.find(d => d.symbol === 'GC=F');
  const usdInrData = allMarketData.find(d => d.symbol === 'USDINR=X');

  // Hero Data Selection: Nifty 50, S&P 500, Bitcoin, Gold, Silver
  const heroSymbols = ['^NSEI', '^GSPC', 'BTC-USD', 'GC=F', 'SI=F'];
  // Sort them in specific order if found
  const heroData = heroSymbols
    .map(s => allMarketData.find(d => d.symbol === s))
    .filter((d): d is NonNullable<typeof d> => !!d);


  // Gold Data Logic:
  // 1. Scraped Data (Priority)
  // 2. Calculated Data (Fallback)
  let goldRateProps: any = {};
  
  if (scrapedGold.success && scrapedGold.price1g22k && scrapedGold.price1g24k) {
      // Calculate implied close (Current - Change)
      const currentPrice24k = scrapedGold.price1g24k;
      const change24k = scrapedGold.change1g24k || 0;
      const prevPrice24k = currentPrice24k - change24k;
      
      const changePercent = prevPrice24k !== 0 ? (change24k / prevPrice24k) * 100 : 0;
      
      goldRateProps = {
          price1g22k: scrapedGold.price1g22k,
          price1g24k: scrapedGold.price1g24k,
          change1g24k: scrapedGold.change1g24k || 0,
          change1g22k: scrapedGold.change1g22k || 0,
          // Calculate an implied Spot Price (1 oz = 31.1035g) for the header
          spotPriceInr: currentPrice24k * 31.1035,
          change: change24k,
          changePercent: changePercent
      };
  } else if (goldUsdData && usdInrData) {
      goldRateProps = {
          spotPriceInr: goldUsdData.regularMarketPrice * usdInrData.regularMarketPrice,
          change: 0,
          changePercent: goldUsdData.regularMarketChangePercent
      };
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-6 h-6 text-violet-600" />
                    Global Markets
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Live overview of major indices and commodities</p>
            </div>

            {/* Hero Cards */}
            <MarketHero data={heroData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Indices */}
                <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <LiveMarketTable 
                        initialData={globalIndicesData} 
                        symbols={globalSymbols} 
                        title={
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Global Indices</h2>
                                    <p className="text-xs text-gray-500">Major international markets</p>
                                </div>
                            </div>
                        }
                    />
                </section>

                {/* Indian Indices */}
                <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <LiveMarketTable 
                        initialData={indianIndicesData} 
                        symbols={indianSymbols} 
                        title={
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                                    <img 
                                        src="https://flagcdn.com/w40/in.png" 
                                        alt="India"
                                        className="w-5 h-3.5 rounded shadow-sm object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Indian Indices</h2>
                                    <p className="text-xs text-gray-500">NSE & BSE Benchmark</p>
                                </div>
                            </div>
                        }
                    />
                </section>
            </div>

            {/* Commodities & Crypto Section */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <LiveMarketTable 
                    initialData={commodityTableData} 
                    symbols={commoditySymbols.filter(s => s !== 'USDINR=X')}
                    title={
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Commodities & Crypto</h2>
                                <p className="text-xs text-gray-500">Gold, Silver, Bitcoin & Major Assets</p>
                            </div>
                        </div>
                    }
                />
            </section>

            {/* Indian Gold Rates Section */}
            {(goldRateProps.price1g22k || goldRateProps.spotPriceInr) && (
                <div>
                     <div className="flex items-center gap-3 mb-4 px-1">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-xl">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gold Rates (India)</h2>
                            <p className="text-xs text-gray-500">Live market rates per gram</p>
                        </div>
                    </div>
                    <GoldRates {...goldRateProps} />
                </div>
            )}
        </div>
    </div>
  );
}

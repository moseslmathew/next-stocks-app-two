import { getMarketData } from '@/services/marketData';
import LiveMarketTable from '@/components/LiveMarketTable';
import { Globe } from 'lucide-react';
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
  
  const indicesSymbols = [...indianSymbols, ...globalSymbols];
  const indicesData = allMarketData.filter(d => indicesSymbols.includes(d.symbol));
  
  // Filter out USDINR from the table list, pass it separately to the component logic
  const commodityTableData = allMarketData.filter(d => commoditySymbols.includes(d.symbol) && d.symbol !== 'USDINR=X');
  
  const goldUsdData = allMarketData.find(d => d.symbol === 'GC=F');
  const usdInrData = allMarketData.find(d => d.symbol === 'USDINR=X');

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


      <div className="space-y-12">
        <section>
            <LiveMarketTable 
                initialData={indicesData} 
                symbols={indicesSymbols} 
                title={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                             <img 
                                src="https://flagcdn.com/w40/in.png" 
                                alt="India"
                                className="w-5 h-3.5 rounded shadow-sm object-cover"
                            />
                            <Globe className="w-5 h-5 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Global Market Indices</h2>
                    </div>
                }
            />
        </section>

        <section>
            <LiveMarketTable 
                initialData={commodityTableData} 
                symbols={commoditySymbols.filter(s => s !== 'USDINR=X')}
                title={
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-bold text-xs">
                            $
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Commodities & Crypto</h2>
                    </div>
                }
            >
                 {/* Indian Gold Rates Section */}
                {(goldRateProps.price1g22k || goldRateProps.spotPriceInr) && (
                    <div className="mb-6 mt-2">
                        <GoldRates 
                            {...goldRateProps}
                        />
                    </div>
                )}
            </LiveMarketTable>
        </section>
      </div>
    </div>
  );
}

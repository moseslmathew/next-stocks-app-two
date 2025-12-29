
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface MarketData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  shortName: string;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  marketState: string; // 'PRE' | 'REGULAR' | 'POST' | 'CLOSED'
  quoteType: string; // 'EQUITY' | 'CRYPTOCURRENCY' | etc
  exchange: string; // 'NSE', 'BSE', 'NSI', etc
  sparkline: number[];
  volumeSparkline: number[];
  timestamps: number[];
  regularMarketTime?: number; // timestamp of the price
}

export async function getMarketData(symbols: string[], range: '1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '3y' | '5y' | 'max' | '7d' | '52w' = '1d', includeHistory = true, keepPreviousSessions = false) {
  try {
    const quotesPromise = yahooFinance.quote(symbols);
    
    // Fetch historical data ONLY if requested
    let historyMap: Map<string, { sparkline: number[], volumeSparkline: number[], timestamps: number[] }> = new Map();

    if (includeHistory) {
      const historyPromises = symbols.map(async (symbol) => {
          try {
              const now = new Date();
              let queryOptions: any = {};

              // Default standard interval
              let interval = '5m';
              let rangeStr = range;

              if (range === '1d') {
                  const startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); 
                  queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '1m', includePrePost: false };
              } else if (range === '7d' || range === '1w') {
                  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '15m' };
              } else if (range === '1m') {
                  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '60m' };
              } else if (['3m', '1y', '52w', '2y', '3y', '5y'].includes(range)) {
                  let days = 365;
                  if (range === '3m') days = 90;
                  if (range === '2y') days = 730;
                  if (range === '3y') days = 1095;
                  if (range === '5y') days = 1825;
                  
                  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                  queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '1d' };
              } else if (range === 'max') {
                  queryOptions = { period1: '1980-01-01', interval: '1wk' };
              } else {
                  // Fallback
                  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '5m', includePrePost: false };
              }

              const result = await yahooFinance.chart(symbol, queryOptions);
              const chartData = result as any;
              
              const quotesOrigin = chartData.quotes;
              let quotes = quotesOrigin;

              // Filter for '1d' to only show the last trading session (Today)
              if (range === '1d' && quotes && quotes.length > 0) {
                   const lastQuote = quotes[quotes.length - 1];
                   if (lastQuote && lastQuote.date) {
                       const lastDate = new Date(lastQuote.date);
                       // Filter to keep only points from the same UTC day as the last point
                       // This works well for US and Indian markets which are within a single UTC day
                       quotes = quotes.filter((q: any) => {
                           const qDate = new Date(q.date);
                           return qDate.getUTCDate() === lastDate.getUTCDate() &&
                                  qDate.getUTCMonth() === lastDate.getUTCMonth() &&
                                  qDate.getUTCFullYear() === lastDate.getUTCFullYear();
                       });
                   }
              }

              return { 
                  symbol, 
                  sparkline: quotes
                    .filter((q: any) => typeof q.close === 'number' && !isNaN(new Date(q.date).getTime()))
                    .map((q: any) => q.close),
                  volumeSparkline: quotes
                    .filter((q: any) => typeof q.close === 'number' && !isNaN(new Date(q.date).getTime()))
                    .map((q: any) => q.volume || 0),
                  timestamps: quotes
                    .filter((q: any) => typeof q.close === 'number' && !isNaN(new Date(q.date).getTime()))
                    .map((q: any) => new Date(q.date).getTime())
              };
          } catch (e) {
              return { symbol, sparkline: [], volumeSparkline: [], timestamps: [] };
          }
      });

      const allHistories = await Promise.all(historyPromises);
      historyMap = new Map(allHistories.map(h => [h.symbol, { sparkline: h.sparkline, volumeSparkline: h.volumeSparkline, timestamps: h.timestamps }]));
    }

    const quotes = await quotesPromise;
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return quotesArray.map((quote: any) => {
        // Use empty default if history was skipped
        const history = historyMap.get(quote.symbol) || { sparkline: [], volumeSparkline: [], timestamps: [] };
        
        // Append live price point if it's newer than the last historical point
        let finalSparkline = history.sparkline;
        let finalTimestamps = history.timestamps;
        let finalVolumeSparkline = history.volumeSparkline;

        const liveTime = quote.regularMarketTime ? new Date(quote.regularMarketTime).getTime() : Date.now();
        const lastHistoryTime = finalTimestamps.length > 0 ? finalTimestamps[finalTimestamps.length - 1] : 0;

        if (liveTime > lastHistoryTime) {
            finalSparkline = [...finalSparkline, quote.regularMarketPrice ?? 0];
            finalTimestamps = [...finalTimestamps, liveTime];
            // Volume for live point is often unknown in quote, default to 0 or repeat last? 0 is safer.
            finalVolumeSparkline = [...finalVolumeSparkline, 0];
        }

        return {
            symbol: quote.symbol,
            regularMarketPrice: quote.regularMarketPrice ?? 0,
            regularMarketChange: quote.regularMarketChange ?? 0,
            regularMarketChangePercent: quote.regularMarketChangePercent ?? 0,
            shortName: quote.symbol === 'GC=F' ? 'Gold Futures' : (quote.symbol === 'SI=F' ? 'Silver Futures' : (quote.shortName ?? quote.symbol)),
            regularMarketDayHigh: quote.regularMarketDayHigh ?? 0,
            regularMarketDayLow: quote.regularMarketDayLow ?? 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
            currency: quote.currency || 'USD',
            marketState: quote.marketState || 'CLOSED',
            quoteType: quote.quoteType || 'EQUITY', 
            exchange: quote.exchange || 'UNKNOWN',
            regularMarketTime: liveTime,
            sparkline: finalSparkline,
            volumeSparkline: finalVolumeSparkline,
            timestamps: finalTimestamps
        };
    });
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return [];
  }
}

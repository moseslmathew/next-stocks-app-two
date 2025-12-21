
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
}

export async function getMarketData(symbols: string[], range: '1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '5y' | 'max' | '7d' | '52w' = '1d', includeHistory = true) {
  try {
    const quotesPromise = yahooFinance.quote(symbols);
    
    // Fetch historical data ONLY if requested
    let historyMap: Map<string, { sparkline: number[], volumeSparkline: number[], timestamps: number[] }> = new Map();

    if (includeHistory) {
      const chunkArray = (arr: string[], size: number) => {
          return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
              arr.slice(i * size, i * size + size)
          );
      };

      const chunks = chunkArray(symbols, 5);
      const allHistories: { symbol: string, sparkline: number[], volumeSparkline: number[], timestamps: number[] }[] = [];

      for (const chunk of chunks) {
          const chunkPromises = chunk.map(async (symbol) => {
              try {
                  const now = new Date();
                  let queryOptions: any = {};
                  let filterLastSession = false;

                  if (range === '1d') {
                      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days back to find last session
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '5m' };
                      filterLastSession = true;
                  } else if (range === '7d' || range === '1w') {
                      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '15m' };
                  } else if (range === '1m') {
                      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '60m' };
                  } else if (range === '3m') {
                      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '1d' };
                  } else if (range === '1y' || range === '52w') {
                      const startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '1d' };
                  } else if (range === '2y') {
                      const startDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '1wk' };
                  } else if (range === '5y') {
                      const startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
                      queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '1wk' };
                  } else if (range === 'max') {
                      queryOptions = { period1: '1980-01-01', interval: '1mo' };
                  } else {
                       // Default fallback
                       const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                       queryOptions = { period1: startDate.toISOString().split('T')[0], interval: '5m' };
                  }

                  const result = await yahooFinance.chart(symbol, queryOptions);
                  const chartData = result as any;
                  
                  if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
                       return { symbol, sparkline: [], volumeSparkline: [], timestamps: [] };
                  }

                  let quotes = chartData.quotes;

                  if (filterLastSession) {
                      const lastQuote = quotes[quotes.length - 1];
                      if (lastQuote && lastQuote.date) {
                          const lastDate = new Date(lastQuote.date);
                          const lastDayStr = lastDate.toISOString().split('T')[0];
                          quotes = quotes.filter((q: any) => new Date(q.date).toISOString().split('T')[0] === lastDayStr);
                      }
                  }

                  return { 
                      symbol, 
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      sparkline: quotes.map((q: any) => q.close).filter((c: any) => typeof c === 'number'),
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      volumeSparkline: quotes.map((q: any) => q.volume).filter((v: any) => typeof v === 'number'),
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      timestamps: quotes.map((q: any) => new Date(q.date).getTime()).filter((t: any) => !isNaN(t))
                  };
              } catch (e) {
                  // Don't log expected errors for crypto/etc if they don't support period1
                  // console.error(`Failed to fetch history for ${symbol} (${range}):`, e);
                  return { symbol, sparkline: [], volumeSparkline: [], timestamps: [] };
              }
          });

          const chunkResults = await Promise.all(chunkPromises);
          allHistories.push(...chunkResults);
      }

      historyMap = new Map(allHistories.map(h => [h.symbol, { sparkline: h.sparkline, volumeSparkline: h.volumeSparkline, timestamps: h.timestamps }]));
    }

    const quotes = await quotesPromise;
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return quotesArray.map((quote: any) => {
        // Use empty default if history was skipped
        const history = historyMap.get(quote.symbol) || { sparkline: [], volumeSparkline: [], timestamps: [] };
        return {
            symbol: quote.symbol,
            regularMarketPrice: quote.regularMarketPrice ?? 0,
            regularMarketChange: quote.regularMarketChange ?? 0,
            regularMarketChangePercent: quote.regularMarketChangePercent ?? 0,
            shortName: quote.shortName ?? quote.symbol,
            regularMarketDayHigh: quote.regularMarketDayHigh ?? 0,
            regularMarketDayLow: quote.regularMarketDayLow ?? 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
            currency: quote.currency || 'USD',
            marketState: quote.marketState || 'CLOSED',
            quoteType: quote.quoteType || 'EQUITY', 
            exchange: quote.exchange || 'UNKNOWN',
            sparkline: history.sparkline,
            volumeSparkline: history.volumeSparkline,
            timestamps: history.timestamps
        };
    });
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return [];
  }
}

'use server';

import YahooFinance from 'yahoo-finance2';
import { getMarketData } from '@/services/marketData';

const yahooFinance = new YahooFinance();

export async function searchStocks(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const results = await yahooFinance.search(query);
    return results.quotes
      .filter((quote) => quote.isYahooFinance)
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange,
        type: quote.quoteType,
      }));
  } catch (error) {
    console.error('Stock search failed:', error);
    return [];
  }
}

export async function getWatchlistData(symbols: string[], range: '1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '5y' | 'max' | '7d' | '52w' = '1d') {
  if (!symbols.length) return [];
  return await getMarketData(symbols, range);
}

export async function getBatchStockQuotes(symbols: string[]) {
  if (!symbols.length) return [];
  // Fetch only current price/state, no history needed for refresh
  return await getMarketData(symbols, '1d', false);
}

export async function getStockQuote(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      open: quote.regularMarketOpen,
      prevClose: quote.regularMarketPreviousClose,
      marketCap: quote.marketCap,
      currency: quote.currency || 'USD',
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

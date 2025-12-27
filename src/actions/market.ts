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

export async function getWatchlistData(symbols: string[], range: '1d' | '1w' | '1m' | '3m' | '1y' | '2y' | '3y' | '5y' | 'max' | '7d' | '52w' = '1d', keepPreviousSessions = false) {
  if (!symbols.length) return [];
  return await getMarketData(symbols, range, true, keepPreviousSessions);
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
export async function getStockDetails(symbol: string) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryDetail',
        'defaultKeyStatistics',
        'assetProfile',
        'financialData'
      ]
    });

    const price = result.price;
    const summary = result.summaryDetail;
    const stats = result.defaultKeyStatistics;
    const profile = result.assetProfile;
    const financial = result.financialData;

    return {
      symbol: symbol,
      name: price?.shortName || price?.longName || symbol,
      price: price?.regularMarketPrice,
      currency: price?.currency,
      change: price?.regularMarketChange,
      changePercent: price?.regularMarketChangePercent,
      
      // Fundamentals
      marketCap: price?.marketCap,
      peRatio: summary?.trailingPE,
      forwardPE: summary?.forwardPE,
      eps: stats?.trailingEps,
      beta: summary?.beta,
      dividendYield: summary?.dividendYield,
      profitMargins: financial?.profitMargins,
      bookValue: stats?.bookValue,
      priceToBook: stats?.priceToBook,
      
      // Range
      fiftyTwoWeekHigh: summary?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: summary?.fiftyTwoWeekLow,
      
      // Profile
      sector: profile?.sector,
      industry: profile?.industry,
      description: profile?.longBusinessSummary,
      website: profile?.website,
      employees: profile?.fullTimeEmployees,
    };
  } catch (error) {
    console.error(`Failed to fetch details for ${symbol}:`, error);
    return null;
  }
}

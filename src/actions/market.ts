'use server';

import YahooFinance from 'yahoo-finance2';
import { getMarketData, MarketData } from '@/services/marketData';

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
    // Fetch data in parallel
    const [
      quoteResult,
      incomeAnnualResult,
      incomeQuarterlyResult, 
      balanceAnnualResult,
      balanceQuarterlyResult
    ] = await Promise.all([
      yahooFinance.quoteSummary(symbol, { 
        modules: [
          'price', 
          'summaryDetail', 
          'defaultKeyStatistics', 
          'assetProfile',
          'financialData',
          'quoteType'
        ] 
      }),
      // Income Statement
      // @ts-ignore
      yahooFinance.fundamentalsTimeSeries(symbol, { period1: '2019-01-01', module: 'financials', type: 'annual' }, { validateResult: false }).catch(e => {
        console.error(`Income Annual fetch failed for ${symbol}:`, e.message);
        return [];
      }),
      // @ts-ignore
      yahooFinance.fundamentalsTimeSeries(symbol, { period1: '2020-01-01', module: 'financials', type: 'quarterly' }, { validateResult: false }).catch(e => {
        console.error(`Income Quarterly fetch failed for ${symbol}:`, e.message);
        return [];
      }),
      
      // Balance Sheet
      // @ts-ignore
      yahooFinance.fundamentalsTimeSeries(symbol, { period1: '2019-01-01', module: 'balance-sheet', type: 'annual' }, { validateResult: false }).catch(e => {
        console.error(`Balance Annual fetch failed for ${symbol}:`, e.message);
        return [];
      }),
      // @ts-ignore
      yahooFinance.fundamentalsTimeSeries(symbol, { period1: '2020-01-01', module: 'balance-sheet', type: 'quarterly' }, { validateResult: false }).catch(e => {
        console.error(`Balance Quarterly fetch failed for ${symbol}:`, e.message);
        return [];
      })
    ]);

    const price = quoteResult.price;
    const summary = quoteResult.summaryDetail;
    const stats = quoteResult.defaultKeyStatistics;
    const profile = quoteResult.assetProfile;
    const financial = quoteResult.financialData;
    const quoteType = quoteResult.quoteType;
    
    // Helper to safely get value from multiple potential keys
    const getValue = (obj: any, keys: string[]) => {
        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null) return obj[key];
        }
        return null;
    };

    // Filter and sort helper
    const processSeries = (data: any[]) => {
        return (data || [])
            .filter(item => {
                if (!item.date) return false;
                const d = new Date(item.date);
                // Filter out invalid dates or dates near epoch (Jan 1 1970) which indicate null data
                return !isNaN(d.getTime()) && d.getFullYear() > 1980;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const mapIncome = (data: any[]) => processSeries(data).map(item => ({
        date: item.date,
        revenue: getValue(item, ['totalRevenue', 'operatingRevenue', 'revenue']),
        netIncome: getValue(item, ['netIncome', 'netIncomeCommonStockholders', 'normalizedIncome']),
        grossProfit: getValue(item, ['grossProfit', 'grossProfit']),
        operatingIncome: getValue(item, ['operatingIncome', 'operatingProfit', 'pretaxIncome', 'EBIT'])
    }));

    const mapBalance = (data: any[]) => processSeries(data).map(item => ({
        date: item.date,
        totalAssets: getValue(item, ['totalAssets', 'assets']),
        totalLiabilities: getValue(item, ['totalLiabilitiesNetMinorityInterest', 'totalLiabilities', 'liabilities']),
        totalEquity: getValue(item, ['stockholdersEquity', 'totalEquityGrossMinorityInterest', 'equity', 'totalEquity', 'commonStockEquity']),
        cash: getValue(item, ['cashAndCashEquivalents', 'cashEquivalents', 'cash', 'cashFinancial'])
    }));

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
      roe: financial?.returnOnEquity,
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
      listingDate: stats?.firstTradeDateEpochUtc || quoteType?.firstTradeDateEpochUtc,

      // Financials
      // Financials
      financials: {
        incomeStatement: {
            annual: mapIncome(incomeAnnualResult as any[]),
            quarterly: mapIncome(incomeQuarterlyResult as any[])
        },
        balanceSheet: {
            annual: mapBalance(balanceAnnualResult as any[]),
            quarterly: mapBalance(balanceQuarterlyResult as any[])
        }
      }
    };
  } catch (error) {
    console.error(`Failed to fetch details for ${symbol}:`, error);
    return null;
  }
}

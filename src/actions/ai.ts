'use server';

import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { AI_PROVIDER, GOOGLE_MODEL, OPENAI_MODEL } from '@/lib/ai-config';

// Helper to get the active model
function getActiveModel() {
  if (AI_PROVIDER === 'openai') {
    return createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })(OPENAI_MODEL);
  }
  return google(GOOGLE_MODEL);
}

export interface SentimentResult {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number; // 0 to 100
  summary: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface MarketPrediction {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  outlook: string;
  factors: string[];
  seasonality: string;
  centralBankAnalysis: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export type AIResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; isQuotaExceeded: boolean };

const sentimentSchema = z.object({
  sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
  score: z.number().min(0).max(100),
  summary: z.string(),
});

// Used in src/components/NewsModal.tsx to analyze sentiment of specific stock news
export async function analyzeSentiment(symbol: string, headlines: string[]): Promise<AIResult<SentimentResult>> {
  if (!headlines.length) {
      return { success: false, error: 'No headlines provided', isQuotaExceeded: false };
  }

  try {
    const limitedHeadlines = headlines.slice(0, 15); // Increased to 15 as requested, caller should filter by date
    const prompt = `
      Analyze the sentiment for the stock "${symbol}" based on the following news headlines:
      
      ${limitedHeadlines.map(h => `- ${h}`).join('\n')}

      Provide a sentiment classification (Bullish, Bearish, or Neutral), a sentiment score from 0 (Extremely Bearish) to 100 (Extremely Bullish), and a very brief 1-sentence summary explaining why.
    `;

    const { object, usage } = await generateObject({
      model: getActiveModel(), // Use configured model
      schema: sentimentSchema,
      prompt: prompt,
      maxRetries: 0,
    });

    // Cast usage to any to bypass potential type mismatches with different SDK versions
    const usageAny = usage as any;
    const usageInfo = usage ? {
        promptTokens: usageAny.promptTokens || usageAny.promptTokenCount || 0,
        completionTokens: usageAny.completionTokens || usageAny.completionTokenCount || usageAny.candidatesTokenCount || 0,
        totalTokens: usage.totalTokens || usageAny.totalTokenCount || 0,
    } : undefined;

    const usedModel = (AI_PROVIDER === 'openai' ? OPENAI_MODEL : GOOGLE_MODEL).replace(/^models\//, '');

    return { success: true, data: { ...object, usage: usageInfo, model: usedModel } };
  } catch (error: any) {
    const isQuotaExceeded = error.message?.includes('429') || 
                           error.message?.includes('Quota exceeded') || 
                           error.status === 429 ||
                           error.toString().includes('429');

    if (!isQuotaExceeded) {
        console.error('AI Sentiment Analysis Failed:', error);
    } 

    return { success: false, error: 'Failed to analyze sentiment', isQuotaExceeded };
  }
}

// Inner function to fetch prediction, cached below
async function fetchMarketPrediction(region: 'INDIA' | 'US'): Promise<AIResult<MarketPrediction>> {
  try {
    // 1. Fetch Market Context (Indices)
    const { getMarketData } = await import('@/services/marketData');
    
    // Define region-specific configuration
    const config = region === 'INDIA' 
        ? {
            indices: ['^NSEI', '^BSESN', 'GC=F'],
            newsTerm: 'Indian Stock Market',
            newsCategory: 'Sensex Nifty',
            promptContext: 'Indian Stock Market (Nifty/Sensex)',
          }
        : {
            indices: ['^GSPC', '^IXIC', '^DJI', 'GC=F', '^VIX'], // S&P 500, Nasdaq, Dow, Gold, VIX
            newsTerm: 'US Stock Market',
            newsCategory: 'Wall Street',
            promptContext: 'US Stock Market (S&P 500/Nasdaq/Dow)',
          };

    const indices = await getMarketData(config.indices, '1d', false);
    
    // 2. Fetch Market News
    const { getStockNews } = await import('./news');
    const newsItems = await getStockNews(config.newsTerm, config.newsCategory);
    
    // Filter for news from the last 30 days to ensure relevance and save quota
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentNews = newsItems.filter(item => {
        const pubDate = new Date(item.pubDate);
        return pubDate >= thirtyDaysAgo;
    });

    // Take top 15 of the recent ones, or just top 15 if recent list is empty (fallback)
    const itemsToUse = recentNews.length > 0 ? recentNews : newsItems;
    const headlines = itemsToUse.slice(0, 15).map(n => n.title); 

    const marketSummary = indices.map(i => 
      `${i.shortName} (${i.symbol}): Price ${i.regularMarketPrice}, Change ${i.regularMarketChangePercent?.toFixed(2)}%`
    ).join('\n');

    const prompt = `
      As an expert financial analyst, predict the market movement for the *next trading session* (tomorrow/next open) for the ${config.promptContext}.
      
      Market Data:
      ${marketSummary}

      Recent News Headlines (Last 30 Days):
      ${headlines.map(h => `- ${h}`).join('\n')}

      Current Date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

      Based on this data, provide:
      1. Overall Sentiment (Bullish/Bearish/Neutral)
      2. Confidence Score (0-100).
      3. A concise Outlook paragraph (max 3 sentences).
      4. Key Factors (max 3 bullet points).
      5. Seasonality Insight for this month/season.
      6. Central Bank/Macro Policy Impact (Fed/RBI).
         - For US, focus on Fed. For India, focuses on RBI and Fed (since Fed impacts global).
    `;

    const { object, usage } = await generateObject({
      model: getActiveModel(),
      schema: z.object({
        sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
        score: z.number().min(0).max(100),
        outlook: z.string(),
        factors: z.array(z.string()),
        seasonality: z.string(),
        centralBankAnalysis: z.string(),
      }),
      prompt: prompt,
      maxRetries: 0,
    });

    // Cast usage to any to bypass potential type mismatches with different SDK versions
    const usageAny = usage as any;
    const usageInfo = usage ? {
        promptTokens: usageAny.promptTokens || usageAny.promptTokenCount || 0,
        completionTokens: usageAny.completionTokens || usageAny.completionTokenCount || usageAny.candidatesTokenCount || 0,
        totalTokens: usage.totalTokens || usageAny.totalTokenCount || 0,
    } : undefined;

    const usedModel = (AI_PROVIDER === 'openai' ? OPENAI_MODEL : GOOGLE_MODEL).replace(/^models\//, '');

    return { success: true, data: { ...object, usage: usageInfo, model: usedModel } };

  } catch (error: any) {
    const isQuotaExceeded = error.message?.includes('429') || 
                           error.message?.includes('Quota exceeded') || 
                           error.status === 429 ||
                           error.toString().includes('429');
    
    if (!isQuotaExceeded) {
        console.error(`Market Prediction Failed for ${region}:`, error);
    }
    
    return { success: false, error: 'Failed to generate prediction', isQuotaExceeded };
  }
}

// Cached versions
export const getIndiaMarketPrediction = unstable_cache(
  async () => fetchMarketPrediction('INDIA'),
  ['market-prediction-india'],
  { revalidate: 1800, tags: ['market-prediction-india'] }
);

export const getUSMarketPrediction = unstable_cache(
  async () => fetchMarketPrediction('US'),
  ['market-prediction-us'],
  { revalidate: 1800, tags: ['market-prediction-us'] }
);

// Fallback for existing calls - defaults to India (or we could deprecate this)
export const getMarketPrediction = getIndiaMarketPrediction;

// Manual refresh action
export async function refreshMarketPrediction() {
  revalidatePath('/', 'layout');
  return { success: true };
}

// --- Investing Quotes ---

import { INVESTING_QUOTES } from '@/data/quotes';

export interface InvestingQuote {
  text: string;
  author: string;
  explanation?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

async function fetchInvestingQuote(): Promise<AIResult<InvestingQuote>> {
  try {
    const randomIndex = Math.floor(Math.random() * INVESTING_QUOTES.length);
    const quote = INVESTING_QUOTES[randomIndex];

    return { 
        success: true, 
        data: { 
            text: quote.text, 
            author: quote.author,
            explanation: quote.explanation,
            model: 'static-curated-list' 
        } 
    };

  } catch (error: any) {
     return { success: false, error: 'Failed to fetch quote', isQuotaExceeded: false };
  }
}

// Cache for 10 minutes (600 seconds) so all users see the same daily/hourly quote, 
// or maybe 1 minute if we want it to feel fresh to the specific user session more often? 
// The user said "use ai to fetch this every 10 minutes" on the frontend.
// I will not cache it aggressively on the server so that the client-side refresh actually gets a new one.
// But to prevent abuse, maybe a short cache. Let's do 60 seconds server cache.
export const getInvestingQuote = unstable_cache(
    async () => fetchInvestingQuote(),
    ['investing-quote'],
    { revalidate: 60, tags: ['investing-quote'] } 
);

export async function refreshInvestingQuote() {
  revalidateTag('investing-quote');
  return { success: true };
}

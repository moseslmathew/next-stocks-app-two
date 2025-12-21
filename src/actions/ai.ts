'use server';

import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { unstable_cache, revalidateTag } from 'next/cache';

// Configuration for AI Provider
// Options: 'google' | 'openai'
const AI_PROVIDER: 'google' | 'openai' = 'openai'; 


// Model Configuration
const GOOGLE_MODEL = 'models/gemini-3-flash-preview';
const OPENAI_MODEL = 'gpt-4o';


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
      schema: z.object({
        sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
        score: z.number().min(0).max(100),
        summary: z.string(),
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
        console.error('AI Sentiment Analysis Failed:', error);
    } 

    return { success: false, error: 'Failed to analyze sentiment', isQuotaExceeded };
  }
}

// Inner function to fetch prediction, cached below
async function fetchMarketPrediction(): Promise<AIResult<MarketPrediction>> {
  try {
    // 1. Fetch Market Context (Indices)
    const { getMarketData } = await import('@/services/marketData');
    const indices = await getMarketData(['^NSEI', '^BSESN', '^GSPC', 'GC=F'], '1d', false);
    
    // 2. Fetch Market News
    const { getStockNews } = await import('./news');
    const newsItems = await getStockNews('Indian Stock Market', 'Sensex Nifty');
    
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
      As an expert financial analyst, predict the market movement for the *next trading session* (tomorrow/next open) for the Indian Stock Market (Nifty/Sensex).

      Market Data:
      ${marketSummary}

      Recent News Headlines (Last 30 Days):
      ${headlines.map(h => `- ${h}`).join('\n')}

      Based on this data, provide:
      1. Overall Sentiment (Bullish/Bearish/Neutral)
      2. Confidence Score (0-100, where 0 is Crash/Deep Bearish, 50 is Neutral, 100 is Rocket/Strong Bullish).
      3. A concise Outlook paragraph explaining the prediction (max 3 sentences).
      4. Key Factors influencing this prediction (max 3 bullet points).
    `;

    const { object, usage } = await generateObject({
      model: getActiveModel(),
      schema: z.object({
        sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
        score: z.number().min(0).max(100),
        outlook: z.string(),
        factors: z.array(z.string()),
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
        console.error('Market Prediction Failed:', error);
    }
    
    return { success: false, error: 'Failed to generate prediction', isQuotaExceeded };
  }
}

// Cached version of the prediction
export const getMarketPrediction = unstable_cache(
  async () => fetchMarketPrediction(),
  ['market-prediction'],
  { revalidate: 1800, tags: ['market-prediction'] } // Cache for 30 minutes
);

// Manual refresh action
export async function refreshMarketPrediction() {
  revalidateTag('market-prediction', 'default');
  return { success: true };
}

// --- Investing Quotes ---

import { INVESTING_QUOTES } from '@/data/quotes';

export interface InvestingQuote {
  text: string;
  author: string;
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

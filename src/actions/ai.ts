'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export interface SentimentResult {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number; // 0 to 100
  summary: string;
}

export async function analyzeSentiment(symbol: string, headlines: string[]): Promise<SentimentResult | null> {
  if (!headlines.length) return null;

  try {
    const prompt = `
      Analyze the sentiment for the stock "${symbol}" based on the following news headlines:
      
      ${headlines.map(h => `- ${h}`).join('\n')}

      Provide a sentiment classification (Bullish, Bearish, or Neutral), a sentiment score from 0 (Extremely Bearish) to 100 (Extremely Bullish), and a very brief 1-sentence summary explaining why.
    `;

    const { object } = await generateObject({
      model: google('models/gemini-flash-latest'), // Use generic stable alias to avoid quota/overload issues
      schema: z.object({
        sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']),
        score: z.number().min(0).max(100),
        summary: z.string(),
      }),
      prompt: prompt,
    });

    return object;
  } catch (error) {
    console.error('AI Sentiment Analysis Failed:', error);
    return null;
  }
}

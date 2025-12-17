'use server';

import Parser from 'rss-parser';

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
}

export async function getStockNews(query: string, fallbackQuery?: string): Promise<NewsItem[]> {
  try {
    // Helper to fetch news for a given query
    const fetchNews = async (q: string) => {
        // Clean up the query to improve search results
        // Remove common legal suffixes like Limited, Ltd, Inc, Corp, etc.
        const cleanQuery = q
          .replace(/\s+(?:limited|ltd\.?|inc\.?|incorporated|corp\.?|corporation|plc\.?|sa|ag)$/i, '')
          .trim();
    
        // Google News RSS URL using Indian context as requested
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=en-IN&gl=IN&ceid=IN:en`;
        const feed = await parser.parseURL(url);
        return feed.items;
    };

    let items = await fetchNews(query);

    // If no items and fallback provided, try fallback
    if (items.length === 0 && fallbackQuery) {
        console.log(`No news found for "${query}", trying fallback "${fallbackQuery}"`);
        items = await fetchNews(fallbackQuery);
    }

    return items.map((item) => ({
      title: item.title || 'No Title',
      link: item.link || '#',
      pubDate: item.pubDate || new Date().toISOString(),
      source: item.source || 'Google News',
      snippet: item.contentSnippet || ''
    })); 
  } catch (error) {
    console.error(`Failed to fetch news for ${query} (fallback: ${fallbackQuery}):`, error);
    return [];
  }
}

export async function getBatchStockNews(items: { name: string, symbol: string }[]): Promise<Record<string, NewsItem[]>> {
    const results: Record<string, NewsItem[]> = {};
    
    // Process in chunks to be nice to the API
    const chunkSize = 3; // Conservative chunk size
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const promises = chunk.map(async (item) => {
            // Add a small random delay to avoid burst patterns
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
            const news = await getStockNews(item.name, item.symbol);
            return { symbol: item.symbol, news: news.slice(0, 3) }; // Top 3 only
        });
        
        const chunkResults = await Promise.all(promises);
        chunkResults.forEach(r => {
            if (r.news.length > 0) {
                results[r.symbol] = r.news;
            }
        });
    }
    
    return results;
}

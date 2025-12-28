'use server';

import { getMarketData } from "@/services/marketData";

export async function getIndicesData() {
    const symbols = [
        '^NSEI',    // Nifty 50
        '^BSESN',   // Sensex
        '^NSEBANK', // Nifty Bank
        // '^CNXIT',   // Nifty IT (Yahoo symbol might vary, let's try this or disable if fails)
        '^GSPC',    // S&P 500
        '^IXIC',    // Nasdaq
        'GC=F'      // Gold
    ];
    
    // Fetch with no history for speed, just latest price/change
    const data = await getMarketData(symbols, '1d', false);
    return data;
}

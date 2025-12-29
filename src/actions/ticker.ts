'use server';

import { getMarketData } from "@/services/marketData";

export async function getIndicesData() {
    const symbols = [
        '^NSEI',    // Nifty 50
        '^BSESN',   // Sensex
        '^NSEBANK', // Nifty Bank
        'ICICI500.NS', // Nifty 500 Proxy
        'MOM100.NS',   // Nifty Midcap 100 Proxy
        '^INDIAVIX', // India VIX
        '^GSPC',    // S&P 500
        '^IXIC',    // Nasdaq
        'GC=F'      // Gold
    ];
    
    // Fetch with no history for speed, just latest price/change
    const data = await getMarketData(symbols, '1d', false);
    return data;
}

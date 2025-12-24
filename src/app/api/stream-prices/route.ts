import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getBatchStockQuotes } from '@/actions/market';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ message: 'No symbols provided' }, { status: 400 });
    }

    // Run for ~9 seconds to stay within Vercel Hobby limits (10s)
    // In a real production app with Pro plan or a custom worker, this could run indefinitely
    const STREAM_DURATION = 9000;
    const INTERVAL = 2000;
    const iterations = Math.floor(STREAM_DURATION / INTERVAL);

    // console.log(`Starting stream for ${symbols.length} symbols...`);

    for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
      
        try {
            const data = await getBatchStockQuotes(symbols);
            
            // Trigger Pusher event
            // Channel: 'market-data'
            // Event: 'update'
            await pusherServer.trigger('market-data', 'update', data);
        } catch (err) {
            console.error('Error fetching/pushing data:', err);
        }

        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, INTERVAL - elapsed);
        
        if (i < iterations - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return NextResponse.json({ success: true, message: 'Stream completed' });
  } catch (error) {
    console.error('Stream error:', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}

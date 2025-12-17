'use client';

import { useState, useEffect } from 'react';

export function MarketStatusBadge({ market }: { market: 'IN' | 'US' }) {
    const [status, setStatus] = useState<'OPEN' | 'CLOSED' | null>(null);

    useEffect(() => {
        const checkStatus = () => {
            const now = new Date();
            if (market === 'IN') {
                 const istTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
                 const [h, m] = istTime.split(':').map(Number);
                 const val = h * 100 + m;
                 setStatus(val >= 915 && val < 1530 ? 'OPEN' : 'CLOSED');
            } else {
                 const estTime = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
                 const [h, m] = estTime.split(':').map(Number);
                 const val = h * 100 + m;
                 setStatus(val >= 930 && val < 1600 ? 'OPEN' : 'CLOSED');
            }
        };
        
        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [market]);

    if (!status) return null; // Avoid hydration mismatch

    if (status === 'CLOSED') { 
        return <span className="text-xs ml-3 px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 font-normal align-middle">Market Closed</span>
    }

    return <span className="text-xs ml-3 px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 font-normal align-middle">Market Open</span>
}

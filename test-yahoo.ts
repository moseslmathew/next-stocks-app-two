import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  const symbol = 'AAPL';
  const now = new Date();
  const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days back
  const period1 = startDate.toISOString().split('T')[0];
  console.log('Querying period1:', period1);

  try {
    const result = await yahooFinance.chart(symbol, { period1, interval: '2m' });
    
    console.log('Quotes length:', result.quotes ? result.quotes.length : 0);
    if (result.quotes && result.quotes.length > 0) {
        // Find the last session start
        // Look for gap
        let lastSessionStart = 0;
        for (let i = result.quotes.length - 1; i > 0; i--) {
            const curr = new Date(result.quotes[i].date).getTime();
            const prev = new Date(result.quotes[i-1].date).getTime();
            if (curr - prev > 1800 * 1000) {
                lastSessionStart = i;
                break;
            }
        }

        console.log('Last Session Start Index:', lastSessionStart);
        const startQuote = result.quotes[lastSessionStart];
        const startDate = new Date(startQuote.date);
        console.log('Session Start Quote Time (UTC):', startDate.toISOString());
        console.log('Session Start Quote Time (Local):', startDate.toLocaleString());
        
        // Check filtering logic
        const month = new Date().getMonth();
        const isSummer = month > 2 && month < 10; 
        const marketOpenHour = isSummer ? 13 : 14;
        console.log(`Debug: Month=${month} Summer=${isSummer} OpenHour=${marketOpenHour}`);

        let currentP = lastSessionStart;
        while (currentP < result.quotes.length - 1) {
             const d = new Date(result.quotes[currentP].date);
             const h = d.getUTCHours();
             const m = d.getUTCMinutes();
             
             if (h < marketOpenHour) {
                 console.log(`Skipping ${d.toISOString()} (h=${h} < ${marketOpenHour})`);
                 currentP++;
                 continue;
             }
             if (h === marketOpenHour && m < 30) {
                 console.log(`Skipping ${d.toISOString()} (h=${h}:${m})`);
                 currentP++;
                 continue;
             }
             break;
        }
        console.log('Filtered Start Index:', currentP);
        console.log('Filtered Start Time:', new Date(result.quotes[currentP].date).toISOString());
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();

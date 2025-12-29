
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function main() {
  console.log('Testing generic modules...');
  const candidates = [
      'all',
      'balanceSheet',
      'financials',
      'cashFlow',
      'quarterlyBalanceSheet',
      'annualBalanceSheet',
      'quarterlyIncomeStatement',
      'annualIncomeStatement'
  ];

  for (const mod of candidates) {
      try {
        // @ts-ignore
        const result = await yahooFinance.fundamentalsTimeSeries('AAPL', { period1: '2023-01-01', module: mod });
        console.log(`✅ Module '${mod}' returned ${result.length} items.`);
        if (result.length > 0) {
            console.log(`Sample item keys (${mod}):`, Object.keys(result[0]));
        }
      } catch (err: any) {
         if (err.message.includes('option module invalid')) {
             console.log(`❌ '${mod}' invalid.`);
         } else {
             console.log(`❌ '${mod}' failed:`, err.message);
         }
      }
  }
}

main();

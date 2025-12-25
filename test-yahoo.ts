import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  const symbol = 'ATHERENERG.NS';
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const period1 = startDate.toISOString().split('T')[0];
  console.log('Querying period1:', period1);

  try {
    const quote = await yahooFinance.quote(symbol);
    console.log('Quote Symbol:', quote.symbol);
    
    const result = await yahooFinance.chart(symbol, { period1, interval: '5m' });
    console.log('Chart Symbol (Input):', symbol);
    console.log('Chart Metadata Symbol:', result.meta?.symbol);
    
    console.log('Quotes length:', result.quotes ? result.quotes.length : 0);
    if (result.quotes && result.quotes.length > 0) {
        console.log('First quote:', result.quotes[0]);
        console.log('Last quote:', result.quotes[result.quotes.length - 1]);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();

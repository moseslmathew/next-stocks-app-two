
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        console.log("Testing with range='1d'...");
        const res = await yahooFinance.chart('AAPL', { range: '1d', interval: '5m' });
        console.log("Success:", res.meta.symbol, res.quotes.length, "quotes");
    } catch (e) {
        console.error("Error with range:", e.message);
    }
}

test();

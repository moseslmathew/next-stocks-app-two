
const YahooFinance = require('yahoo-finance2').default;

async function checkGold() {
    try {
        const results = await YahooFinance.quote(['GC=F', 'USDINR=X', 'GOLDBEES.NS']);
        
        const gold = results.find(r => r.symbol === 'GC=F');
        const usdInr = results.find(r => r.symbol === 'USDINR=X');
        const bees = results.find(r => r.symbol === 'GOLDBEES.NS');

        console.log('GC=F (USD/oz):', gold.regularMarketPrice);
        console.log('USDINR=X:', usdInr.regularMarketPrice);
        console.log('GOLDBEES.NS (INR/unit):', bees.regularMarketPrice);

        // Calc Parity
        const parityPerOz = gold.regularMarketPrice * usdInr.regularMarketPrice;
        const parityPerGram = parityPerOz / 31.1035;
        const parity10g = parityPerGram * 10;
        
        console.log('--- Calculation ---');
        console.log('Pure Parity (10g):', parity10g.toFixed(2));
        console.log('With 15% Duty (10g):', (parity10g * 1.15).toFixed(2));
        
        // Bees usually represents 0.01g or 1g? 
        // If Bees is ~60, then 10g equiv = 60 * 1000? No.
        // Let's deduce Bees unit.
    } catch (e) {
        console.error(e);
    }
}

checkGold();


async function debugGold() {
    try {
        const response = await fetch("https://www.bankbazaar.com/gold-rate-kerala.html");
        const html = await response.text();
        
        const index24k = html.indexOf("24 Carat Gold Rate");
        const subset = html.substring(index24k, index24k + 4000);
        
        console.log("--- Snippet Start ---");
        // Log the part where the table rows likely are
        const rowStart = subset.indexOf("1 gram");
        console.log(subset.substring(rowStart, rowStart + 1500));
        console.log("--- Snippet End ---");
        
    } catch (e) {
        console.error(e);
    }
}
debugGold();

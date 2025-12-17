
async function scrapeGold() {
    try {
        const response = await fetch("https://www.bankbazaar.com/gold-rate-kerala.html");
        const html = await response.text();
        
        // Debug: Log a chunk of HTML around "22 Carat"
        const index22 = html.indexOf("22 Carat Gold Rate");
        console.log("Found 22 Carat at:", index22);
        
        if (index22 !== -1) {
             const snippet = html.substring(index22, index22 + 2000);
             console.log("Snippet:", snippet);
             
             // Regex attempt
             // Typically table: <td>1 Gram</td> <td>₹ 6,500</td>
             // Simplistic match
        }

    } catch (e) {
        console.error(e);
    }
}

scrapeGold();

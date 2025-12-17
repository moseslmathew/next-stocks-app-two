'use server';

export async function getScrapedGoldRate() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch("https://www.bankbazaar.com/gold-rate-kerala.html", {
            next: { revalidate: 3600 }, // Cache for 1 hour
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const html = await response.text();

        // Helper to extract price and change for a specific karat
        const extractData = (karatLabel: string) => {
            const sectionIndex = html.indexOf(karatLabel);
            if (sectionIndex === -1) return null;
            
            const subset = html.substring(sectionIndex, sectionIndex + 3000);
            
            // Regex to find: 1 gram ... Today ... Yesterday ... Change
            // The Change value often contains HTML comments like: ₹<!-- --> <!-- -->63<!-- -->▲
            // We capture everything between the 3rd ₹ and the arrow
            const regex = /1 gram[\s\S]*?₹\s*([0-9,]+)[\s\S]*?₹\s*([0-9,]+)[\s\S]*?₹([\s\S]*?)(▲|▼)/;
            const match = subset.match(regex);
            
            if (match && match[1]) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                
                // Clean the change string (remove HTML comments, tags, spaces)
                const rawChange = match[3];
                const cleanChange = rawChange.replace(/[^0-9.]/g, '');
                
                const changeAmount = parseFloat(cleanChange);
                const direction = match[4]; // ▲ or ▼
                
                const change = direction === '▼' ? -changeAmount : changeAmount;
                
                return { price, change };
            }
            
            // Fallback for price only if change finding fails
            const priceMatch = subset.match(/1 gram[\s\S]*?₹\s*([0-9,]+)/);
            if (priceMatch && priceMatch[1]) {
                return { 
                    price: parseFloat(priceMatch[1].replace(/,/g, '')),
                    change: 0 
                };
            }
            
            return null;
        };

        const data22k = extractData("22 Carat Gold Rate");
        const data24k = extractData("24 Carat Gold Rate");
        
        return {
            success: true,
            price1g22k: data22k?.price || null,
            price1g24k: data24k?.price || null,
            change1g22k: data22k?.change || 0,
            change1g24k: data24k?.change || 0,
            timestamp: Date.now()
        };

    } catch (error) {
        console.error("Failed to scrape gold rate:", error);
        return { success: false, error: 'Failed to fetch' };
    }
}

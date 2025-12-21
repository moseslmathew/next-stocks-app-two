const https = require('https');
const fs = require('fs');
const path = require('path');

// Try to read API key from .env manually since dotenv is not installed
let apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
            if (match && match[1]) {
                apiKey = match[1].trim();
            }
        }
    } catch (e) {
        console.error("Error reading .env:", e);
    }
}

if (!apiKey) {
    console.error("Could not find GOOGLE_GENERATIVE_AI_API_KEY in environment or .env file.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Supported Models:");
                json.models.forEach(m => {
                    console.log(`- ${m.name}`);
                    console.log(`  Supported methods: ${m.supportedGenerationMethods.join(', ')}`);
                });
            } else {
                console.log("Error response:", json);
            }
        } catch (e) {
            console.error("Error parsing response:", e);
            console.log("Raw API Response:", data);
        }
    });
}).on('error', (e) => {
    console.error("Request error:", e);
});

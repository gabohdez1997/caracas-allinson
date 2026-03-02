const https = require('https');

console.log("Starting BCV request...");
const req = https.get('https://www.bcv.org.ve/', {
    rejectUnauthorized: false,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    }
}, (res) => {
    console.log("Status Code:", res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Response length:", data.length);
        console.log("Has Dolar ID?", data.includes('id="dolar"'));
    });
});
req.on('error', (e) => {
    console.error("HTTP Request Error:", e);
});
req.setTimeout(10000, () => {
    console.error("HTTP Request Timeout!");
    req.destroy();
});

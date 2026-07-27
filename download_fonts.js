const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const fontsDir = path.join(dir, 'assets', 'fonts');

if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const cssUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;700;800&display=swap';

// We must spoof user agent to get woff2
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

https.get(cssUrl, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
        let cssContent = data;
        const urlRegex = /url\((https:\/\/[^)]+\.woff2)\)/g;
        let match;
        let fontCount = 0;
        
        while ((match = urlRegex.exec(data)) !== null) {
            const fontUrl = match[1];
            // Extract font name from url, it usually looks like .../s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.woff2
            // We will just use a generic name based on count to avoid parsing issues, but preserving the family is better.
            // Actually let's just use hash or simple index
            fontCount++;
            const fileName = `font-${fontCount}.woff2`;
            const filePath = path.join(fontsDir, fileName);
            
            // Download the font
            await new Promise((resolve) => {
                https.get(fontUrl, (resFont) => {
                    const fileStream = fs.createWriteStream(filePath);
                    resFont.pipe(fileStream);
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve();
                    });
                });
            });
            
            // Replace url in CSS
            cssContent = cssContent.replace(fontUrl, fileName);
        }
        
        fs.writeFileSync(path.join(fontsDir, 'fonts.css'), cssContent);
        console.log(`Downloaded ${fontCount} fonts and created fonts.css`);
        
        // Now update HTML files
        const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
        let modifiedCount = 0;
        
        htmlFiles.forEach(file => {
            const htmlPath = path.join(dir, file);
            let content = fs.readFileSync(htmlPath, 'utf8');
            
            const preconnectRegex = /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"[^>]*>\s*/g;
            const preconnectGstaticRegex = /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/g;
            const cssRegex = /<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600&family=Poppins:wght@500;700;800&display=swap"[^>]*>/g;
            
            // Wait, looking at the grep, the href might have escaped ampersands like &amp; in the HTML?
            // Grep output: href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;700;800&display=swap"
            
            // Let's just remove the preconnects and replace the google fonts link with our local one.
            content = content.replace(preconnectRegex, '');
            content = content.replace(preconnectGstaticRegex, '');
            
            // The google fonts link might span multiple lines as seen in grep output
            // `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">`
            // Let's use a broader regex to match any link to fonts.googleapis.com/css2
            const genericCssRegex = /<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>/gi;
            content = content.replace(genericCssRegex, '<link rel="stylesheet" href="assets/fonts/fonts.css" />');
            
            fs.writeFileSync(htmlPath, content, 'utf8');
            modifiedCount++;
        });
        
        console.log(`Updated ${modifiedCount} HTML files.`);
    });
}).on('error', (e) => {
    console.error(e);
});

const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const cspString = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://translate.google.com https://translate.googleapis.com; frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com https://translate.googleapis.com; connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://api.web3forms.com https://translate.googleapis.com; img-src 'self' data: https://translate.googleapis.com https://translate.google.com https://www.gstatic.com; font-src 'self'; form-action 'self' https://api.web3forms.com; object-src 'none'; base-uri 'self';">`;

let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if CSP is not already there
    if (!content.includes('http-equiv="Content-Security-Policy"')) {
        content = content.replace(/<head>/i, `<head>\n    ${cspString}`);
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
    }
}

console.log(`Successfully added updated CSP to ${updatedCount} HTML files.`);

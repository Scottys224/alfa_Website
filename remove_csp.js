const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const cspString = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://web3forms.com https://translate.google.com https://translate.googleapis.com; style-src 'self' 'unsafe-inline' https://translate.googleapis.com; img-src 'self' data: https://translate.googleapis.com https://translate.google.com https://www.gstatic.com; connect-src 'self' https://api.web3forms.com https://translate.googleapis.com; font-src 'self'; form-action 'self' https://api.web3forms.com; object-src 'none'; base-uri 'self';">`;

let removedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(cspString)) {
        // Also try to remove the leading newline and spaces if possible
        content = content.replace('\\n    ' + cspString, '');
        content = content.replace(cspString, '');
        fs.writeFileSync(filePath, content, 'utf8');
        removedCount++;
    }
}

console.log(`Successfully removed CSP from ${removedCount} HTML files.`);

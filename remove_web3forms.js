const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove static Web3Forms script if it exists
    content = content.replace(/<script\s+src="https:\/\/web3forms\.com\/client\/script\.js"\s+async\s+defer\s*><\/script>/g, '');

    // The script might be on multiple lines as seen in index.html
    content = content.replace(/<!-- Script Web3Forms pour hCaptcha -->\s*<script\s+src="https:\/\/web3forms\.com\/client\/script\.js"\s+async\s+defer\s*><\/script>/g, '');
    
    // Fallback for multi-line
    content = content.replace(/<script[^>]*src="https:\/\/web3forms\.com\/client\/script\.js"[^>]*><\/script>/gi, '');

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Processed Web3Forms static script.');

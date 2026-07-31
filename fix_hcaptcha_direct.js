const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = ['index.html', 'contact.html', 'chauffeur.html', 'commercant.html'];

let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Replace Web3Forms script with official hCaptcha script
    content = content.replace(
        /<script src="https:\/\/web3forms\.com\/client\/script\.js"[^>]*><\/script>/g,
        '<script src="https://hcaptcha.com/1/api.js" async defer></script>'
    );
    
    // 2. Add the Web3Forms sitekey to the h-captcha div
    // First, if it has data-captcha="true", we can remove it or keep it, but we MUST add data-sitekey
    if (content.includes('class="h-captcha"') && !content.includes('data-sitekey=')) {
        content = content.replace(/class="h-captcha"/g, 'class="h-captcha" data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
}

console.log(`Successfully bypassed Web3Forms script and added direct hCaptcha to ${updatedCount} HTML files.`);

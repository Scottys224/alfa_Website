const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('class="h-captcha"') && !content.includes('data-sitekey=')) {
        content = content.replace(/class="h-captcha"/g, 'class="h-captcha" data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"');
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
    }
}

console.log(`Successfully added data-sitekey to ${updatedCount} HTML files.`);

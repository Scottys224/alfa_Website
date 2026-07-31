const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"')) {
        content = content.replace(/ data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
    }
}

console.log(`Successfully reverted data-sitekey from ${updatedCount} HTML files.`);

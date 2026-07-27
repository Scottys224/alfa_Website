const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the CSP meta tag completely
    content = content.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]+">\s*/gi, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Removed CSP from ${file}`);
});

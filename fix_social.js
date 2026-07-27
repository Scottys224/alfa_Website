const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace facebook link
    content = content.replace(/href="https:\/\/www\.facebook\.com\/alfa\/posts\/"/g, 'href="#"');
    
    // Replace instagram link
    content = content.replace(/href="https:\/\/www\.instagram\.com\/alfa\.guinee\/reels\/"/g, 'href="#"');

    // We can also remove the target="_blank" and rel="noopener noreferrer" if it's just a "#" link, 
    // but the regex for that might be tricky if they are on different lines.
    // Let's just leave the href="#" and it will behave as a dead link which is safe.
    
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Social links disabled in all HTML files.');

const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove meta X-UA-Compatible
    content = content.replace(/<meta\s+http-equiv="X-UA-Compatible"\s+content="ie=edge"\s*\/>\s*/gi, '');
    
    // Remove Actualités link from footer.
    // E.g. <li><a href="#" class="text-gray-400 hover:text-white transition">Actualités</a></li>
    content = content.replace(/<li>\s*<a\s+href="#"\s+class="[^"]*"\s*>Actualités<\/a>\s*<\/li>\s*/gi, '');
    content = content.replace(/<li>\s*<a\s+href="#"\s*>Actualités<\/a>\s*<\/li>\s*/gi, '');

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Removed X-UA-Compatible and Actualités from HTML files.');

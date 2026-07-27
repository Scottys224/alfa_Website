const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const preconnects = `
    <link rel="preconnect" href="https://translate.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://translate.google.com" crossorigin>
`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Reduce the timeout from 500 to 50ms
    content = content.replace(/setTimeout\(function\s*\(\)\s*\{\s*doGTranslate\(lang_pair\);\s*},\s*500\);/g, 'setTimeout(function () {\n            doGTranslate(lang_pair);\n          }, 50);');

    // 2. Add preconnects in the head if not there
    if (!content.includes('translate.googleapis.com" crossorigin>')) {
        content = content.replace(/<\/head>/, preconnects + '</head>');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Optimized GTranslate speed in ${file}`);
    }
});

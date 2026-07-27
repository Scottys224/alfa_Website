const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Merge duplicate classes
    let changed = true;
    while (changed) {
        let newContent = content.replace(/class="([^"]+)"\s*class="([^"]+)"/g, (match, c1, c2) => {
            let classes = [...new Set((c1 + ' ' + c2).split(/\s+/))].filter(Boolean).join(' ');
            return `class="${classes}"`;
        });
        if (newContent !== content) {
            content = newContent;
            changed = true;
        } else {
            changed = false;
        }
    }

    // 2. Ensure main.js is included right before </body>
    if (!content.includes('js/main.js')) {
        content = content.replace(/<\/body>/, '    <script src="js/main.js" defer></script>\n  </body>');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed duplicates and main.js in ${file}`);
    }
});

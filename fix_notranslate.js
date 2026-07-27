const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We want to add notranslate to the span.current-lang and div.lang-dropdown
    // This prevents Google Translate from translating "EN" to "IN" or "Français" to "French"
    content = content.replace(/<span class="current-lang">/g, '<span class="current-lang notranslate">');
    content = content.replace(/<div class="dropdown-content lang-dropdown">/g, '<div class="dropdown-content lang-dropdown notranslate">');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Added notranslate class in ${file}`);
    }
});

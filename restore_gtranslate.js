const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('translate.google.com/translate_a/element.js')) {
        content = content.replace(
            '<script src="js/gtranslate.js" defer></script>',
            '<script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2" defer></script>\n      <script src="js/gtranslate.js" defer></script>'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Restored GTranslate in ${file}`);
    }
});

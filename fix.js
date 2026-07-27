const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';

const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const web3FormsScript = '<script src="https://web3forms.com/client/script.js" async defer></script>';
const translateScript = '<script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"></script>';
const translateScript2 = '<script\n      type="text/javascript"\n      src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"\n    ></script>';

let modifiedCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let originalLength = content.length;
    
    // Remove scripts
    content = content.replace(web3FormsScript, '');
    // Try to remove exact match first
    if(content.includes(translateScript)) {
        content = content.replace(translateScript, '');
    } else {
        // use regex to remove any formatting of the translate script
        const regex = /<script[^>]*src="https:\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit2"[^>]*><\/script>/gi;
        content = content.replace(regex, '');
    }

    if (content.length !== originalLength) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Updated ${modifiedCount} HTML files.`);

const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let issues = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check for duplicate class attributes (should be 0 now)
    const duplicateClasses = content.match(/class="[^"]+"\s*class="[^"]+"/g);
    if (duplicateClasses) issues.push(`${file}: Duplicate classes found: ${duplicateClasses.length}`);

    // Check for missing Web3Forms
    if (file === 'index.html' || file === 'contact.html' || file === 'chauffeur.html' || file === 'commercant.html') {
        if (!content.includes('web3forms.com/client/script.js')) {
            issues.push(`${file}: Missing Web3Forms script!`);
        }
    }

    // Check for missing interactions.js or form-handler.js
    if (!content.includes('js/interactions.js')) issues.push(`${file}: Missing interactions.js!`);
    if (!content.includes('js/main.js')) issues.push(`${file}: Missing main.js!`);

    // Check for malformed scripts
    if (content.includes('<script></script>')) issues.push(`${file}: Empty script tag found.`);

    // Check for "undefined" in class or id
    if (content.includes('class="undefined"') || content.includes('id="undefined"')) issues.push(`${file}: undefined attribute found.`);
    
    // Check for remaining onclick that might be broken
    const remainingOnclick = content.match(/onclick="[^"]+"/g);
    if (remainingOnclick) {
        remainingOnclick.forEach(onclick => {
            if (onclick.includes('openModal') || onclick.includes('closeModal') || onclick.includes('smartLink') || onclick.includes('doGTranslate')) {
                issues.push(`${file}: Unconverted onclick found: ${onclick}`);
            }
        });
    }

});

if (issues.length === 0) {
    console.log("Audit complete: No known broken functionality detected.");
} else {
    console.log("Audit issues found:");
    console.log(issues.join('\n'));
}

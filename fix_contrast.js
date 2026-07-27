const fs = require('fs');
const path = require('path');

const cssPath = 'c:/Users/HP/Desktop/alfa_Website/css/style.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Replace --color-primary
cssContent = cssContent.replace(/--color-primary:\s*#10b981;/ig, '--color-primary: #047857;');
// Also check for any direct #10b981 usages
cssContent = cssContent.replace(/#10b981/ig, '#047857');

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Contrast WCAG fixed.');

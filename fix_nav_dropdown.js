const fs = require('fs');
const path = require('path');

const cssPath = 'c:/Users/HP/Desktop/alfa_Website/css/style.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Replace the padding in .dropdown-content a
cssContent = cssContent.replace(
    /\.dropdown-content a\s*{\s*color:\s*var\(--text-heading\)\s*!important;\s*padding:\s*14px 20px\s*!important;/g,
    '.dropdown-content a {\n    color: var(--text-heading) !important;\n    padding: 4px 20px !important;'
);

fs.writeFileSync(cssPath, cssContent, 'utf8');

console.log('Padding for dropdown-content updated.');

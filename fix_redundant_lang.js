const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/HP/Desktop/alfa_Website/js/interactions.js';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the event listener for .lang-option to avoid conflicts
content = content.replace(/\/\/ 2\. Language options \(Google Translate\)[\s\S]*?\/\/ 3\. Modals/, '// 3. Modals');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed lang-option listener from interactions.js');

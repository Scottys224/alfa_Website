const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove flag emojis from the language options
    content = content.replace(/>🇫🇷 Français<\/a\s*>/g, '>Français</a\n              >');
    content = content.replace(/>🇬🇧 English<\/a\s*>/g, '>English</a\n              >');
    content = content.replace(/>🇨🇳 中文<\/a\s*>/g, '>中文</a\n              >');
    
    // Also try without newline just in case
    content = content.replace(/>🇫🇷 Français<\/a>/g, '>Français</a>');
    content = content.replace(/>🇬🇧 English<\/a>/g, '>English</a>');
    content = content.replace(/>🇨🇳 中文<\/a>/g, '>中文</a>');

    fs.writeFileSync(filePath, content, 'utf8');
});

// Now edit style.css
const cssPath = path.join(dir, 'css', 'style.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Reduce padding for .lang-switcher .dropdown-content a
cssContent = cssContent.replace(/\.lang-switcher \.dropdown-content a \{ display: flex; align-items: center; gap: 8px; \}/g, 
  '.lang-switcher .dropdown-content a { display: flex; align-items: center; gap: 4px; padding: 4px 10px !important; }');

// Or just add a new rule at the end to be sure
cssContent += '\n.lang-switcher .dropdown-content a { padding: 4px 10px !important; }\n';

fs.writeFileSync(cssPath, cssContent, 'utf8');

console.log('Language tags updated.');

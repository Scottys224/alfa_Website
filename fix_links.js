const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const p = path.join(dir, file);
    let c = fs.readFileSync(p, 'utf8');
    
    // Replace target="_blank" only if it doesn't already have rel="noopener noreferrer" next to it
    c = c.replace(/target="_blank"(?!\s*rel="noopener noreferrer")/g, 'target="_blank" rel="noopener noreferrer"');
    
    fs.writeFileSync(p, c);
});
console.log('Links secured!');

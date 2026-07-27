const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Restore the 'modal-close' class that was accidentally removed from the spans
    content = content.replace(/<span onclick="closeModal/g, '<span class="modal-close" onclick="closeModal');
    
    // Some tags might have been formatted as: <span\s+onclick="closeModal
    content = content.replace(/<span\s+onclick="closeModal/g, '<span class="modal-close" onclick="closeModal');
    
    // Let's be sure we don't duplicate it
    content = content.replace(/class="modal-close"\s+class="modal-close"/g, 'class="modal-close"');
    content = content.replace(/class="modal-close"\s+onclick="closeModal/g, 'class="modal-close" onclick="closeModal');
    
    // Actually, just a simple string replace for the exact missing class:
    // We can do a more robust regex to add it if missing.
    content = content.replace(/<span([^>]*)onclick="closeModal\(event,\s*'([^']+)'\)"/g, (match, attrs, id) => {
        if (!attrs.includes('class="')) {
            return `<span class="modal-close"${attrs}onclick="closeModal(event, '${id}')"`;
        }
        if (!attrs.includes('modal-close')) {
            return match; // If it has another class but not modal-close, we might need to add it, but currently they have NO class.
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Restored modal-close class in ${file}`);
    }
});

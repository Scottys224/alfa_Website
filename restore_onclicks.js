const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Restore openModal
    // Match `class="something modal-trigger something"` data-modal="ID"
    content = content.replace(/class="([^"]*)\bmodal-trigger\b([^"]*)"\s+data-modal="([^"]+)"/g, (match, before, after, id) => {
        let cls = (before + ' ' + after).replace(/\s+/g, ' ').trim();
        if (cls) {
            return `class="${cls}" onclick="openModal('${id}')"`;
        }
        return `onclick="openModal('${id}')"`;
    });

    // 2. Restore closeModal
    content = content.replace(/class="([^"]*)\bmodal-close\b([^"]*)"\s+data-modal="([^"]+)"/g, (match, before, after, id) => {
        let cls = (before + ' ' + after).replace(/\s+/g, ' ').trim();
        if (cls) {
            return `class="${cls}" onclick="closeModal(event, '${id}')"`;
        }
        return `onclick="closeModal(event, '${id}')"`;
    });

    // 3. Restore smartLink
    content = content.replace(/class="([^"]*)\bsmart-link\b([^"]*)"\s+data-app="([^"]+)"\s+data-os="([^"]+)"/g, (match, before, after, app, os) => {
        let cls = (before + ' ' + after).replace(/\s+/g, ' ').trim();
        if (cls) {
            return `class="${cls}" onclick="smartLink('${app}', '${os}'); return false;"`;
        }
        return `onclick="smartLink('${app}', '${os}'); return false;"`;
    });

    // We must also remove the new code from interactions.js that handles these if we restored them!
    // But it's easier to just let them be, since interactions.js checks for .modal-trigger etc. which NO LONGER EXIST!
    // So the interactions.js code will just safely do nothing! That's perfect!

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Restored inline scripts in ${file}`);
    }
});

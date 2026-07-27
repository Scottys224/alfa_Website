const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace document.write date
    content = content.replace(/<script>\s*document\.write\(new Date\(\)\.getFullYear\(\)\);\s*<\/script>/g, '<span data-annee-courante></span>');

    // 2. Add form attributes for form-handler.js
    content = content.replace(/id="contactForm"/g, 'id="contactForm" data-alfa-form data-succes="form-success"');
    content = content.replace(/id="driverForm"/g, 'id="driverForm" data-alfa-form data-succes="form-success"');
    content = content.replace(/id="merchantForm"/g, 'id="merchantForm" data-alfa-form data-succes="form-success"');
    content = content.replace(/id="notifyForm"/g, 'id="notifyForm" data-alfa-form data-succes="form-success"');

    // 3. Remove inline form scripts
    // This is tricky because scripts span multiple lines. 
    // E.g., document.getElementById("contactForm").addEventListener...
    // We can use a regex to find script blocks containing getElementById("...Form")
    content = content.replace(/<script>\s*document\s*\.getElementById\("(contactForm|driverForm|merchantForm|notifyForm)"\)[\s\S]*?<\/script>/g, '');

    // 4. doGTranslate
    // onclick="doGTranslate('fr|en'); return false;"
    content = content.replace(/onclick="\s*doGTranslate\('([^']+)'\);\s*return false;\s*"/g, 'class="lang-option" data-lang="$1"');

    // 5. smartLink
    // onclick="smartLink('client', 'android')"
    // We need to keep preventDefault if it's there? The report mentions smartLink(event, 'client', 'android')
    content = content.replace(/onclick="smartLink\((?:event,\s*)?'([^']+)',\s*'([^']+)'\)"/g, 'class="smart-link" data-app="$1" data-os="$2"');

    // 6. Modal onclicks
    // onclick="openModal('modal-id')"
    content = content.replace(/onclick="openModal\('([^']+)'\)"/g, 'class="modal-trigger" data-modal="$1"');
    
    // onclick="closeModal(event, 'modal-id')"
    // sometimes it's closeModal(null, 'modal-id') or closeModal('modal-id')
    content = content.replace(/onclick="closeModal\((?:event|null)?(?:,\s*)?'([^']+)'\)"/g, 'class="modal-close" data-modal="$1"');
    content = content.replace(/onclick="event\.stopPropagation\(\)"/g, 'class="modal-content-stop"');

    // 7. Inject JS files before </body> if not already there
    if (!content.includes('js/interactions.js')) {
        content = content.replace(/<\/body>/, '    <script src="js/interactions.js" defer></script>\n  </body>');
    }
    if (!content.includes('js/form-handler.js')) {
        content = content.replace(/<\/body>/, '    <script src="js/form-handler.js" defer></script>\n  </body>');
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Processed HTML files for inline scripts removal.');

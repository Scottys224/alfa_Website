const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/id="contactForm"[^>]*data-succes="[^"]*"/g, 'id="contactForm" data-alfa-form data-succes="contact-success"');
    content = content.replace(/id="driverForm"[^>]*data-succes="[^"]*"/g, 'id="driverForm" data-alfa-form data-succes="driver-success"');
    content = content.replace(/id="merchantForm"[^>]*data-succes="[^"]*"/g, 'id="merchantForm" data-alfa-form data-succes="merchant-success"');
    content = content.replace(/id="notifyForm"[^>]*data-succes="[^"]*"/g, 'id="notifyForm" data-alfa-form data-succes="notify-success"');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed success IDs in ${file}`);
    }
});

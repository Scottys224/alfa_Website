const fs = require('fs');
const path = require('path');

const jsPath = 'c:/Users/HP/Desktop/alfa_Website/js/interactions.js';
let jsContent = fs.readFileSync(jsPath, 'utf8');

const mobileDropdownScript = `
    // 5. Mobile/Touch Dropdowns (UX)
    document.querySelectorAll('.nav-dropdown-btn, .lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = btn.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = '';
            } else {
                document.querySelectorAll('.dropdown-content').forEach(c => c.style.display = '');
                content.style.display = 'block';
            }
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content').forEach(c => c.style.display = '');
    });
});
`;

jsContent = jsContent.replace(/}\);$/, mobileDropdownScript.trim());

fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log('interactions.js updated for mobile dropdowns.');

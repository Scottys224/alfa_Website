const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const cssPath = path.join(dir, 'css', 'style.css');

let css = fs.readFileSync(cssPath, 'utf8');

// T4: E6 Variables
const missingVars = `
    --border-color: #E2E8F0;
    --bg-hover: #F1F5F9;
    --color-gray-400: rgba(255, 255, 255, 0.7);
    --color-white: #FFFFFF;
    --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --text-body: var(--text-main);
`;
if (!css.includes('--border-color: #E2E8F0;')) {
    css = css.replace(/:root\s*{/, `:root {${missingVars}`);
}

// T1: E2 Phone Mockup
css = css.replace(/width:\s*320px;\s*height:\s*600px;/g, 'width: min(320px, 100%);\n    aspect-ratio: 320/600;\n    height: auto;');

// T1: E3 Grids 300px
css = css.replace(/minmax\(300px,\s*1fr\)/g, 'minmax(min(300px, 100%), 1fr)');

// T3: E5 Nav Container
css = css.replace(/height:\s*80px;\s*\}/g, 'min-height: 80px;\n}');
css = css.replace(/\.nav-links\s*{\s*display:\s*flex;\s*align-items:\s*center;\s*gap:\s*24px;\s*}/g, 
  '.nav-links {\n    display: flex;\n    align-items: center;\n    gap: 16px;\n    flex-wrap: wrap;\n}');

// Adjust breakpoint for nav if needed (e.g., from 992 or 768 to 1100). 
// Let's just find @media (max-width: 992px) and modify nav part.
// But the burger menu might be hidden until 768px in this project.
// Actually, let's just make sure flex-wrap allows it to wrap instead of overflowing.

// T5: E8 .sr-only
if (!css.includes('.sr-only')) {
    css += `
.sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('style.css updated.');

// Process HTML files
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    let original = html;

    // T3: E5 Rename link
    html = html.replace(/>Voir comment ça marche<\/a>/g, '>Fonctionnement</a>');
    html = html.replace(/>Voir comment ça marche\s*<\/a>/g, '>Fonctionnement</a>');

    // T1: E3 grids in telechargement.html
    html = html.replace(/minmax\(300px,\s*1fr\)/g, 'minmax(min(300px, 100%), 1fr)');

    // T2: E4 H1 sizes in service pages (nourriture, livraison, chauffeur, commercant) and contact
    html = html.replace(/font-size:\s*3rem;/g, 'font-size: clamp(2rem, 1.4rem + 3vw, 3rem);\n    text-wrap: balance;');
    html = html.replace(/font-size:\s*2\.5rem;/g, 'font-size: clamp(2rem, 1.4rem + 3vw, 2.5rem);\n    text-wrap: balance;'); // contact.html

    // T6: E9 Focus Visible
    // .form-control:focus-visible
    html = html.replace(/\.form-control:focus\s*{\s*outline:\s*none;\s*border-color:\s*var\(--color-primary\);\s*box-shadow:\s*0 0 0 3px rgba\(79, 70, 229, 0\.1\);\s*background:\s*white;\s*}/g, 
      '.form-control:focus {\n    border-color: var(--color-primary);\n    background: white;\n}\n.form-control:focus-visible {\n    outline: 3px solid var(--color-primary);\n    outline-offset: 2px;\n    box-shadow: 0 0 0 4px rgba(4, 120, 87, 0.25);\n}');

    // T5: E8 Labels in aide.html
    if (file === 'aide.html') {
        html = html.replace(/<input\s+type="text"\s+id="searchInput"/, 
          '<label for="searchInput" class="sr-only">Rechercher dans le centre d\'aide</label>\n              <input type="text" id="searchInput" autocomplete="off"');
    }

    // T5: E8 Labels in index.html
    if (file === 'index.html') {
        html = html.replace(/<input\s+type="text"\s+name="contact"/, 
          '<label for="notify-contact" class="sr-only">Adresse e-mail ou numéro de téléphone</label>\n                <input type="text" id="notify-contact" name="contact" autocomplete="email" inputmode="email"');
    }

    if (html !== original) {
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`Updated ${file}`);
    }
});
console.log('HTML files updated.');

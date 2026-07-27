const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const WEB3FORMS_SCRIPT = '<script src="https://web3forms.com/client/script.js" async defer></script>';

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Restore Web3Forms script in files with forms
    if (['index.html', 'contact.html', 'chauffeur.html', 'commercant.html'].includes(file)) {
        if (!content.includes('web3forms.com/client/script.js')) {
            // Insert it before the first script tag before </body>
            content = content.replace(/<script src="js\/interactions\.js"/, `${WEB3FORMS_SCRIPT}\n      <script src="js/interactions.js"`);
        }
    }

    // 2. Restore Social Links
    // Facebook
    content = content.replace(
        /<a\s+href="#"\s+target="_blank"\s+rel="noopener noreferrer"\s+aria-label="Facebook"\s*>/g,
        '<a\n                  href="https://www.facebook.com/alfa/posts/"\n                  target="_blank"\n                  rel="noopener noreferrer"\n                  aria-label="Facebook"\n                >'
    );
    // There might be variations in formatting, let's use a simpler regex
    content = content.replace(
        /<a[^>]*href="#"[^>]*aria-label="Facebook"[^>]*>/g,
        '<a href="https://www.facebook.com/alfa/posts/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">'
    );

    // Instagram
    content = content.replace(
        /<a\s+href="#"\s+target="_blank"\s+rel="noopener noreferrer"\s+aria-label="Instagram"\s*>/g,
        '<a\n                  href="https://www.instagram.com/alfa.guinee/reels/"\n                  target="_blank"\n                  rel="noopener noreferrer"\n                  aria-label="Instagram"\n                >'
    );
    // Simpler regex fallback
    content = content.replace(
        /<a[^>]*href="#"[^>]*aria-label="Instagram"[^>]*>/g,
        '<a href="https://www.instagram.com/alfa.guinee/reels/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">'
    );

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Restored functionalities in ${file}`);
    }
});

const fs = require('fs');
const path = require('path');

const cssPath = 'c:/Users/HP/Desktop/alfa_Website/css/style.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const mediaQuery = `
/* --- Fix Mobile (< 480px) --- */
@media (max-width: 480px) {
    * {
        max-width: 100%;
        box-sizing: border-box;
    }
    .container {
        padding: 0 15px;
    }
    .footer-links-grid, .services-grid, .features-grid, .stats-grid {
        grid-template-columns: 1fr !important;
    }
    h1 {
        font-size: 2rem !important;
        word-wrap: break-word;
    }
    h2 {
        font-size: 1.5rem !important;
        word-wrap: break-word;
    }
    .hero-buttons {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 10px;
    }
    .hero-buttons .btn {
        width: 100%;
        margin: 0;
    }
    img {
        max-width: 100%;
        height: auto;
    }
}
`;

cssContent += '\n' + mediaQuery;

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Media query < 480px added.');

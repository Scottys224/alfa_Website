const fs = require('fs');
const path = require('path');

const domain = 'https://www.alfa.com.gn';

const pages = {
    'index.html': { 
        title: "alfa - Super-application de transport et livraison en Guinée", 
        desc: "Commandez un chauffeur, de la nourriture ou envoyez des colis rapidement et en toute sécurité avec alfa. La super-application n°1 en Guinée." 
    },
    'aide.html': { 
        title: "Centre d'Aide alfa - Support et FAQ", 
        desc: "Besoin d'aide avec l'application alfa ? Consultez notre centre d'aide, notre FAQ ou contactez le support client." 
    },
    'cgu.html': { 
        title: "Conditions Générales d'Utilisation - alfa", 
        desc: "Lisez les conditions générales d'utilisation des services alfa (transport, livraison, nourriture)." 
    },
    'chauffeur.html': { 
        title: "Devenez Chauffeur Partenaire alfa en Guinée", 
        desc: "Gagnez de l'argent en conduisant avec alfa. Inscrivez-vous comme chauffeur partenaire et gérez vos propres horaires." 
    },
    'commercant.html': { 
        title: "Devenez Commerçant Partenaire alfa", 
        desc: "Augmentez vos ventes en rejoignant la plateforme alfa. Proposez vos produits et plats à des milliers d'utilisateurs." 
    },
    'confidentialite.html': { 
        title: "Politique de Confidentialité - alfa", 
        desc: "Découvrez comment alfa protège vos données personnelles et respecte votre vie privée en Guinée." 
    },
    'contact.html': { 
        title: "Contactez-nous - alfa Guinée", 
        desc: "Une question, une suggestion ou un partenariat ? Contactez l'équipe alfa en Guinée via notre formulaire en ligne." 
    },
    'cookies.html': { 
        title: "Politique des Cookies - alfa", 
        desc: "Informations sur l'utilisation des cookies par le site et l'application alfa pour améliorer votre expérience." 
    },
    'livraison.html': { 
        title: "Livraison de Colis Express - alfa", 
        desc: "Faites livrer vos colis rapidement et en toute sécurité avec alfa Livraison. Suivi en temps réel de votre coursier." 
    },
    'mentions-legales.html': { 
        title: "Mentions Légales - alfa", 
        desc: "Consultez les mentions légales de la société alfa, super-application de services en Guinée." 
    },
    'nourriture.html': { 
        title: "Livraison de Repas et Courses - alfa Food", 
        desc: "Commandez vos repas et courses en ligne. alfa Food livre vos plats préférés rapidement à votre porte." 
    },
    'telechargement.html': { 
        title: "Téléchargez l'Application alfa - iOS et Android", 
        desc: "Téléchargez l'application gratuite alfa sur l'App Store ou Google Play pour accéder à tous nos services en Guinée." 
    }
};

let sitemapUrls = '';

for (const [file, data] of Object.entries(pages)) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${file} not found. Skipping.`);
        continue;
    }

    // Add to sitemap
    const priority = file === 'index.html' ? '1.0' : '0.8';
    sitemapUrls += `
  <url>
    <loc>${domain}/${file === 'index.html' ? '' : file}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Write the files to dist instead of overwriting sources
for (const [file, data] of Object.entries(pages)) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<title>.*?<\/title>/gis, '');
    content = content.replace(/<meta\s+name=["']description["'][^>]*>/gi, '');
    content = content.replace(/<meta\s+property=["']og:[^>]*>/gi, '');
    content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
    
    const seoBlock = `
    <title>${data.title}</title>
    <meta name="description" content="${data.desc}">
    <link rel="canonical" href="${domain}/${file === 'index.html' ? '' : file}">
    <meta property="og:title" content="${data.title}">
    <meta property="og:description" content="${data.desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${domain}/${file === 'index.html' ? '' : file}">
    <meta property="og:site_name" content="alfa">
    <meta property="og:image" content="${domain}/assets/og-image.jpg">`;
    
    content = content.replace(/(<meta\s+charset=["']utf-8["'][^>]*>)/i, `$1${seoBlock}`);
    content = content.replace(/^\s*[\r\n]/gm, '');
    
    fs.writeFileSync(path.join(distDir, file), content);
    console.log(`Updated SEO tags in dist/${file}`);
}

// Generate sitemap.xml
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls}
</urlset>`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent.trim());
console.log('Generated dist/sitemap.xml');

// Generate robots.txt
const robotsContent = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent);
console.log('Generated robots.txt');

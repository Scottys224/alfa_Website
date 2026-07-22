const fs = require('fs');
const path = require('path');

const domain = 'https://www.alfa.com.gn';

const pages = {
    'index.html': { 
        title: "Alfa - Super-application de transport et livraison en Guinée", 
        desc: "Commandez un chauffeur, de la nourriture ou envoyez des colis rapidement et en toute sécurité avec Alfa. La super-application n°1 en Guinée." 
    },
    'aide.html': { 
        title: "Centre d'Aide Alfa - Support et FAQ", 
        desc: "Besoin d'aide avec l'application Alfa ? Consultez notre centre d'aide, notre FAQ ou contactez le support client." 
    },
    'cgu.html': { 
        title: "Conditions Générales d'Utilisation - Alfa", 
        desc: "Lisez les conditions générales d'utilisation des services Alfa (transport, livraison, nourriture)." 
    },
    'chauffeur.html': { 
        title: "Devenez Chauffeur Partenaire Alfa en Guinée", 
        desc: "Gagnez de l'argent en conduisant avec Alfa. Inscrivez-vous comme chauffeur partenaire et gérez vos propres horaires." 
    },
    'commercant.html': { 
        title: "Devenez Commerçant Partenaire Alfa", 
        desc: "Augmentez vos ventes en rejoignant la plateforme Alfa. Proposez vos produits et plats à des milliers d'utilisateurs." 
    },
    'confidentialite.html': { 
        title: "Politique de Confidentialité - Alfa", 
        desc: "Découvrez comment Alfa protège vos données personnelles et respecte votre vie privée en Guinée." 
    },
    'contact.html': { 
        title: "Contactez-nous - Alfa Guinée", 
        desc: "Une question, une suggestion ou un partenariat ? Contactez l'équipe Alfa en Guinée via notre formulaire en ligne." 
    },
    'cookies.html': { 
        title: "Politique des Cookies - Alfa", 
        desc: "Informations sur l'utilisation des cookies par le site et l'application Alfa pour améliorer votre expérience." 
    },
    'livraison.html': { 
        title: "Livraison de Colis Express - Alfa", 
        desc: "Faites livrer vos colis rapidement et en toute sécurité avec Alfa Livraison. Suivi en temps réel de votre coursier." 
    },
    'mentions-legales.html': { 
        title: "Mentions Légales - Alfa", 
        desc: "Consultez les mentions légales de la société Alfa, super-application de services en Guinée." 
    },
    'nourriture.html': { 
        title: "Livraison de Repas et Courses - Alfa Food", 
        desc: "Commandez vos repas et courses en ligne. Alfa Food livre vos plats préférés rapidement à votre porte." 
    },
    'telechargement.html': { 
        title: "Téléchargez l'Application Alfa - iOS et Android", 
        desc: "Téléchargez l'application gratuite Alfa sur l'App Store ou Google Play pour accéder à tous nos services en Guinée." 
    }
};

let sitemapUrls = '';

for (const [file, data] of Object.entries(pages)) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${file} not found. Skipping.`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove old tags to prevent duplicates
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
    <meta property="og:site_name" content="Alfa">
    <meta property="og:image" content="${domain}/assets/og-image.jpg">`;

    // Insert new SEO block right after <meta charset="UTF-8">
    content = content.replace(/(<meta\s+charset=["']utf-8["'][^>]*>)/i, `$1${seoBlock}`);

    // Clean up empty lines that might have been left by regex removal
    content = content.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync(filePath, content);
    console.log(`Updated SEO tags in ${file}`);

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

// Generate sitemap.xml
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls}
</urlset>`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapContent.trim());
console.log('Generated sitemap.xml');

// Generate robots.txt
const robotsContent = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
fs.writeFileSync(path.join(__dirname, 'robots.txt'), robotsContent);
console.log('Generated robots.txt');

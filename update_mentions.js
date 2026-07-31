const fs = require('fs');

let content = fs.readFileSync('mentions-legales.html', 'utf8');

const targetEditor = `          <strong>alfa Guinée</strong><br />Société à Responsabilité Limitée
          (SARL)<br />Capital social : [À COMPLÉTER]<br />
          RCCM : [À COMPLÉTER] | NIF : [À COMPLÉTER]<br />
          Conakry, Guinée<br />
          Directeur de la publication : [À COMPLÉTER]<br />`;

const replaceEditor = `          <strong>alfa SARLU</strong><br />Société à Responsabilité Limitée
          (SARLU)<br />Capital social : [À COMPLÉTER]<br />
          RCCM : [À COMPLÉTER]<br />
          Siège social : Lambanyi, près des écoles Les Écureuils, commune de Lambanyi, Conakry, République de Guinée<br />
          Directeur de la publication : Diallo Ousmane<br />`;

content = content.replace(targetEditor, replaceEditor);

const targetHosting = `          Le site est hébergé par : [NOM DE L'HÉBERGEUR - À COMPLÉTER]<br />`;
const replaceHosting = `          Le site est hébergé par : CLOUDFLARE<br />`;

content = content.replace(targetHosting, replaceHosting);

fs.writeFileSync('mentions-legales.html', content);
console.log('Mentions légales updated successfully.');

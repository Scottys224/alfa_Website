const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const targetStr = `              <summary>Comment contacter le support ?</summary>
              <p>
                Depuis le menu de l'application, allez dans la section "Aide" ou
                contactez-nous via la page Centre d'Aide de ce site.
              </p>
            </details>`;

const replaceStr = `              <summary>Comment contacter le support ?</summary>
              <p>
                Depuis le menu de l'application, allez dans la section "Aide" ou
                contactez-nous via la page Centre d'Aide de ce site.
              </p>
            </details>
            <details class="faq-item">
              <summary>Comment supprimer un compte ?</summary>
              <p>
                La suppression de compte et de vos données personnelles est accessible directement depuis les paramètres de votre application Alfa. Vous pouvez également en faire la demande par e-mail. Pour connaître la procédure détaillée, <a href="Suppression_Compte_Alfa.html" style="color: var(--color-primary); text-decoration: underline;">consultez notre page dédiée</a>.
              </p>
            </details>`;

content = content.replace(targetStr, replaceStr);

// Also add footer link
content = content.replace(/(\s+<a href="mentions-legales\.html">Mentions légales<\/a>)/g, '$1\n              <a href="Suppression_Compte_Alfa.html">Suppression de compte</a>');

fs.writeFileSync('index.html', content);
console.log("Replaced using Node.");

# Rapport de revue de cybersécurité — alfa_Website

**Date :** 27 juillet 2026
**Branche :** `main` (commit `9811f63`)
**Périmètre :** revue de sécurité du code du site statique (HTML / CSS / JS client + configuration d'hébergement)
**Type :** analyse statique de code, sans exécution ni test d'intrusion

---

## 0. Note de périmètre

La commande de revue cible normalement les **modifications en attente** sur la branche.
Or, au moment de l'analyse :

```
git diff main...HEAD  → vide
git status            → 2 fichiers non suivis (rapports .md uniquement)
```

Il n'y a **aucun changement de code en attente**. La revue a donc porté sur l'**état
actuel complet du code déployé** plutôt que sur un différentiel. Les constats ci-dessous
concernent le site tel qu'il est aujourd'hui.

---

## 1. Synthèse

| # | Titre | Sévérité | Confiance | Catégorie |
|---|-------|----------|-----------|-----------|
| 1 | Content-Security-Policy supprimée de toutes les pages | **Élevée** | 9/10 | `missing_csp` / durcissement XSS |
| 2 | Scripts Node de développement publiés à la racine web | **Moyenne** | 9/10 | `information_disclosure` |
| 3 | Scripts tiers chargés sans SRI ni contrôle de consentement | **Moyenne** | 8/10 | `supply_chain` / `privacy` |
| 4 | Anti-spam (captcha + limitation) entièrement côté client | **Moyenne** | 8/10 | `client_side_control_bypass` |
| 5 | Règles de blocage `.htaccess` / `netlify.toml` inopérantes | **Faible** | 9/10 | `misconfiguration` |
| 6 | En-têtes de durcissement complémentaires absents | **Faible** | 8/10 | `security_headers` |

**Aucune vulnérabilité critique directement exploitable (RCE, injection SQL, contournement
d'authentification) n'a été identifiée.** C'est cohérent avec l'architecture : site 100 %
statique, sans backend, sans base de données, sans session utilisateur.

Le risque réel se concentre sur trois axes : **la surface XSS non contenue** (finding 1),
**la fuite d'informations d'architecture** (finding 2), et **la dépendance à des contrôles
côté client** (finding 4).

---

## 2. Constats détaillés

### Vuln 1 — Content-Security-Policy volontairement supprimée : `remove_csp.js:12`

* **Sévérité :** Élevée
* **Confiance :** 9/10
* **Catégorie :** `missing_csp`

**Description**

Un script de maintenance présent dans le dépôt a retiré la balise CSP de l'ensemble des
pages HTML :

```js
// remove_csp.js:12
content = content.replace(
  /<meta http-equiv="Content-Security-Policy" content="[^"]+">\s*/gi,
  ''
);
```

La suppression est effective : une recherche `Content-Security-Policy` sur l'ensemble du
dépôt ne retourne plus aucune balise `<meta>` ni aucun en-tête. Aucune des trois
configurations d'hébergement ne la réintroduit — `.htaccess:1-13`, `netlify.toml:1-7` et
`vercel.json:2-24` déclarent HSTS, `X-Frame-Options`, `X-Content-Type-Options` et
`Referrer-Policy`, mais **pas** `Content-Security-Policy`.

Le contexte aggrave l'impact :

* **~50 gestionnaires `onclick=` en ligne** répartis sur les 12 pages (21 sur
  `nourriture.html`, 7 sur `telechargement.html`, 3 par page ailleurs) ;
* **15 blocs `<script>` en ligne** ;
* **2 scripts tiers externes** (`translate.google.com`, `web3forms.com`) chargés sans
  restriction d'origine.

**Scénario d'exploitation**

La CSP est la barrière de confinement de dernier recours. Sans elle, tout point d'injection
— qu'il provienne d'une régression future dans le code du site, d'une compromission de
`web3forms.com/client/script.js`, ou d'une compromission du domaine de traduction —
dispose d'une exécution JavaScript sans aucune limite d'origine. L'attaquant peut alors :

1. lire en temps réel les champs des 4 formulaires (`contact.html`, `index.html`,
   `chauffeur.html`, `commercant.html`) qui collectent **nom, e-mail et téléphone** de
   candidats chauffeurs et de commerçants partenaires ;
2. exfiltrer ces données vers un domaine arbitraire (`fetch()` vers n'importe quelle
   origine, aucune directive `connect-src` ne s'y oppose) ;
3. réécrire les liens de téléchargement d'application vers un APK malveillant —
   particulièrement crédible sur un site dont la fonction principale est de distribuer
   trois applications mobiles.

**Recommandation**

Réintroduire une CSP, en commençant en mode observation pour ne rien casser :

```
Content-Security-Policy-Report-Only:
  default-src 'self';
  script-src 'self' https://translate.google.com https://translate.googleapis.com https://web3forms.com https://*.hcaptcha.com;
  style-src 'self' 'unsafe-inline' https://translate.googleapis.com;
  img-src 'self' data: https://translate.googleapis.com https://www.google.com;
  connect-src 'self' https://api.web3forms.com https://translate.googleapis.com;
  frame-src https://*.hcaptcha.com;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self' https://api.web3forms.com;
  object-src 'none'
```

À déclarer dans `netlify.toml` / `vercel.json` (en-tête HTTP, pas balise `<meta>` : la
directive `frame-ancestors` est ignorée en `<meta>`). Une fois les rapports de violation
propres, basculer sur l'en-tête bloquant.

**Point d'attention :** passer à `script-src` sans `'unsafe-inline'` exige d'externaliser
au préalable les ~50 `onclick=` et les 15 blocs en ligne. Recommandé, mais à traiter comme
un chantier séparé. Une CSP avec `'unsafe-inline'` reste déjà une amélioration nette : elle
verrouille `connect-src`, `form-action` et `object-src`, qui sont les vecteurs
d'exfiltration.

**Enfin :** supprimer `remove_csp.js` du dépôt. Son maintien risque de re-supprimer la CSP
à la prochaine exécution.

---

### Vuln 2 — Scripts Node de développement publiés à la racine web

* **Sévérité :** Moyenne
* **Confiance :** 9/10
* **Catégorie :** `information_disclosure`

**Description**

Netlify et Vercel servent l'intégralité du dépôt. Environ **25 fichiers `.js` de
développement** se trouvent à la racine et sont donc accessibles publiquement :

| Fichier | Contenu exposé |
|---------|----------------|
| `remove_csp.js` | Confirme que la CSP a été retirée volontairement |
| `puppeteer_debug.js` | Procédure de débogage interne |
| `audit.js`, `convert_images.js`, `download_fonts.js` | Chaîne d'outillage |
| `fix_*.js` (17 fichiers) | Historique des correctifs, y compris de sécurité |
| `restore_*.js` (4 fichiers) | Logique de restauration |
| `tools/seo_update.js` | Script SEO |
| `package.json`, `package-lock.json` | Inventaire complet des dépendances (puppeteer 25.4.0, sharp 0.35.3, image-size 2.0.2) |

Plusieurs contiennent le chemin absolu de la machine de développement :

```js
// remove_csp.js:4
const dir = 'c:/Users/HP/Desktop/alfa_Website';
```

**Scénario d'exploitation**

Un attaquant qui récupère `https://<domaine>/remove_csp.js` apprend en une requête que le
site n'a aucune CSP — sans avoir à la tester. Les 17 fichiers `fix_*.js` documentent
l'historique des correctifs (`fix_inline_scripts.js`, `fix_notranslate.js`,
`restore_onclicks.js`), ce qui cartographie les faiblesses passées et la logique
applicative. `package-lock.json` fournit la liste exacte des dépendances et de leurs
versions, exploitable pour rechercher des CVE connues.

Ce n'est pas une exploitation directe, mais c'est du renseignement de qualité offert
gratuitement, et cela révèle une faille de conception dans le processus de déploiement :
**rien ne sépare le code source de l'artefact publié.**

**Recommandation**

Solution privilégiée — sortir ces fichiers de la racine publiée :

```
alfa_Website/
├── public/          ← répertoire de publication (HTML, css/, js/, assets/)
└── scripts/         ← tous les fix_*.js, restore_*.js, audit.js, etc.
```

puis dans `netlify.toml` :

```toml
[build]
  publish = "public"
```

et dans `vercel.json` : `"outputDirectory": "public"`.

Solution provisoire, si la restructuration doit attendre — bloquer par motif, et non
fichier par fichier :

```toml
# netlify.toml
[[redirects]]
  from = "/*.js"
  to = "/404.html"
  status = 404
  conditions = { }   # ⚠ à restreindre : ne doit PAS toucher /js/*
```

Il est plus sûr de bloquer explicitement `/fix_*`, `/restore_*`, `/audit.js`,
`/convert_images.js`, `/download_fonts.js`, `/puppeteer_debug.js`, `/remove_csp.js`,
`/tools/*`, `/package.json`, `/package-lock.json`.

---

### Vuln 3 — Scripts tiers sans SRI, chargés avant le consentement

* **Sévérité :** Moyenne
* **Confiance :** 8/10
* **Catégorie :** `supply_chain` / `privacy`

**Description**

Deux scripts tiers sont chargés en dur dans les pages :

```html
<!-- index.html:1404, contact.html:784, chauffeur.html:726, commercant.html:717 -->
<script src="https://web3forms.com/client/script.js" async defer></script>

<!-- présent sur les 12 pages, ex. index.html:1463 -->
<script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"></script>
```

Aucun attribut `integrity`, aucune CSP pour restreindre ce qu'ils peuvent faire une fois
exécutés (cf. finding 1). Un script tiers compromis obtient un contrôle total du DOM,
formulaires inclus.

**Second problème, de conformité cette fois.** Le module de consentement `js/cookies-consent.js`
ne gouverne plus ces chargements :

```js
// js/cookies-consent.js:165-167
function applyConsent(consent) {
  // Web3Forms and Google Translate are now loaded statically in the HTML
  if (consent.analytics) { loadGoogleAnalytics(); }
```

Les deux scripts s'exécutent donc **dès le premier chargement de page**, avant tout choix
de l'utilisateur, alors que la bannière de consentement et la page `confidentialite.html`
laissent entendre le contraire. `translate.google.com` reçoit l'IP et l'empreinte
navigateur de chaque visiteur sans consentement préalable — exposition RGPD directe, et
incohérence entre la politique affichée et le comportement réel du site.

**Recommandation**

1. **SRI** — ajouter `integrity` + `crossorigin="anonymous"` sur
   `web3forms.com/client/script.js` (URL stable, empreinte calculable).
   Pour `translate.google.com/translate_a/element.js`, le SRI est **inapplicable** : Google
   modifie le contenu dynamiquement, l'empreinte casserait la traduction. Le confinement
   passe ici par la CSP (`script-src` restreint aux origines Google) — voir finding 1.
2. **Consentement** — recharger GTranslate dynamiquement dans `applyConsent()`, comme cela
   se fait déjà proprement pour Google Analytics (`cookies-consent.js:194-202`) et Meta
   Pixel (`:247-257`). Retirer les balises statiques des 12 pages.
   Web3Forms est fonctionnellement nécessaire aux formulaires : le charger à la première
   interaction avec un formulaire est défendable, mais doit être documenté dans
   `confidentialite.html`.
3. Aligner `confidentialite.html` et `cookies.html` sur le comportement réel.

---

### Vuln 4 — Protection anti-spam intégralement côté client : `js/form-handler.js:20-45`

* **Sévérité :** Moyenne
* **Confiance :** 8/10
* **Catégorie :** `client_side_control_bypass`

**Description**

Les quatre formulaires envoient vers `https://api.web3forms.com/submit` avec une clé
publique visible dans le HTML :

```html
<!-- contact.html:397-399, index.html:736-738, + chauffeur.html, commercant.html -->
<input type="hidden" name="access_key" value="003e9773-ce3d-484e-a71f-c64fe062cf9b" />
```

Cette clé est publique **par conception** chez Web3Forms — ce n'est pas un secret fuité.
Le problème est ailleurs : les seules protections en place sont côté navigateur.

*Limitation de débit* — stockée dans `localStorage` (`form-handler.js:34-45`) : un
`localStorage.clear()` ou une requête `curl` directe la contourne intégralement.

*Garde captcha* — la condition est structurellement contournable :

```js
// js/form-handler.js:25
if (form.querySelector('.h-captcha') && jetonCaptcha && !jetonCaptcha.value) {
```

Si `web3forms.com/client/script.js` n'a pas fini de charger (`async defer`), le widget
hCaptcha n'a pas encore injecté le champ `h-captcha-response`. `jetonCaptcha` vaut alors
`null`, la condition est fausse, et **le formulaire part sans captcha**.

**Scénario d'exploitation**

Un `POST` direct vers `api.web3forms.com/submit` avec la clé lue dans le HTML, en boucle,
inonde la boîte de réception `alfa6ams@gmail.com`. Aucun contrôle côté navigateur ne
s'applique puisque le navigateur n'est pas dans la boucle. Impact : noyade des vraies
candidatures chauffeurs et demandes de partenariat commerçants sous le bruit.

**Recommandation**

Le seul contrôle qui compte est côté serveur :

1. Dans le tableau de bord Web3Forms, activer **« Require Captcha »** sur la clé d'accès.
   Web3Forms rejette alors toute soumission sans jeton hCaptcha valide, quel que soit le
   client. C'est la correction essentielle.
2. Activer également le filtrage anti-spam et la restriction de domaine (`Allowed Domains`)
   pour n'accepter que les soumissions provenant du domaine de production.
3. Utiliser **une clé d'accès distincte par formulaire**. Actuellement les quatre partagent
   `003e9773-…` : en cas d'abus, la révocation casse les quatre formulaires d'un coup.
4. Optionnel — corriger le garde côté client pour bloquer quand le widget est présent mais
   le jeton absent :

```js
const conteneurCaptcha = form.querySelector('.h-captcha');
if (conteneurCaptcha && (!jetonCaptcha || !jetonCaptcha.value)) {
  alert("Veuillez valider le contrôle anti-robot avant d'envoyer.");
  return;
}
```

C'est du confort utilisateur, pas de la sécurité : le point 1 reste indispensable.

---

### Vuln 5 — Règles de blocage inopérantes : `.htaccess:16-19`, `netlify.toml:14-17`, `vercel.json:31-35`

* **Sévérité :** Faible
* **Confiance :** 9/10
* **Catégorie :** `misconfiguration`

**Description**

Deux problèmes distincts, tous deux donnant une fausse impression de protection.

**a) `.htaccess` est inerte.** Le dépôt contient `netlify.toml` et `vercel.json`, donc
l'hébergement est Netlify ou Vercel. Ni l'un ni l'autre n'interprète `.htaccess` (Apache
uniquement). L'intégralité de ce bloc n'a donc aucun effet en production :

```apache
# .htaccess:16-19 — jamais évalué sur Netlify/Vercel
RedirectMatch 404 /\.git
<FilesMatch "^(seo_update\.js|\.gitignore|fix\.js|download_fonts\.js|fix_links\.js)$">
  Require all denied
</FilesMatch>
```

À noter que les en-têtes de sécurité du même fichier (`.htaccess:1-13`) sont, eux,
correctement dupliqués dans `netlify.toml` et `vercel.json` — c'est la partie blocage de
fichiers qui n'a pas de contrepartie.

**b) La règle de blocage ne vise pas le bon chemin.** `netlify.toml:14-17` et
`vercel.json:31-35` bloquent `/seo_update.js`. Or le fichier réel se trouve en
`tools/seo_update.js`, servi à l'URL `/tools/seo_update.js`. **La règle ne correspond à
rien.** Le fichier reste accessible.

Par ailleurs, même si `.htaccess` s'appliquait, sa liste ne couvre que 5 des ~25 scripts de
développement (finding 2).

**Recommandation**

Traiter ce point dans le cadre du finding 2 : la restructuration en répertoire `public/`
rend ces règles superflues. En attendant, corriger a minima le chemin :

```toml
[[redirects]]
  from = "/tools/*"
  to = "/404.html"
  status = 404
```

Supprimer `.htaccess` s'il n'existe pas de déploiement Apache, ou documenter explicitement
qu'il ne s'applique qu'à un environnement secondaire — laisser un fichier de protection
inopérant en place induit en erreur lors des revues futures.

---

### Vuln 6 — En-têtes de durcissement complémentaires absents

* **Sévérité :** Faible
* **Confiance :** 8/10
* **Catégorie :** `security_headers`

**Description**

La base est saine — HSTS avec `preload`, `X-Frame-Options: SAMEORIGIN`, `nosniff` et
`Referrer-Policy: strict-origin-when-cross-origin` sont présents et correctement
configurés dans les trois fichiers d'hébergement. Manquent :

* `Permissions-Policy` — aucune restriction sur géolocalisation, caméra, micro. Un site de
  livraison est une cible plausible pour un abus de `geolocation` via script tiers.
* `Cross-Origin-Opener-Policy: same-origin` — isolation du contexte de navigation.
* `frame-ancestors` en CSP — `X-Frame-Options` couvre l'essentiel, mais reste l'en-tête
  hérité ; `frame-ancestors` est la directive normative.

**Recommandation**

```toml
# netlify.toml, dans [headers.values]
Permissions-Policy = "geolocation=(), camera=(), microphone=(), payment=(), usb=()"
Cross-Origin-Opener-Policy = "same-origin"
```

Ajuster si une fonctionnalité de géolocalisation est prévue côté site (elle ne l'est pas
aujourd'hui : aucun appel à `navigator.geolocation` dans le code).

---

## 3. Points vérifiés et jugés non vulnérables

Ces éléments ont été analysés en détail et écartés. Ils sont documentés pour éviter qu'une
revue ultérieure ne les signale à tort.

**`aide.html:913-951` — surbrillance de recherche via `innerHTML` → pas de XSS.**
La fonction ressemble à un XSS DOM classique, mais ne l'est pas :

```js
const escapeRegExp = (chaine) => chaine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // :911
regex = new RegExp(`(${escapeRegExp(search)})`, "gi");                          // :917
return text.replace(regex, "<mark>$1</mark>");                                  // :921
```

Trois raisons : (1) les métacaractères de regex sont échappés ligne 911 ; (2) `$1` est la
portion capturée de `text`, c'est-à-dire le HTML **d'origine** de la carte sauvegardé
lignes 903-904 — la saisie utilisateur n'est jamais réinjectée dans le DOM ; (3) seuls les
littéraux `<mark>` et `</mark>` sont ajoutés. Le pire scénario est une corruption
d'affichage si le terme recherché correspond à du balisage, sans exécution de script, et
sans persistance (restauration lignes 926-927). *Non exploitable.*

**`js/interactions.js:49-74` — `smartLink` → pas de redirection ouverte ni d'injection
d'intent.** Le type d'application est résolu via une table figée (`Object.freeze`), et une
clé inconnue provoque un `return` immédiat (`:62`). L'URL de destination est construite à
partir de constantes, jamais de saisie utilisateur, et `S.browser_fallback_url` est passé
dans `encodeURIComponent()` (`:74`). *Non exploitable.*

**`window.location.hash` sur les 12 pages** — le fragment sert uniquement de test de
longueur (`window.location.hash.length > 1`) pour piloter une classe CSS anti-flash. Sa
valeur n'est jamais écrite dans le DOM ni évaluée. *Non exploitable.*

**`js/main.js:31,36` — `innerHTML`** — affectations de littéraux SVG statiques, sans aucune
donnée variable. *Non exploitable.*

**Liens `target="_blank"`** — `rel="noopener"` est présent sur la totalité des 25
occurrences réparties sur les 12 pages. *Correctement traité.*

**Gestion des secrets** — aucun secret exposé hormis la clé Web3Forms, publique par
conception (voir finding 4). `.gitignore` couvre correctement `.env`, `.env.*`, `*.pem`,
`*.key`, `serviceAccountKey.json` et `firebase-adminsdk-*.json`. Les identifiants
Analytics/Pixel de `cookies-consent.js:10-11` sont des valeurs fictives
(`G-XXXXXXXXXX`, `123456789012345`) correctement neutralisées par un garde-fou
(`:180-188`, `:218-226`). *Rien à signaler.*

**Injections classiques** — pas de backend, pas de base de données, pas de moteur de
templates, pas de `eval()`, pas de `new Function()`, pas de `document.write()`. Les
catégories injection SQL / NoSQL / commande / XXE / template / désérialisation sont **sans
objet** pour cette architecture.

---

## 4. Hors sécurité — un défaut fonctionnel bloquant

Constat relevé pendant l'analyse, sans impact de sécurité mais qui mérite un correctif
rapide.

**`telechargement.html` — les boutons de téléchargement sont inopérants.**
Sept gestionnaires appellent `smartLink(...)` :

```html
<!-- telechargement.html:329, 385, 416, et :600 (bannière) -->
<a class="btn-store" onclick="smartLink('client', 'android'); return false;">
```

Or **`smartLink` n'est définie nulle part** dans le projet. La logique équivalente vit dans
`js/interactions.js:55-76`, mais celle-ci s'attache aux éléments de classe `.smart-link` via
`data-app` / `data-os` — or `telechargement.html` ne contient aucun élément de cette classe,
et n'inclut d'ailleurs pas `js/interactions.js` (seul `js/main.js` est chargé, ligne 588).

Chaque clic sur un bouton de téléchargement déclenche donc un
`ReferenceError: smartLink is not defined` et ne fait rien. Sur la page dont c'est
l'unique fonction, cela mérite vérification en priorité.

**Correction :** soit inclure `js/interactions.js` dans `telechargement.html` et convertir
les boutons au format `class="smart-link" data-app="client" data-os="android"`, soit
définir `smartLink()` globalement. La première option est préférable — elle supprime au
passage 7 gestionnaires en ligne, ce qui rapproche le site d'une CSP sans `'unsafe-inline'`
(finding 1).

---

## 5. Plan d'action recommandé

| Priorité | Action | Finding | Effort |
|----------|--------|---------|--------|
| 1 | Activer « Require Captcha » + domaines autorisés sur Web3Forms | 4 | 10 min, console |
| 2 | Déployer la CSP en `Report-Only`, puis basculer en bloquant | 1 | 1-2 h |
| 3 | Restructurer en `public/` pour sortir les scripts Node de la racine | 2, 5 | 1-2 h |
| 4 | Corriger `smartLink` sur `telechargement.html` | §4 | 30 min |
| 5 | Recharger GTranslate après consentement + aligner la doc RGPD | 3 | 1 h |
| 6 | Ajouter `Permissions-Policy` et `COOP` | 6 | 10 min |
| 7 | Supprimer `remove_csp.js` du dépôt | 1 | 1 min |
| 8 | Clés Web3Forms distinctes par formulaire | 4 | 20 min |

---

## 6. Méthodologie et limites

**Réalisé :** lecture intégrale des 12 pages HTML, des 5 fichiers `js/`, des 3
configurations d'hébergement et des scripts de maintenance ; recherche ciblée des motifs
d'injection (`innerHTML`, `eval`, `document.write`, `new Function`, `insertAdjacentHTML`),
des sources contrôlables par l'attaquant (`location.*`, `URLSearchParams`,
`document.referrer`, `postMessage`), des secrets en clair et des scripts tiers ; traçage du
flux de données des formulaires jusqu'à l'appel réseau.

**Non réalisé :** aucun test dynamique, aucune requête vers le site déployé, aucune
vérification des en-têtes réellement servis en production, aucun audit des dépendances npm
(hors périmètre de cette revue), aucune revue de l'infrastructure Web3Forms ou du backend
des applications mobiles.

**Vérification recommandée en complément :** confirmer que les en-têtes déclarés dans
`netlify.toml` / `vercel.json` sont bien émis par la plateforme de production
(`curl -I https://<domaine>`), et confirmer l'accessibilité publique des scripts du
finding 2 (`curl -I https://<domaine>/remove_csp.js`) — l'analyse statique établit que
rien ne les bloque, mais seule une requête réelle le confirme.

---

## 7. Annexe — correctifs prêts à appliquer

> **Aucun fichier de code n'a été modifié par cette revue.** Les blocs ci-dessous sont
> fournis à titre de proposition, à appliquer manuellement au rythme souhaité. Ils sont
> classés dans l'ordre du plan d'action de la section 5.

### A.1 — Console Web3Forms (priorité 1, aucun code)

Rien à modifier dans le dépôt. Dans le tableau de bord Web3Forms, sur la clé
`003e9773-ce3d-484e-a71f-c64fe062cf9b` :

- [ ] Activer **Require Captcha** → les soumissions sans jeton hCaptcha valide sont
      rejetées côté serveur, y compris les `POST` directs. *C'est la correction qui compte.*
- [ ] Activer **Spam Protection**.
- [ ] Renseigner **Allowed Domains** avec le domaine de production uniquement.
- [ ] À terme, créer 4 clés distinctes (contact / notify / chauffeur / commerçant) afin
      qu'une révocation n'affecte qu'un seul formulaire.

### A.2 — `netlify.toml` (findings 1, 2, 5, 6)

CSP en mode observation : les violations sont signalées dans la console du navigateur,
rien n'est bloqué. Après vérification des 12 pages (traduction, formulaires, captcha),
renommer la clé en `Content-Security-Policy` pour activer le blocage.

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), camera=(), microphone=(), payment=(), usb=()"
    Cross-Origin-Opener-Policy = "same-origin"
    Content-Security-Policy-Report-Only = """\
      default-src 'self'; \
      base-uri 'self'; \
      object-src 'none'; \
      frame-ancestors 'self'; \
      form-action 'self' https://api.web3forms.com; \
      script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://*.gstatic.com https://web3forms.com https://*.hcaptcha.com https://www.googletagmanager.com https://connect.facebook.net; \
      style-src 'self' 'unsafe-inline' https://translate.googleapis.com https://www.gstatic.com https://*.hcaptcha.com; \
      img-src 'self' data: https:; \
      font-src 'self' data:; \
      connect-src 'self' https://api.web3forms.com https://translate.googleapis.com https://*.hcaptcha.com https://www.google-analytics.com; \
      frame-src https://*.hcaptcha.com; \
      worker-src 'self' blob:\
      """

# Blocage des fichiers de développement (Netlify publie tout le dépôt)
[[redirects]]
  from = "/.git/*"
  to = "/404.html"
  status = 404

[[redirects]]
  from = "/tools/*"
  to = "/404.html"
  status = 404

[[redirects]]
  from = "/package.json"
  to = "/404.html"
  status = 404

[[redirects]]
  from = "/package-lock.json"
  to = "/404.html"
  status = 404
```

> **Note TOML :** la barre oblique inverse en fin de ligne dans une chaîne `"""` supprime
> le saut de ligne *et* l'indentation suivante — la valeur produite est bien sur une seule
> ligne, comme l'exige un en-tête HTTP.
>
> **Note sur `/scripts/*` :** cette règle n'a de sens qu'après avoir déplacé les ~25
> scripts de développement dans un répertoire `scripts/` (voir A.5). Tant que les fichiers
> sont à la racine, il faut les bloquer un par un, ou appliquer A.5.

### A.3 — `vercel.json` (mêmes correctifs)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=(), payment=(), usb=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Content-Security-Policy-Report-Only", "value": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self' https://api.web3forms.com; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://*.gstatic.com https://web3forms.com https://*.hcaptcha.com https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://translate.googleapis.com https://www.gstatic.com https://*.hcaptcha.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.web3forms.com https://translate.googleapis.com https://*.hcaptcha.com https://www.google-analytics.com; frame-src https://*.hcaptcha.com; worker-src 'self' blob:" }
      ]
    }
  ],
  "redirects": [
    { "source": "/.git/(.*)",      "destination": "/404.html", "permanent": false },
    { "source": "/tools/(.*)",     "destination": "/404.html", "permanent": false },
    { "source": "/package.json",   "destination": "/404.html", "permanent": false },
    { "source": "/package-lock.json", "destination": "/404.html", "permanent": false }
  ]
}
```

> La règle `/seo_update.js` des configurations actuelles est remplacée par `/tools/*`,
> qui correspond au chemin réel du fichier (finding 5).

### A.4 — Prérequis avant de basculer la CSP en mode bloquant

Vérifier dans la console du navigateur, sur chaque page, l'absence de violation pour :

| À tester | Page | Attendu |
|----------|------|---------|
| Sélecteur de langue FR / EN / ZH | les 12 pages | traduction fonctionnelle |
| Affichage du widget hCaptcha | `contact`, `index`, `chauffeur`, `commercant` | widget rendu |
| Envoi de formulaire | idem | message de succès |
| Bannière cookies + « Personnaliser » | les 12 pages | ouverture/fermeture |
| Modales cuisine | `nourriture` | ouverture/fermeture |

Si une violation `script-src` apparaît sur un domaine Google non listé (typiquement
`*.gstatic.com` ou `translate.googleapis.com`), l'ajouter à la directive plutôt que de
revenir en arrière.

### A.5 — Sortir les scripts de développement de la racine (finding 2)

Ces ~25 fichiers ne sont référencés par aucune page HTML — leur déplacement n'affecte pas
le site. Commandes proposées, à exécuter à votre convenance :

```bash
mkdir scripts
git mv audit.js convert_images.js download_fonts.js puppeteer_debug.js remove_csp.js scripts/
git mv fix.js fix_contrast.js fix_duplicates.js fix_e2_e9.js fix_gtranslate.js scripts/
git mv fix_inline_scripts.js fix_interactions.js fix_lang_btns.js fix_links.js scripts/
git mv fix_minor_docs.js fix_nav_dropdown.js fix_notranslate.js fix_redundant_lang.js scripts/
git mv fix_responsive.js fix_social.js fix_success_ids.js scripts/
git mv really_fix_gtranslate.js remove_web3forms.js restore_cross.js scripts/
git mv restore_func.js restore_gtranslate.js restore_onclicks.js speed_up_gtranslate.js scripts/
```

Puis ajouter la règle `/scripts/*` de A.2 / A.3.

**Cas particulier — `remove_csp.js` :** ce script re-supprimerait la CSP à la prochaine
exécution, annulant le correctif A.2. Il est préférable de le **supprimer** plutôt que de
le déplacer (`git rm remove_csp.js`). Son contenu reste consultable dans l'historique Git
si besoin.

### A.6 — Garde captcha côté client (finding 4, confort)

`js/form-handler.js`, ligne 25 — la condition actuelle laisse passer la soumission quand
le widget hCaptcha n'a pas encore injecté son champ caché :

```js
// Actuel — jetonCaptcha vaut null tant que le widget n'est pas rendu → passe
if (form.querySelector('.h-captcha') && jetonCaptcha && !jetonCaptcha.value) {

// Proposé — bloque dès que le conteneur existe mais que le jeton manque ou est vide
const conteneurCaptcha = form.querySelector('.h-captcha');
if (conteneurCaptcha && (!jetonCaptcha || !jetonCaptcha.value)) {
```

Rappel : il s'agit d'un confort utilisateur. Un `POST` direct vers l'API ignore ce code —
seul A.1 protège réellement.

### A.7 — `smartLink` sur `telechargement.html` (défaut fonctionnel, section 4)

Option recommandée — réutiliser la logique existante de `js/interactions.js`, ce qui
supprime au passage 7 gestionnaires en ligne :

1. Ajouter le script à la page, à côté de `main.js` (ligne 588) :

```html
<script src="js/interactions.js" defer></script>
```

2. Convertir les 6 boutons (lignes 329, 385, 416 et suivantes) :

```html
<!-- Actuel -->
<a class="btn-store" onclick="smartLink('client', 'android'); return false;">

<!-- Proposé -->
<a class="btn-store smart-link" data-app="client" data-os="android" href="https://play.google.com/store/apps/details?id=com.alfa.client">
```

En utilisant `data-app` = `client` | `merchant` | `driver` selon le bouton, conformément à
la table `APPLICATIONS` de `js/interactions.js:49-53`. L'attribut `href` sert de repli si
JavaScript est désactivé.

3. Pour la bannière générée dynamiquement (ligne 600), remplacer le lien à `onclick` par
   le même format :

```js
smartBanner.innerHTML =
  "Vous êtes sur Android. Téléchargez rapidement notre app sur Google Play ! " +
  "<a class=\"smart-link\" data-app=\"client\" data-os=\"android\" " +
  "href=\"https://play.google.com/store/apps/details?id=com.alfa.client\">Télécharger</a>";
```

⚠ La bannière étant injectée après le `DOMContentLoaded` de `interactions.js`, son lien ne
sera pas capté par la boucle d'attachement. Il faut soit injecter la bannière avant, soit
réattacher le gestionnaire après l'injection.

### A.8 — Consentement et GTranslate (finding 3) — décision produit requise

Ce correctif n'est **pas fourni clé en main** car il implique un arbitrage qui ne relève
pas de la revue technique : gater le chargement de Google Translate derrière le
consentement signifie que **les visiteurs qui refusent les cookies perdent la traduction**,
sur un site dont le multilinguisme est une fonctionnalité centrale.

Trois options, à trancher côté produit :

| Option | Conformité RGPD | Impact utilisateur |
|--------|-----------------|--------------------|
| Charger GTranslate uniquement après consentement | Conforme | Traduction indisponible si refus |
| Remplacer GTranslate par des traductions statiques auto-hébergées | Conforme, aucun tiers | Chantier conséquent (12 pages × 3 langues) |
| Conserver le chargement statique | Non conforme | Aucun |

Quelle que soit l'option retenue, `confidentialite.html` et `cookies.html` doivent décrire
le comportement **réel** du site. C'est aujourd'hui le principal écart : la politique
affichée ne correspond pas au code (`js/cookies-consent.js:165-167`).

---

*Revue effectuée par analyse statique du code source, sur la base de l'état de la branche
`main` au 27 juillet 2026. Aucun fichier de code n'a été modifié.*

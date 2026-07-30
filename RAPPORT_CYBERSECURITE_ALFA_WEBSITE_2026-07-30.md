# RAPPORT DE CYBERSÉCURITÉ — alfa_Website

**Date de l'audit** : 30 juillet 2026
**Dépôt** : `C:\Users\alpha\Desktop\alfa_Website` — branche `main` (commit `582798b`)
**Mode** : audit en **lecture seule**. Aucun fichier source n'a été modifié, déplacé, supprimé ni reformaté. Aucun commit, aucune branche, aucune PR, aucun déploiement, aucune modification de configuration tierce.
**Seul fichier créé** : le présent rapport.

> **Note sur le nom du fichier** : le nom demandé (`RAPPORT_CYBERSECURITE_ALFA_WEBSITE.md`) contenait déjà un audit antérieur de 86 Ko, non suivi par git. L'écraser l'aurait détruit définitivement. Ce rapport a donc été écrit sous un nom daté. L'ancien rapport est intact.

---

## 1. RÉSUMÉ EXÉCUTIF

`alfa_Website` est un **site statique pur** : 14 pages HTML, 6 fichiers JavaScript côté navigateur, 3 feuilles de style, aucun backend, aucune base de données, aucun code serveur, aucun système d'authentification. Cette architecture élimine par construction des familles entières de vulnérabilités : **aucune injection SQL/NoSQL, aucune injection de commande, aucune SSRF, aucune désérialisation, aucune traversée de répertoire, aucun IDOR, aucun contrôle d'accès cassé, aucune gestion de session à compromettre.** Il n'y a ni compte utilisateur, ni page d'administration, ni endpoint API propre au site.

**Aucune vulnérabilité CRITIQUE n'a été identifiée.** Aucun secret réel (clé privée, mot de passe, jeton d'administration, `.env`, certificat, clé de service Firebase) n'est présent dans le code ni dans l'historique Git. `.gitignore` couvre correctement `.env*`, `*.pem`, `*.key`, `serviceAccountKey.json` et `firebase-adminsdk-*.json`. `npm audit` remonte **0 vulnérabilité**.

Le risque réel se concentre sur **trois axes** :

1. **La surface tierce non contrainte** (SEC-001) — deux scripts externes (Google Translate, Web3Forms/hCaptcha) obtiennent un accès total au DOM de toutes les pages, y compris celles qui portent des formulaires de collecte de données personnelles, et **aucune Content-Security-Policy n'existe** sur l'ensemble du dépôt pour limiter ce qu'ils peuvent charger ou vers où ils peuvent émettre.
2. **L'abus du canal formulaire** (SEC-002) — la clé d'accès Web3Forms et les champs cachés `subject` / `from_name` sont entièrement pilotables par le client, ce qui permet d'adresser des e-mails de contenu arbitraire à l'adresse de contact d'alfa en se présentant comme le site lui-même.
3. **La conformité RGPD du consentement** (SEC-003, SEC-004) — Google Translate est chargé **avant** tout consentement et n'est **pas déclaré** dans la liste des sous-traitants de la politique de confidentialité ; le retrait du consentement ne décharge pas les traceurs déjà actifs.

Les en-têtes de sécurité de base sont présents et correctement valorisés (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) sur les trois plateformes de déploiement configurées. Les liens `target="_blank"` portent tous `rel="noopener noreferrer"`. Les polices sont auto-hébergées. Aucun `eval`, `new Function`, `document.write` ni `postMessage` dans le projet.

### Note globale du site

| Domaine | Note | Commentaire |
|---|---|---|
| Secrets et données sensibles | **18 / 20** | Aucun secret réel. Seule la clé publique Web3Forms, publique par conception. |
| Surface d'attaque applicative | **17 / 20** | Site statique : familles d'injections serveur inexistantes. |
| Formulaires et anti-abus | **11 / 20** | hCaptcha présent côté navigateur, mais contournable en attaquant l'API directement. |
| En-têtes HTTP | **12 / 20** | Base solide, mais **aucune CSP**, ni Permissions-Policy, ni COOP/CORP. |
| Services tiers | **10 / 20** | 2 scripts externes non contraints, sans SRI ni CSP. |
| Dépendances | **17 / 20** | `npm audit` = 0. Classement `dependencies` / `devDependencies` incorrect. |
| Confidentialité et cookies | **11 / 20** | Bannière fonctionnelle, mais Google Translate hors consentement et non déclaré. |
| Hygiène de production | **14 / 20** | `test.html` déployé ; trois configurations de plateforme divergentes. |
| **NOTE GLOBALE** | **14 / 20** | **Posture correcte pour un site vitrine. Aucun risque critique. Deux chantiers prioritaires : CSP et durcissement du canal formulaire.** |

---

## 2. PÉRIMÈTRE ANALYSÉ

**Analyse exhaustive du dépôt entier**, et non du seul `git diff` : `git diff HEAD` et `git diff main...` sont vides sur cette branche (l'arbre de travail est propre, seuls trois rapports Markdown sont non suivis). L'audit a donc porté sur la totalité des fichiers présents.

**Inclus dans l'analyse ligne par ligne :**

- Les 14 pages HTML : `index.html`, `404.html`, `aide.html`, `cgu.html`, `chauffeur.html`, `commercant.html`, `confidentialite.html`, `contact.html`, `cookies.html`, `livraison.html`, `mentions-legales.html`, `nourriture.html`, `telechargement.html`, `test.html`
- Les 6 fichiers JavaScript : `js/main.js`, `js/form-handler.js`, `js/cookies-consent.js`, `js/gtranslate.js`, `js/interactions.js`, `tools/seo_update.js`
- Les 3 feuilles de style : `css/style.css`, `css/cookies-consent.css`, `assets/fonts/fonts.css`
- Les 8 fichiers de configuration et de métadonnées : `.htaccess`, `vercel.json`, `netlify.toml`, `.gitignore`, `package.json`, `package-lock.json`, `robots.txt`, `sitemap.xml`
- `.claude/settings.local.json`
- Tous les scripts inline de chaque page HTML (`<script>` non sourcés), les blocs `application/ld+json`, tous les gestionnaires d'événements inline (`on*=`), tous les attributs `href` externes
- L'historique Git complet (`git log --all`), recherché par contenu (`git log -S`) sur les motifs de secrets

**Inventoriés sans lecture binaire** : 314 fichiers binaires (30 polices `.woff2` auto-hébergées, ~284 images `.webp`). Vérification par extension et par inventaire : aucun format exécutable, aucune archive, aucune sauvegarde, aucun fichier `.env`, `.pem`, `.key`, `.sql`, `.bak`, `.old`, `.zip`, `.log`.

**Explicitement hors périmètre** (absents du dépôt) : le backend de l'application mobile alfa, la configuration Firebase (règles Firestore/Storage, Cloud Functions, App Check), l'intégration de paiement FedaPay, le tableau de bord Web3Forms, la configuration DNS et TLS réelle. La politique de confidentialité mentionne Firebase, Google Maps et FedaPay : ces composants appartiennent à l'**application mobile** et **n'existent nulle part dans ce dépôt** (vérifié — voir §10).

---

## 3. NOMBRE DE FICHIERS EXAMINÉS

| Catégorie | Nombre |
|---|---|
| Fichiers suivis par Git (`git ls-files`) | **346** |
| Fichiers non suivis (rapports Markdown) | 3 |
| Fichiers hors index inspectés (`.claude/settings.local.json`) | 1 |
| **Total de fichiers énumérés** | **350** |
| — dont **fichiers texte examinés ligne par ligne** | **31** |
| ‎ ‎ ‎ • pages HTML | 14 |
| ‎ ‎ ‎ • fichiers JavaScript | 6 |
| ‎ ‎ ‎ • feuilles de style CSS | 3 |
| ‎ ‎ ‎ • fichiers de configuration / métadonnées | 8 |
| — dont **fichiers binaires inventoriés** (images, polices) | **314** |
| — dont rapports Markdown antérieurs (exclus des constats) | 3 |
| — dont `.gitkeep` et divers | 2 |
| Commits de l'historique Git analysés | 5 |

---

## 4. VULNÉRABILITÉS CRITIQUES

**Aucune.**

Aucune vulnérabilité permettant une exécution de code à distance, une compromission de serveur, un contournement d'authentification ou une exfiltration directe de base de données n'a été identifiée. Cela découle logiquement de l'architecture : il n'y a **ni serveur applicatif, ni base de données, ni authentification, ni session** dans ce dépôt. Il n'y a rien à contourner, et aucun stockage à vider.

Cette absence est un constat vérifié, pas une omission de l'audit. Les recherches suivantes ont toutes donné un résultat **vide** :

```
$ grep -rnaEo "(sk_live|sk_test|pk_live|AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{36}
             |xox[baprs]-|BEGIN [A-Z ]*PRIVATE KEY|Bearer [A-Za-z0-9._-]{20,}
             |AKIA[0-9A-Z]{16})" --include=*.html --include=*.js --include=*.json .
(aucun résultat)

$ grep -rnE "eval\(|new Function|document\.write|postMessage" --include=*.html --include=*.js .
(aucun résultat)

$ npm audit --json
"vulnerabilities": {}, "total": 0
```

---

## 5. VULNÉRABILITÉS ÉLEVÉES

### SEC-001 — Absence totale de Content-Security-Policy sur un site qui charge deux scripts tiers non vérifiés dans des pages de collecte de données personnelles

| Champ | Valeur |
|---|---|
| **Gravité** | **ÉLEVÉE** |
| **Confiance** | **9 / 10** |
| **Statut** | **Vulnérabilité confirmée** (absence vérifiée sur la totalité des vecteurs de configuration) |
| **Catégorie** | `missing_csp` / `third_party_script_injection` |
| **Priorité de correction** | **P1 — immédiate** |
| **Difficulté** | Moyenne (2 à 4 h, avec test de non-régression sur Google Translate) |

**Fichiers et lignes concernés :**

- `vercel.json:2-23` — bloc `headers`, aucune clé `Content-Security-Policy`
- `netlify.toml:1-7` — bloc `[headers.values]`, aucune clé `Content-Security-Policy`
- `.htaccess:1-13` — bloc `<IfModule mod_headers.c>`, aucun `Header set Content-Security-Policy`
- Les 14 pages HTML — aucune balise `<meta http-equiv="Content-Security-Policy">`
- `index.html:1420` et `index.html:1428` — les deux scripts tiers concernés

**Extrait de code pertinent :**

```json
// vercel.json:5-21 — les quatre en-têtes présents. Pas de CSP.
"headers": [
  { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
  { "key": "X-Frame-Options",           "value": "SAMEORIGIN" },
  { "key": "X-Content-Type-Options",    "value": "nosniff" },
  { "key": "Referrer-Policy",           "value": "strict-origin-when-cross-origin" }
]
```

```html
<!-- index.html:1419-1428 — scripts tiers, sans integrity, sans CSP pour les encadrer -->
<script src="js/cookies-consent.js"></script>
  <script src="https://web3forms.com/client/script.js" async defer></script>
  <script src="js/interactions.js" defer></script>
  <script src="js/form-handler.js" defer></script>
...
<script src="js/gtranslate.js"></script>
<script type="text/javascript"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"></script>
```

**Preuve observée :**

La recherche d'une CSP sur l'ensemble du dépôt, tous vecteurs confondus, ne remonte **rien** :

```
$ grep -rniE "Content-Security-Policy|http-equiv" --include=*.html --include=*.json --include=*.toml --include=.htaccess .
(aucun résultat)
```

En parallèle, `https://translate.google.com/translate_a/element.js` est chargé sur **les 14 pages** (vérifié : `404.html:496`, `aide.html:1164`, `cgu.html:536`, `chauffeur.html:751`, `commercant.html:748`, `confidentialite.html:815`, `contact.html:808`, `cookies.html:534`, `index.html:1428`, `livraison.html:626`, `mentions-legales.html:520`, `nourriture.html:1395`, `telechargement.html:753`), et `https://web3forms.com/client/script.js` sur les 5 pages portant un formulaire (`index.html:1420`, `contact.html:800`, `chauffeur.html:742`, `commercant.html:739`, `404.html:488`). Aucun des deux ne porte d'attribut `integrity`.

**Risque concret :**

Google Translate ne se contente pas de lire la page : il **réécrit intégralement le DOM** pour traduire le contenu. Il détient donc, par conception, un accès en lecture et en écriture total sur chaque page — y compris `contact.html`, `chauffeur.html` et `commercant.html`, qui collectent nom, prénom, téléphone, e-mail, ville, type de véhicule et disponibilité. Sans CSP, **rien dans le site ne restreint** :

- `script-src` — le script tiers peut injecter et charger n'importe quel autre script, depuis n'importe quel domaine ;
- `connect-src` — le code injecté peut émettre un `fetch()` vers n'importe quel serveur, donc exfiltrer ;
- `form-action` — l'attribut `action` d'un formulaire peut être réécrit vers un domaine attaquant ;
- `frame-ancestors` — seul `X-Frame-Options: SAMEORIGIN` protège, sans équivalent moderne.

**Scénario d'exploitation :**

1. Un utilisateur ouvre `chauffeur.html` et commence à saisir sa pré-inscription (nom, téléphone, ville).
2. La chaîne de distribution d'un des scripts tiers est compromise — compromission du fournisseur, détournement d'un sous-domaine, ou empoisonnement d'un intermédiaire de cache.
3. Le script servi contient une charge additionnelle qui pose un écouteur `input` sur `document`, ou qui lit `new FormData(document.getElementById('driverForm'))` à intervalle régulier.
4. Chaque frappe est émise vers `https://attaquant.example/collect` par un `fetch()` en `mode: 'no-cors'`. **Aucune directive `connect-src` ne l'empêche.** La requête part sans erreur console, invisible pour l'utilisateur.
5. Variante plus grave : le script réécrit le bouton d'envoi pour poster le formulaire vers un domaine attaquant, tout en affichant le bloc de confirmation `#driver-success`. L'utilisateur croit sa candidature transmise à alfa ; elle est partie chez un tiers.

Le même scénario s'applique à une **injection de contenu via `<mark>`** ou à toute future page dynamique : sans CSP, il n'existe aucune seconde ligne de défense.

**Impact pour l'entreprise et les utilisateurs :**

- **Utilisateurs** : fuite d'identité complète (nom, prénom, téléphone, ville, e-mail) de candidats chauffeurs et commerçants. En Guinée, un numéro de téléphone associé à un nom et une ville est directement exploitable pour de la fraude Mobile Money et de l'ingénierie sociale ciblée.
- **Entreprise** : violation de données au sens du RGPD (les candidats européens ou les traitements opérés depuis l'UE sont concernés), obligation de notification, perte de confiance sur le recrutement de partenaires — qui est la fonction commerciale principale de `chauffeur.html` et `commercant.html`.
- **Aggravant** : sans CSP, il n'existe **aucun rapport de violation** (`report-to`). L'exfiltration serait silencieuse et pourrait durer des mois.

**Correction recommandée :**

Ajouter une CSP explicite sur la plateforme d'hébergement effectivement utilisée. Google Translate exige malheureusement `'unsafe-inline'` pour les styles et injecte du script dynamique ; la politique ci-dessous est le meilleur compromis réaliste **testable**. La directive décisive est **`connect-src`**, qui bloque l'exfiltration même si un script tiers est compromis.

**Exemple de code corrigé — NON APPLIQUÉ :**

```json
// vercel.json — à ajouter dans le tableau "headers" (proposition, non appliquée)
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://web3forms.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://www.gstatic.com https://fonts.googleapis.com; img-src 'self' data: https://translate.googleapis.com https://www.gstatic.com https://*.gstatic.com; font-src 'self'; connect-src 'self' https://api.web3forms.com https://translate.googleapis.com https://*.hcaptcha.com; frame-src https://*.hcaptcha.com https://translate.google.com; form-action 'self' https://api.web3forms.com; frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests"
}
```

```toml
# netlify.toml — équivalent (proposition, non appliquée)
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://web3forms.com https://*.hcaptcha.com; connect-src 'self' https://api.web3forms.com https://translate.googleapis.com https://*.hcaptcha.com; form-action 'self' https://api.web3forms.com; frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
```

> **Méthode de déploiement recommandée** : publier d'abord en `Content-Security-Policy-Report-Only` pendant 7 à 14 jours, collecter les violations, puis basculer en mode bloquant. Une CSP posée sans phase d'observation cassera très probablement Google Translate.

> **Sur l'attribut `integrity` (SRI)** : il **ne peut pas** être appliqué à ces deux scripts. Google et Web3Forms modifient leurs fichiers sans versionnement, un hash figé casserait le site au premier déploiement amont. La CSP est donc le seul contrôle applicable ici — c'est précisément ce qui rend son absence sérieuse.

---

### SEC-002 — Clé Web3Forms et champs `subject` / `from_name` entièrement pilotables par le client : usurpation de l'identité du site dans les e-mails internes et contournement du hCaptcha

| Champ | Valeur |
|---|---|
| **Gravité** | **ÉLEVÉE** |
| **Confiance** | **9 / 10** pour l'exposition et la falsification de contenu ; **7 / 10** pour le contournement complet du captcha (dépend d'un réglage du tableau de bord Web3Forms, non vérifiable en lecture seule) |
| **Statut** | **Exposition confirmée** ; **efficacité du contournement du captcha : suspicion à vérifier** |
| **Catégorie** | `client_controlled_parameters` / `captcha_bypass` / `email_content_spoofing` |
| **Priorité de correction** | **P1 — immédiate** |
| **Difficulté** | Faible côté tableau de bord (30 min) ; Moyenne si un relais serveur est retenu (1 à 2 j) |

**Fichiers et lignes concernés :**

| Fichier | Lignes | Formulaire |
|---|---|---|
| `index.html` | 749-760 | `#notifyForm` — alerte de zone |
| `contact.html` | 409-421 | `#contactForm` — contact général |
| `chauffeur.html` | 306-318 | `#driverForm` — pré-inscription chauffeur |
| `commercant.html` | 286-298 | pré-inscription commerçant |
| `js/form-handler.js` | 20-28, 97-105 | garde-fou captcha et envoi |

**Extrait de code pertinent :**

```html
<!-- contact.html:409-421 — les trois champs cachés sont dans le HTML servi au public -->
<form id="contactForm" data-alfa-form data-succes="contact-success">
  <!-- Clé d'accès Web3Forms -->
  <input type="hidden" name="access_key" value="003e9773-…-…-…-…cf9b" />
  <input type="hidden" name="subject"
         value="Nouveau message depuis le site Alfa (Contact)" />
  <input type="hidden" name="from_name" value="Alfa Website" />
```

```javascript
// js/form-handler.js:20-28 — le garde-fou captcha est purement côté navigateur
const jetonCaptcha = form.querySelector('[name="h-captcha-response"]');
if (form.querySelector('.h-captcha') && jetonCaptcha && !jetonCaptcha.value) {
  alert("Veuillez valider le contrôle anti-robot avant d'envoyer.");
  return;
}
```

```javascript
// js/form-handler.js:97-105 — l'envoi va directement à l'API publique
const formData = new FormData(form);
const r = await fetch("https://api.web3forms.com/submit", {
  method: "POST",
  headers: { Accept: "application/json" },
  body: formData,
});
```

**Preuve observée :**

La même clé d'accès unique est réutilisée par les quatre formulaires du site :

```
$ grep -rn 'value="[0-9a-f]{8}-[0-9a-f]{4}-…"' --include=*.html .
commercant.html:291:  value="003e9773-…cf9b"
contact.html:414:     value="003e9773-…cf9b"
chauffeur.html:311:   value="003e9773-…cf9b"
index.html:753:       value="003e9773-…cf9b"
```

Elle est présente **depuis le tout premier commit** et n'a jamais été rotée :

```
$ git log --all -S"003e9773" --oneline
d61b467 Premier commit : Ajout du site complet alfa avec multilinguisme et SEO
17ad0e7 Premier commit : Ajout du site complet alfa avec multilinguisme et SEO
```

Le garde-fou hCaptcha de `js/form-handler.js:25` porte trois conditions cumulatives (`form.querySelector('.h-captcha')` **et** `jetonCaptcha` **et** `!jetonCaptcha.value`). Il ne s'exécute que dans le navigateur, dans le gestionnaire `submit`. Une requête HTTP forgée hors navigateur ne traverse jamais ce code.

**Risque concret :**

Ce constat n'est **pas** « une clé secrète a fuité ». La clé Web3Forms est **publique par conception** : c'est un identifiant de destination, elle ne donne accès ni au tableau de bord, ni à l'historique des soumissions, ni à quoi que ce soit d'autre. Signaler cela comme un secret exposé serait un faux positif. Le risque réel est différent et bien plus concret :

**tout le contenu de l'e-mail reçu par alfa est fourni par le client, y compris son sujet et son expéditeur affiché.** Un attaquant peut composer, depuis n'importe où, un e-mail arbitraire qui arrivera dans la boîte de contact d'alfa **avec l'apparence d'une soumission légitime du site officiel**.

**Scénario d'exploitation :**

```bash
# Depuis n'importe quelle machine, sans navigateur, sans jeton hCaptcha :
curl -X POST https://api.web3forms.com/submit \
  -H "Content-Type: application/json" \
  -d '{
        "access_key": "003e9773-…cf9b",
        "subject":   "URGENT — Validation administrateur requise (Direction alfa)",
        "from_name": "Service Informatique alfa",
        "replyto":   "it-support@alfa-securite.example",
        "message":   "Votre compte partenaire expire. Confirmez vos identifiants ici : https://…"
      }'
```

1. L'e-mail arrive dans la boîte de contact d'alfa. Le champ « De » affiche **« Service Informatique alfa »** — valeur choisie par l'attaquant via `from_name`.
2. Le sujet, choisi par l'attaquant, imite une communication interne urgente.
3. Un membre de l'équipe alfa qui traite les messages de contact reçoit ce qui ressemble à une notification interne provenant du site officiel de l'entreprise. C'est **du phishing interne avec usurpation d'identité de la marque**, livré par un canal de confiance.
4. Le champ `replyto` détourne toute réponse vers l'attaquant.
5. En volume, le même appel adressé en boucle sature la boîte de contact et **noie les vraies candidatures chauffeurs et commerçants** — les pré-inscriptions légitimes deviennent indiscernables du bruit.

Le hCaptcha visible sur le site n'intervient à aucun moment dans ce scénario : il n'est évalué que par `js/form-handler.js`, dans le navigateur. Sa mise en application côté serveur dépend d'une case « Require Captcha » dans le tableau de bord Web3Forms, **que cet audit ne peut pas vérifier en lecture seule**. Si elle n'est pas cochée, le contournement est total.

**Impact pour l'entreprise et les utilisateurs :**

- **Entreprise** : usurpation de la marque alfa dans sa propre boîte de réception ; risque de compromission d'un compte interne si un collaborateur suit le lien. Perte de candidatures partenaires réelles noyées dans le bruit — perte commerciale directe.
- **Utilisateurs** : les candidats chauffeurs et commerçants dont la pré-inscription est perdue dans la masse ne sont jamais rappelés.
- **Aggravant** : une seule clé pour les quatre formulaires signifie qu'en cas de rotation, les quatre formulaires doivent être modifiés simultanément, et qu'il est impossible de couper un seul canal abusé sans couper les autres.

**Correction recommandée :**

Par ordre d'efficacité :

1. **Immédiat, tableau de bord Web3Forms** — activer **« Require Captcha »** (mise en application côté serveur du jeton hCaptcha) et **restreindre les domaines autorisés** à `alfa.com.gn` et `www.alfa.com.gn`. Ces deux réglages, à eux seuls, ferment le scénario `curl` ci-dessus. Aucune modification de code n'est nécessaire.
2. **Immédiat, code** — figer `subject` et `from_name` **côté Web3Forms** plutôt que dans le HTML, ou à défaut ajouter un champ « honeypot » `botcheck`, reconnu nativement par Web3Forms.
3. **Recommandé** — utiliser **une clé d'accès distincte par formulaire**, afin d'isoler et de révoquer un canal abusé sans casser les trois autres.
4. **Robuste (moyen terme)** — interposer une fonction serverless (Vercel Function / Netlify Function) qui détient la clé en variable d'environnement, vérifie le jeton hCaptcha auprès de `https://api.hcaptcha.com/siteverify`, impose les limites de longueur, puis relaie vers Web3Forms. La clé disparaît alors totalement du navigateur.

**Exemple de code corrigé — NON APPLIQUÉ :**

```html
<!-- Proposition : champ honeypot Web3Forms + suppression du sujet piloté par le client -->
<form id="contactForm" data-alfa-form data-succes="contact-success">
  <input type="hidden" name="access_key" value="CLE_DEDIEE_AU_FORMULAIRE_CONTACT" />
  <!-- "subject" et "from_name" sont désormais définis dans le tableau de bord Web3Forms -->
  <input type="checkbox" name="botcheck" class="hidden" style="display:none" tabindex="-1" />
```

```javascript
// Proposition : relais serverless — api/contact.js (Vercel). NON APPLIQUÉ.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { "h-captcha-response": captcha, prenom, nom, email, message } = req.body ?? {};

  // 1. Vérification serveur du captcha — non contournable depuis le client
  const verif = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: process.env.HCAPTCHA_SECRET, response: captcha ?? "" }),
  }).then((r) => r.json());
  if (!verif.success) return res.status(403).json({ error: "Captcha invalide" });

  // 2. Validation et bornage serveur des longueurs
  const borne = (v, n) => String(v ?? "").slice(0, n);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(email))) {
    return res.status(400).json({ error: "E-mail invalide" });
  }

  // 3. Relais avec sujet et expéditeur imposés côté serveur
  const r = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: process.env.WEB3FORMS_KEY,     // jamais exposée au navigateur
      subject:   "Nouveau message depuis le site Alfa (Contact)",  // valeur en dur, serveur
      from_name: "Alfa Website",                                   // valeur en dur, serveur
      prenom:  borne(prenom, 80),
      nom:     borne(nom, 80),
      email:   borne(email, 160),
      message: borne(message, 4000),
    }),
  });
  return res.status(r.ok ? 200 : 502).json(await r.json());
}
```

---

## 6. VULNÉRABILITÉS MOYENNES

### SEC-003 — Google Translate chargé avant tout consentement et absent de la liste des sous-traitants de la politique de confidentialité

| Champ | Valeur |
|---|---|
| **Gravité** | **MOYENNE** |
| **Confiance** | **9 / 10** |
| **Statut** | **Vulnérabilité confirmée** (double manquement : chargement inconditionnel + non-déclaration) |
| **Catégorie** | `privacy_consent_violation` / `undisclosed_data_transfer` |
| **Priorité de correction** | **P2** |
| **Difficulté** | Moyenne (4 à 6 h : le sélecteur de langue doit devenir conditionnel sans casser l'UX) |

**Fichiers et lignes concernés :**

- Les 14 pages HTML, balise de script tierce chargée en dur : `index.html:1428`, `contact.html:808`, `chauffeur.html:751`, `commercant.html:748`, `aide.html:1164`, `cgu.html:536`, `confidentialite.html:815`, `cookies.html:534`, `livraison.html:626`, `mentions-legales.html:520`, `nourriture.html:1395`, `telechargement.html:753`, `404.html:496`
- `js/cookies-consent.js:165-175` — la fonction `applyConsent` ne gère que Analytics et Marketing
- `js/cookies-consent.js:166` — le commentaire reconnaît explicitement le chargement statique
- `confidentialite.html:423-433` — liste des sous-traitants : Google Translate n'y figure pas
- `cookies.html:212-217` — section « Cookies nécessaires »

**Extrait de code pertinent :**

```javascript
// js/cookies-consent.js:165-175 — Google Translate n'est jamais soumis au consentement
function applyConsent(consent) {
  // Web3Forms and Google Translate are now loaded statically in the HTML

  if (consent.analytics) { loadGoogleAnalytics(); }
  if (consent.marketing) { loadMetaPixel(); }
}
```

```html
<!-- index.html:1428 — chargé sur chaque page, hors de tout contrôle de consentement -->
<script type="text/javascript"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"></script>
```

```html
<!-- confidentialite.html:423-433 — la liste des sous-traitants. Google Translate est absent. -->
<li><strong>Prestataires techniques :</strong> Google Firebase (…) et Google Maps (…)</li>
<li><strong>Traitement des formulaires du site :</strong> Web3Forms (…) et hCaptcha (…)</li>
<li><strong>Prestataire de paiement :</strong> FedaPay, …</li>
```

**Preuve observée :**

Deux faits vérifiés se cumulent.

*Premièrement*, le script Google Translate est présent en dur dans le HTML des 14 pages, hors de tout branchement conditionnel. Le commentaire de `js/cookies-consent.js:166` — *« Google Translate are now loaded statically in the HTML »* — confirme qu'il s'agit d'une décision d'implémentation assumée, et non d'un oubli. Le mécanisme de consentement est par ailleurs correctement construit pour Analytics et Meta Pixel (lignes 168-174), ce qui montre que l'auteur connaît le motif : Google Translate en a simplement été sorti.

*Deuxièmement*, chaque page contient un script inline qui **lit le cookie `googtrans`** avant même le chargement du script tiers :

```javascript
// index.html:70-77 — preuve que le cookie googtrans est bien posé et exploité
if (document.cookie.indexOf('googtrans=') !== -1
    && document.cookie.indexOf('googtrans=/fr/fr') === -1) {
```

*Troisièmement*, `confidentialite.html:423-433` énumère cinq catégories de destinataires (Firebase, Google Maps, Web3Forms, hCaptcha, FedaPay, autorités). **Google Translate n'y apparaît nulle part**, alors qu'il reçoit des données de chaque visiteur de chaque page.

**Risque concret :**

Le chargement de `translate.google.com/translate_a/element.js` transmet à Google, **dès la première milliseconde de la visite et sans consentement** : l'adresse IP du visiteur, l'URL complète de la page, l'en-tête `Referer`, l'`User-Agent`, et — dès qu'une traduction est déclenchée — **le contenu textuel de la page**. Cela dépasse largement la « mémorisation du choix de langue » invoquée par `cookies.html:212-217` pour ranger ce traceur en catégorie « nécessaire ».

Deux manquements distincts en découlent :

1. **Absence de base légale** — un transfert de données personnelles vers un tiers, avant recueil du consentement, pour une fonctionnalité de confort (la traduction) et non de sécurité. La bannière de consentement du site devient inopérante sur son point le plus visible.
2. **Défaut de transparence** — le sous-traitant n'est pas déclaré. Un utilisateur qui lit la politique de confidentialité **ne peut pas savoir** que Google reçoit ses données de navigation, ce qui contrevient à l'obligation d'information.

**Scénario d'exploitation :**

Il n'y a pas ici d'« attaquant » au sens technique : le risque est juridique et réputationnel, et il se matérialise de façon prévisible.

1. Un visiteur ouvre `confidentialite.html`, lit la liste des destinataires et **refuse** tous les cookies non essentiels via la bannière.
2. Le script Google Translate a déjà été chargé et son cookie `googtrans` déjà posé — le refus n'a aucun effet dessus.
3. Ce visiteur, ou une autorité de contrôle, compare la politique affichée aux requêtes réelles observées dans l'onglet Réseau du navigateur. L'écart est immédiat et **trivialement démontrable par capture d'écran**.
4. La plainte s'appuie sur deux manquements documentés : traitement sans base légale, et information inexacte sur les destinataires.

**Impact pour l'entreprise et les utilisateurs :**

- **Entreprise** : exposition à une mise en demeure et à une sanction administrative sur le fondement des articles 6, 13 et 28 du RGPD, pour les visiteurs européens et pour tout traitement opéré depuis l'UE. Le préjudice réputationnel est amplifié par le fait que le site **affiche une bannière de consentement**, ce qui rend le manquement délibéré en apparence.
- **Utilisateurs** : profilage de navigation par Google, sans possibilité de refus effectif ni même de connaissance du traitement.

**Correction recommandée :**

Deux corrections indépendantes, à mener toutes les deux :

1. **Technique** — soumettre Google Translate au consentement, en le chargeant à la demande. La solution la plus propre pour un site vitrine de 14 pages est de **retirer entièrement Google Translate** au profit de versions statiques traduites (`/en/`, `/zh/`), ce qui supprime le transfert, améliore le SEO multilingue et accélère le chargement.
2. **Juridique** — ajouter Google Translate à la liste des sous-traitants de `confidentialite.html:423-433` et le déplacer de « nécessaires » vers une catégorie soumise à consentement dans `cookies.html`.

**Exemple de code corrigé — NON APPLIQUÉ :**

```javascript
// js/cookies-consent.js — proposition : chargement conditionnel. NON APPLIQUÉ.
function applyConsent(consent) {
  if (consent.analytics)  { loadGoogleAnalytics(); }
  if (consent.marketing)  { loadMetaPixel(); }
  if (consent.preferences) { loadGoogleTranslate(); }   // nouvelle catégorie « préférences »
}

function loadGoogleTranslate() {
  if (document.getElementById("alfa-gtranslate")) return;
  const s = document.createElement("script");
  s.id  = "alfa-gtranslate";
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2";
  document.head.appendChild(s);
}
```

```html
<!-- Proposition : retirer la balise en dur des 14 pages, et masquer le sélecteur
     de langue tant que le consentement « préférences » n'est pas accordé. NON APPLIQUÉ. -->
<div class="lang-switcher" data-requires-consent="preferences" hidden>…</div>
```

```html
<!-- confidentialite.html — proposition d'ajout à la liste des sous-traitants. NON APPLIQUÉ. -->
<li>
  <strong>Traduction du site :</strong> Google Translate (Google LLC). Lorsque vous
  activez la traduction, l'adresse IP, l'URL de la page consultée et le contenu
  textuel de celle-ci sont transmis à Google aux fins de traduction automatique.
</li>
```

---

### SEC-004 — Le retrait du consentement ne décharge pas les traceurs déjà actifs

| Champ | Valeur |
|---|---|
| **Gravité** | **MOYENNE** |
| **Confiance** | **8 / 10** |
| **Statut** | **Vulnérabilité confirmée** (par lecture du flux de contrôle) |
| **Catégorie** | `ineffective_consent_withdrawal` |
| **Priorité de correction** | **P2** |
| **Difficulté** | Faible (2 h) |

**Fichier et lignes concernés :** `js/cookies-consent.js:115-137` et `165-262`

**Extrait de code pertinent :**

```javascript
// js/cookies-consent.js:115-137 — le retrait enregistre le refus… puis rappelle applyConsent
function saveAndApplyConsent(preferences) {
  const consent = {
    version: CONSENT_VERSION, necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    savedAt: new Date().toISOString()
  };
  try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent)); }
  catch (error) { console.error("Impossible d'enregistrer le consentement :", error); }
  applyConsent(consent);          // ← ne fait QUE charger. Ne décharge jamais.
}

// js/cookies-consent.js:165-175
function applyConsent(consent) {
  if (consent.analytics) { loadGoogleAnalytics(); }   // pas de branche "else → unload"
  if (consent.marketing) { loadMetaPixel(); }
}
```

**Preuve observée :**

`applyConsent` ne contient que deux conditions positives. Il n'existe **aucune** branche `else`, aucun appel de suppression de script, aucun nettoyage de `window.dataLayer`, `window.gtag`, `window.fbq` ou `window._fbq`, et aucune suppression de cookies `_ga*` / `_fbp`. Les garde-fous d'idempotence de `loadGoogleAnalytics` (ligne 190 : `if (document.getElementById("alfa-google-analytics")) return;`) et de `loadMetaPixel` (ligne 228 : `if (window.fbq) return;`) confirment le raisonnement : le code est conçu pour **ne charger qu'une fois**, et jamais pour décharger.

**Risque concret :**

Le parcours « Accepter tout » → « Gérer mes cookies » → « Tout refuser » se déroule sans rechargement de page (`closeAllWindows()` masque simplement la bannière, lignes 109-112). Après cette séquence :

- `localStorage` enregistre correctement `analytics: false, marketing: false` ;
- l'interface affiche le refus ;
- **mais** `<script id="alfa-google-analytics">` reste dans le `<head>`, `window.gtag` reste défini, `window.fbq` reste défini et sa file reste active. Google Analytics et Meta Pixel **continuent d'émettre** pour toute la durée de la session.

Le droit de retrait est donc affiché comme exercé, alors qu'il ne l'est pas.

**Portée actuelle atténuée** : `GOOGLE_ANALYTICS_ID` vaut `"G-XXXXXXXXXX"` (ligne 10) et `META_PIXEL_ID` vaut `"123456789012345"` (ligne 11) — des valeurs de remplissage. Les deux fonctions sortent immédiatement (lignes 180-188 et 218-226). **Aujourd'hui, aucune donnée ne part réellement.** Ce défaut se déclenchera silencieusement le jour où les identifiants réels seront renseignés — c'est-à-dire au moment où plus personne ne relira ce code. C'est pour cette raison qu'il est classé MOYENNE et non informationnel.

**Scénario d'exploitation :**

1. L'équipe alfa crée ses comptes Google Analytics et Meta, et renseigne les vrais identifiants aux lignes 10-11 de `js/cookies-consent.js`.
2. Un visiteur accepte tout, puis se ravise et refuse tout via « Gérer mes cookies ».
3. GA et Meta Pixel continuent d'envoyer des événements pour toute la session — pages vues, parcours, identifiant `_fbp`.
4. Le visiteur, qui a la preuve visuelle de son refus, constate dans l'onglet Réseau que les requêtes vers `googletagmanager.com` et `facebook.net` se poursuivent.

**Impact pour l'entreprise et les utilisateurs :**

- **Entreprise** : manquement au droit de retrait (article 7.3 du RGPD), particulièrement sévèrement apprécié car le site **prétend** offrir ce contrôle.
- **Utilisateurs** : leurs choix de confidentialité ne sont pas honorés dans la session en cours.

**Correction recommandée :**

Deux options. La plus simple est de forcer un rechargement de page après tout retrait — grossier mais totalement efficace. La plus propre est d'implémenter le déchargement explicite, complété par le `Consent Mode v2` de Google.

**Exemple de code corrigé — NON APPLIQUÉ :**

```javascript
// js/cookies-consent.js — proposition. NON APPLIQUÉ.
function saveAndApplyConsent(preferences) {
  const ancien  = readConsent();
  const consent = { /* … identique … */ };
  try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent)); }
  catch (error) { console.error("Impossible d'enregistrer le consentement :", error); }

  // Tout retrait par rapport à l'état précédent exige un état propre.
  const retrait = (ancien?.analytics && !consent.analytics)
               || (ancien?.marketing && !consent.marketing);

  if (retrait) {
    purgerTraceurs();
    window.location.reload();   // garantie forte : plus aucun script tiers en mémoire
    return;
  }
  applyConsent(consent);
}

function purgerTraceurs() {
  document.getElementById("alfa-google-analytics")?.remove();
  ["_ga", "_gid", "_gat", "_fbp", "_fbc"].forEach((nom) => {
    document.cookie =
      `${nom}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, "")}; Secure; SameSite=Lax`;
  });
  delete window.gtag; delete window.dataLayer;
  delete window.fbq;  delete window._fbq;
}
```

---

## 7. VULNÉRABILITÉS FAIBLES

### SEC-005 — Aucune limite de longueur sur aucun champ de formulaire du site

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** |
| **Confiance** | **9 / 10** pour l'absence ; **6 / 10** pour un impact au-delà de la nuisance |
| **Statut** | **Absence confirmée ; impact aggravé = suspicion à vérifier** |
| **Catégorie** | `missing_input_constraints` |
| **Priorité** | **P3** — Difficulté : Très faible (30 min) |

**Fichiers concernés :** `index.html:763`, `contact.html:425-478`, `chauffeur.html:322-365`, `commercant.html` (bloc de formulaire)

**Preuve observée :**

```
$ grep -rniE "maxlength|pattern=" --include=*.html .
(aucun résultat — sur les 14 pages et les ~20 champs de saisie)
```

Aucun champ, sur aucun des quatre formulaires, ne porte `maxlength` ni `pattern`. La seule validation applicative est le contrôle de casse des e-mails de `js/form-handler.js:42-74`, purement côté navigateur, et trivialement supprimable via les outils de développement.

**Risque concret et honnêteté du constat :** je ne peux pas démontrer une injection HTML dans les e-mails de notification Web3Forms, car le rendu de ces e-mails est opéré par un tiers dont le comportement d'échappement n'est pas observable depuis ce dépôt. Le risque **confirmé** est donc limité : n'importe qui peut soumettre des champs de plusieurs mégaoctets, rendant les notifications illisibles et pouvant faire échouer la remise. Le risque **suspecté** — injection HTML dans le corps de l'e-mail si Web3Forms n'échappe pas — reste à vérifier par un test contrôlé sur un formulaire de test. Le classement en FAIBLE reflète cette incertitude assumée, et non un impact démontré.

**Correction recommandée — NON APPLIQUÉE :**

```html
<!-- Proposition : bornage déclaratif de chaque champ -->
<input type="text"  id="prenom"    name="prenom"    maxlength="80"  required
       pattern="[A-Za-zÀ-ÿ' \-]{2,80}" class="form-control" />
<input type="email" id="email"     name="email"     maxlength="160" required class="form-control" />
<input type="tel"   id="telephone" name="telephone" maxlength="20"
       pattern="[0-9+ ]{8,20}" required class="form-control" />
<textarea id="message" name="message" maxlength="4000" rows="5" required class="form-control"></textarea>
```

> Rappel : `maxlength` et `pattern` améliorent l'expérience utilisateur mais **ne constituent pas un contrôle de sécurité** — ils sont contournables. Le bornage réellement contraignant doit être posé côté serveur (voir le relais serverless de SEC-002).

---

### SEC-006 — En-têtes de sécurité modernes absents : Permissions-Policy, COOP, CORP

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** (durcissement, défense en profondeur) |
| **Confiance** | **10 / 10** pour l'absence |
| **Statut** | **Absence confirmée** — aucune exploitation directe |
| **Catégorie** | `missing_security_headers` |
| **Priorité** | **P3** — Difficulté : Très faible (30 min) |

**Fichiers concernés :** `vercel.json:5-21`, `netlify.toml:3-7`, `.htaccess:1-13`

**Preuve observée** — bilan complet des en-têtes, vérifié sur les trois configurations :

| En-tête | vercel.json | netlify.toml | .htaccess | Verdict |
|---|---|---|---|---|
| `Strict-Transport-Security` | ✅ L7-9 | ✅ L4 | ✅ L3 | **Correct** — 1 an, includeSubDomains, preload |
| `X-Frame-Options` | ✅ L10-13 | ✅ L5 | ✅ L6 | **Correct** — SAMEORIGIN |
| `X-Content-Type-Options` | ✅ L14-17 | ✅ L6 | ✅ L9 | **Correct** — nosniff |
| `Referrer-Policy` | ✅ L18-21 | ✅ L7 | ✅ L12 | **Correct** — strict-origin-when-cross-origin |
| `Content-Security-Policy` | ❌ | ❌ | ❌ | **Voir SEC-001 (ÉLEVÉE)** |
| `Permissions-Policy` | ❌ | ❌ | ❌ | Absent |
| `Cross-Origin-Opener-Policy` | ❌ | ❌ | ❌ | Absent |
| `Cross-Origin-Resource-Policy` | ❌ | ❌ | ❌ | Absent |
| `Cross-Origin-Embedder-Policy` | ❌ | ❌ | ❌ | Absent — **et non souhaitable ici** |

**Risque concret :** aucune exploitation directe. `Permissions-Policy` réduirait la capacité d'un script tiers compromis (voir SEC-001) à solliciter la géolocalisation, la caméra ou le microphone — ce qui a une valeur réelle pour un site de transport, où une demande de géolocalisation ne paraîtrait pas suspecte à l'utilisateur. `COOP` isolerait le contexte de navigation.

`Cross-Origin-Embedder-Policy: require-corp` **ne doit pas** être ajouté : il casserait Google Translate et hCaptcha, qui n'émettent pas les en-têtes CORP requis. Le signaler comme manquant serait un faux positif.

**Correction recommandée — NON APPLIQUÉE :**

```json
// vercel.json — ajouts proposés au tableau "headers"
{ "key": "Permissions-Policy",
  "value": "geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), accelerometer=()" },
{ "key": "Cross-Origin-Opener-Policy",   "value": "same-origin-allow-popups" },
{ "key": "Cross-Origin-Resource-Policy", "value": "same-site" }
```

> `same-origin-allow-popups` et non `same-origin` : les liens sociaux `target="_blank"` (`index.html:1231`, `index.html:1250`, etc.) ouvrent des fenêtres. `same-origin` strict est plus sûr mais doit être testé sur ces liens.

---

### SEC-007 — `test.html` déployé en production, indexable par les moteurs de recherche

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** |
| **Confiance** | **9 / 10** |
| **Statut** | **Vulnérabilité confirmée** (exposition d'artefact de développement) |
| **Catégorie** | `debug_artifact_exposure` |
| **Priorité** | **P3** — Difficulté : Triviale (suppression du fichier) |

**Fichier concerné :** `test.html` (14 lignes, suivi par Git, à la racine du dépôt)

**Extrait de code pertinent — contenu intégral du fichier :**

```html
<!DOCTYPE html>
<html>
<body>
    <a href="#main-content" class="sr-only">Aller au contenu principal</a>
<span id="myspan" onclick="myFunc(event)">Click me</span>
<script>
function myFunc(event) {
  console.log("target:", event.target.tagName);
  console.log("currentTarget:", event.currentTarget ? event.currentTarget.tagName : "null");
  console.log("target === currentTarget:", event.target === event.currentTarget);
}
</script>
</body>
</html>
```

**Preuve observée :** le fichier est suivi par Git, donc déployé par tout pipeline basé sur le dépôt. `robots.txt` autorise tout (`Allow: /`), aucune balise `noindex` n'est présente, et aucune des trois configurations de plateforme ne le bloque. Il est absent de `sitemap.xml`, ce qui limite mais n'empêche pas son indexation.

**Risque concret :** aucune donnée sensible, aucun secret, aucun code exploitable. Le fichier est sans `<!DOCTYPE>` conforme, sans `charset`, sans `lang`, sans CSS. Le risque est **réputationnel et informationnel** : un attaquant qui découvre `alfa.com.gn/test.html` en déduit que les artefacts de développement ne sont pas filtrés avant publication, et étend sa reconnaissance sur des chemins voisins (`/debug.html`, `/dist/`, `/tools/`, `/backup/`). Un moteur de recherche qui l'indexe l'affiche comme page officielle du domaine.

**Correction recommandée :** supprimer `test.html` du dépôt. Ajouter un motif de garde dans `.gitignore` (`test*.html`, `debug*.html`, `tmp*.html`) pour éviter la récidive.

---

### SEC-008 — `tools/seo_update.js` publiquement servi sur Netlify et Vercel : protection écrite pour le mauvais chemin

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** |
| **Confiance** | **8 / 10** |
| **Statut** | **Défaut de configuration confirmé** ; contenu vérifié comme non sensible |
| **Catégorie** | `source_code_exposure` / `path_mismatch` |
| **Priorité** | **P3** — Difficulté : Triviale (correction du chemin) |

**Fichiers concernés :** `vercel.json:31-35`, `netlify.toml:14-17`, `.htaccess:17-19`, `tools/seo_update.js`

**Extrait de code pertinent :**

```json
// vercel.json:31-35 — la règle protège "/seo_update.js" à la racine…
{ "source": "/seo_update.js", "destination": "/404.html", "permanent": false }
```

```toml
# netlify.toml:14-17 — même chemin, même problème
[[redirects]]
  from = "/seo_update.js"
  to   = "/404.html"
  status = 404
```

```apache
# .htaccess:17-19 — ici la protection FONCTIONNE : FilesMatch cible le nom de base
<FilesMatch "^(seo_update\.js|\.gitignore|fix\.js|download_fonts\.js|fix_links\.js)$">
  Require all denied
</FilesMatch>
```

**Preuve observée :** le fichier réside en `tools/seo_update.js`, et non à la racine.

```
$ ls tools/
seo_update.js
```

Les règles Vercel et Netlify visent le chemin exact `/seo_update.js`, qui **n'existe pas**. Le chemin réellement servi, `/tools/seo_update.js`, n'est couvert par aucune des deux. La directive Apache `<FilesMatch>`, elle, s'applique au **nom de base** du fichier quel que soit le répertoire : elle protège donc correctement — d'où l'asymétrie. Par ailleurs, `.htaccess:17` protège `fix.js`, `download_fonts.js` et `fix_links.js`, trois fichiers **qui n'existent plus** dans le dépôt : la liste n'a pas été maintenue.

**Risque concret :** j'ai relu `tools/seo_update.js` intégralement (125 lignes). Il ne contient **aucun secret** : uniquement des titres, descriptions SEO et le domaine public `https://www.alfa.com.gn`. Il écrit dans `dist/` et non sur les sources (lignes 77-107), ce qui est un bon choix. Le risque est donc limité à de la reconnaissance : un attaquant lit la structure du pipeline de build, l'inventaire des 12 pages et la convention `dist/`, ce qui affine ses tentatives sur `/dist/`. Le fait que la protection ait été *tentée* et manque sa cible est le vrai signal : les autres règles de la même famille méritent une revérification.

**Correction recommandée — NON APPLIQUÉE :**

```json
// vercel.json — proposition : viser le vrai chemin, et couvrir le répertoire entier
"redirects": [
  { "source": "/.git/(.*)",   "destination": "/404.html", "permanent": false },
  { "source": "/tools/(.*)",  "destination": "/404.html", "permanent": false },
  { "source": "/dist/(.*)",   "destination": "/404.html", "permanent": false }
]
```

```toml
# netlify.toml — proposition
[[redirects]]
  from = "/tools/*"
  to   = "/404.html"
  status = 404
```

> Meilleure approche encore : **exclure `tools/` de l'artefact publié** via `.vercelignore` / la clé `ignore` de Netlify, plutôt que de le publier puis d'en interdire l'accès. Ce qui n'est pas déployé ne peut pas fuir.

---

### SEC-009 — `.htaccess` : indexation de répertoires non désactivée, redirection HTTP → HTTPS absente

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** |
| **Confiance** | **8 / 10** (conditionné au déploiement effectif sur Apache) |
| **Statut** | **Absence confirmée** dans le fichier ; **impact conditionnel** |
| **Catégorie** | `directory_listing` / `missing_tls_redirect` |
| **Priorité** | **P3** — Difficulté : Triviale (15 min) |

**Fichier concerné :** `.htaccess` (20 lignes, intégralement relu)

**Preuve observée :** le fichier contient un bloc `<IfModule mod_headers.c>` (4 en-têtes), un `RedirectMatch 404 /\.git`, et un `<FilesMatch>`. Il ne contient **ni** `Options -Indexes`, **ni** de bloc `mod_rewrite` forçant HTTPS.

**Risque concret et conditionnalité :** si le site est servi par Apache **et** que `Options +Indexes` est actif dans la configuration parente, alors `alfa.com.gn/assets/images/` renvoie la liste complète des ~284 images, y compris les 142 fichiers `temp_*.webp` — des artefacts de traitement d'image qui révèlent le pipeline de production. Sur l'absence de redirection HTTPS : `Strict-Transport-Security` est bien émis (ligne 3), mais **HSTS ne protège pas la toute première visite** d'un navigateur qui n'a jamais vu le domaine. Une requête initiale en clair reste interceptable.

Si le site est en réalité déployé sur Vercel ou Netlify, ce constat est **sans objet** : ces plateformes ne lisent pas `.htaccess`, ne pratiquent pas l'indexation de répertoires et forcent HTTPS d'office. La conditionnalité est intégrée à la note de confiance.

**Correction recommandée — NON APPLIQUÉE :**

```apache
# .htaccess — ajouts proposés
Options -Indexes

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

> À traiter en même temps que SEC-012 : il faut d'abord déterminer **quelle** plateforme sert réellement le site.

---

### SEC-010 — `puppeteer` et `sharp` déclarés en dépendances de production

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** |
| **Confiance** | **9 / 10** pour le constat ; **5 / 10** pour un impact sécurité réel |
| **Statut** | **Défaut de configuration confirmé** ; risque supply-chain théorique |
| **Catégorie** | `dependency_misclassification` / `build_surface` |
| **Priorité** | **P4** — Difficulté : Triviale (15 min) |

**Fichier concerné :** `package.json:21-25`

**Extrait de code pertinent :**

```json
// package.json:4-5 et 21-25
"main": "download_fonts.js",     // ← ce fichier n'existe plus dans le dépôt
"dependencies": {
  "image-size": "^2.0.2",
  "puppeteer":  "^25.4.0",       // ← outil de build, pas une dépendance d'exécution
  "sharp":      "^0.35.3"        // ← idem
}
```

**Preuve observée :** aucun des trois paquets n'est référencé par le moindre fichier JavaScript servi au navigateur. `tools/seo_update.js` n'utilise que les modules natifs `fs` et `path` (lignes 1-2). Le site est **statique** : aucune de ces dépendances n'est nécessaire à l'exécution en production. `package.json:5` déclare par ailleurs un point d'entrée `download_fonts.js` qui n'existe plus.

**Risque concret :** `npm audit` remonte **0 vulnérabilité** sur les 60 paquets de l'arbre résolu — il n'y a donc aucune CVE à corriger aujourd'hui. Le risque est structurel : si la plateforme d'hébergement exécute `npm install` à chaque build, elle installe `puppeteer`, dont le script post-installation **télécharge un binaire Chromium** depuis un serveur externe. Cela élargit inutilement la surface de la chaîne d'approvisionnement de build, allonge les déploiements et multiplie les paquets transitifs à surveiller, pour un bénéfice nul en production.

Le nom des trois paquets est correctement orthographié et chacun correspond au paquet légitime attendu : **aucun indice de typosquatting**.

**Correction recommandée — NON APPLIQUÉE :**

```json
// package.json — proposition
{
  "name": "alfa_website",
  "version": "1.0.0",
  "private": true,
  "main": "tools/seo_update.js",
  "scripts": { "seo": "node tools/seo_update.js" },
  "devDependencies": {
    "image-size": "^2.0.2",
    "puppeteer":  "^25.4.0",
    "sharp":      "^0.35.3"
  }
}
```

> `"private": true` empêche une publication accidentelle sur le registre npm public. Le passage en `devDependencies` permet à la plateforme de bâtir avec `npm ci --omit=dev`, ce qui supprime le téléchargement de Chromium.

---

### SEC-011 — Trois configurations de plateforme coexistent avec des protections divergentes

| Champ | Valeur |
|---|---|
| **Gravité** | **FAIBLE** |
| **Confiance** | **10 / 10** pour la divergence |
| **Statut** | **Divergence confirmée** |
| **Catégorie** | `configuration_drift` |
| **Priorité** | **P3** — Difficulté : Faible (1 h) |

**Fichiers concernés :** `vercel.json`, `netlify.toml`, `.htaccess`

**Preuve observée :** les trois fichiers émettent bien **les mêmes quatre en-têtes** avec les mêmes valeurs — ce point est cohérent et à créditer. En revanche, les protections de fichiers divergent :

| Protection | vercel.json | netlify.toml | .htaccess |
|---|---|---|---|
| Blocage de `/.git` | ✅ L26-30 | ✅ L9-13 | ✅ L16 |
| Blocage effectif de `seo_update.js` | ❌ mauvais chemin | ❌ mauvais chemin | ✅ par nom de base |
| Blocage de `.gitignore` | ❌ | ❌ | ✅ L17 |
| Repli 404 générique | ✅ L37-42 | ❌ | ❌ |

**Risque concret :** un site n'est servi que par une seule plateforme. Les deux autres configurations sont du code mort qui donne une **fausse impression de couverture** : une revue rapide de `.htaccess` conclut que `.gitignore` est protégé, alors qu'un déploiement Vercel le sert publiquement. Ce constat est la cause racine de SEC-008.

**Correction recommandée :** identifier la plateforme réellement utilisée, supprimer les deux configurations mortes du dépôt, puis consolider la totalité des protections — CSP incluse — dans le fichier survivant.

---

## 8. OBSERVATIONS INFORMATIONNELLES

### INFO-01 — `aide.html` : surbrillance de recherche via `innerHTML` — **analysé, NON vulnérable à l'XSS**

**Fichier :** `aide.html:911-980`

Ce point mérite d'être documenté précisément, car il présente **toutes les apparences** d'une XSS DOM et n'en est pas une. Un scanner automatique le signalerait comme critique. La vérification manuelle établit le contraire.

```javascript
// aide.html:925-940
searchInput.addEventListener("input", function (e) {
  const term = e.target.value.trim();
  const escapeRegExp = (chaine) => chaine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlightText = (text, search) => {
    if (!search) return text;
    let regex;
    try { regex = new RegExp(`(${escapeRegExp(search)})`, "gi"); }
    catch { return text; }
    return text.replace(regex, "<mark>$1</mark>");   // ← analysé en détail
  };
  …
  item.card.querySelector("h3").innerHTML = highlightText(item.h3, term);
```

**Pourquoi ce n'est pas une XSS**, en trois points vérifiés :

1. **La chaîne de remplacement est un littéral.** `"<mark>$1</mark>"` ne contient jamais `term`. Le seul contenu dynamique inséré est `$1`, le groupe capturé.
2. **`$1` provient d'une source de confiance.** Le groupe capturé est une sous-chaîne de `text`, et `text` vaut `item.h3` / `item.p` — capturés aux lignes 921-922 depuis le HTML **statique** de la page, avant toute interaction. La saisie de l'utilisateur ne fait que *sélectionner* quelle portion du texte de confiance est encadrée ; elle n'est jamais elle-même écrite dans le DOM.
3. **Seules deux balises inertes sont introduites.** `<mark>` et `</mark>` ne portent aucun attribut, aucun gestionnaire d'événement, et ne peuvent pas devenir un vecteur d'exécution. Même si une correspondance tombe à l'intérieur d'un attribut HTML — un utilisateur qui recherche `href`, par exemple, produit `<a <mark>href</mark>="x">` — le résultat est un balisage corrompu, jamais l'introduction d'un `on*=` ni d'un `<script>`.

L'`escapeRegExp` de la ligne 929 et le `try/catch` de la ligne 934 sont par ailleurs corrects, et le champ n'est **pas** alimenté par l'URL (aucun `location.search`, aucun `URLSearchParams` dans le projet) : même une XSS hypothétique ne serait pas déclenchable par un lien.

**Défaut réel, non lié à la sécurité :** certains termes de recherche corrompent la structure HTML des cartes de résultats — le rendu casse jusqu'à la remise à zéro du champ (lignes 941-951). Correction propre : parcourir les nœuds de texte plutôt que réécrire `innerHTML`.

```javascript
// Proposition, sans innerHTML. NON APPLIQUÉE.
const surligner = (element, texteOriginal, terme) => {
  element.textContent = texteOriginal;                     // texte brut, jamais de HTML
  if (!terme) return;
  const idx = texteOriginal.toLowerCase().indexOf(terme.toLowerCase());
  if (idx === -1) return;
  const noeud = element.firstChild;
  const plage = document.createRange();
  plage.setStart(noeud, idx);
  plage.setEnd(noeud, idx + terme.length);
  plage.surroundContents(document.createElement("mark"));   // API DOM, aucun parsing HTML
};
```

### INFO-02 — Adresse e-mail de contact en clair sur 12 pages

L'adresse `alfa6…@gmail.com` (**masquée**) apparaît en clair dans les `href="mailto:"` et le texte visible de 12 pages : `commercant.html:527,544`, `contact.html:377,587,604`, `aide.html:821,838`, `404.html:277,294`, `confidentialite.html:240,489,517,598`, `cookies.html:250,317`, `cgu.html:319`, `chauffeur.html:530`, `index.html:1209`, `livraison.html:409`, `mentions-legales.html`. Le numéro `+224 614 87 88 86` figure aux mêmes emplacements.

Ces coordonnées sont **destinées à être publiques** — c'est la fonction d'une page de contact. Les signaler comme une fuite serait un faux positif. Deux remarques utiles subsistent :

1. Cette adresse est la **cible directe** du scénario d'usurpation de SEC-002, et elle est massivement moissonnée par les robots de collecte.
2. Une adresse Gmail personnelle comme point de contact d'entreprise interdit toute journalisation, tout filtrage anti-spam de niveau organisationnel et toute continuité en cas de départ du titulaire du compte. Une adresse sur le domaine (`contact@alfa.com.gn`) permettrait SPF, DKIM et DMARC — ce qui réduirait aussi la crédibilité des e-mails usurpés de SEC-002.

### INFO-03 — `smartLink()` appelée sept fois, définie nulle part (défaut fonctionnel, sans impact sécurité)

`telechargement.html:346`, `402`, `433` et `617` invoquent `smartLink(...)` via des gestionnaires `onclick`. La fonction n'existe dans aucun fichier du projet :

```
$ grep -rn "function smartLink\|smartLink *=" *.html js/*.js
(aucun résultat)
```

Chaque clic lève une `ReferenceError` et le `return false` bloque toute navigation de repli. **Les boutons de téléchargement de la page dédiée au téléchargement ne fonctionnent pas.** Ce constat est **hors périmètre sécurité** : les arguments sont des littéraux statiques (`'client'`, `'android'`, `'merchant'`, `'driver'`), sans aucune donnée contrôlée par l'utilisateur, donc sans risque d'injection ni de redirection ouverte. Il est mentionné ici parce que son impact commercial est significatif.

### INFO-04 — Aucune trace de Firebase dans ce dépôt

Vérifié : aucun `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, aucun SDK Firebase, aucun `apiKey`, aucun `storageBucket`, aucune URL `gs://` ni `*.appspot.com`. Les cinq seules occurrences du mot « Firebase » sont **rédactionnelles**, dans la politique de confidentialité (`confidentialite.html:274,369,372,375,423`), et décrivent l'**application mobile**. Détail complet en §10.

### INFO-05 — Attribut `rel` dupliqué

```html
<!-- index.html:1082-1085 -->
<a href="https://play.google.com/store"
   target="_blank" rel="noopener noreferrer"
   rel="noopener"                              <!-- ← second rel, ignoré par le parseur -->
   class="store-btn">
```

Sans conséquence : le parseur HTML retient la **première** occurrence, `noopener noreferrer` s'applique donc bien. Défaut de propreté uniquement.

### INFO-06 — Image Open Graph référencée mais absente

Les 14 pages déclarent `<meta property="og:image" content="https://www.alfa.com.gn/assets/og-image.jpg">` (`index.html:24-27`). Le fichier n'existe pas :

```
$ ls assets/og-image.jpg
ls: cannot access 'assets/og-image.jpg': No such file or directory
```

Tout partage social affichera un aperçu vide. Aucun impact sécurité.

### INFO-07 — Journalisation de débogage : propre

Les seuls appels console du code servi sont `console.warn` / `console.error` / `console.info` sur des messages d'erreur génériques (`js/form-handler.js:11`, `js/gtranslate.js:28,57`, `js/cookies-consent.js:130,157,184,222`). **Aucune donnée personnelle, aucun secret, aucun contenu de formulaire n'est journalisé.** Les seuls `console.log` du dépôt sont dans `test.html` (voir SEC-007) et `tools/seo_update.js`, non servi au navigateur.

### INFO-08 — Points positifs vérifiés, à conserver

- **Aucun `eval`, `new Function`, `document.write`, `setTimeout("chaîne")`** — vérifié sur les 20 fichiers HTML/JS.
- **Aucun `postMessage`** — pas de communication inter-fenêtres à valider.
- **Tous les `target="_blank"` portent `rel="noopener noreferrer"`** — vérifié sur les 24 occurrences des 14 pages.
- **Polices auto-hébergées** — 30 fichiers `.woff2` locaux, `assets/fonts/fonts.css` ne contient que des `url()` relatives. Aucun appel à `fonts.googleapis.com`. Excellent choix, pour la confidentialité comme pour la performance.
- **Aucun `@import` ni `url(https://…)` dans le CSS** — aucune ressource externe par la feuille de style.
- **`localStorage` ne contient aucune donnée sensible** — uniquement `alfa_cookie_consent` (préférences) et `alfaFormSubmissions` (horodatages). Aucun jeton, aucun identifiant.
- **Purge automatique de l'historique obsolète** — `js/form-handler.js:3-11` nettoie les horodatages périmés au chargement. Bonne hygiène.
- **Aucun jeton dans les URL** — aucun paramètre de requête n'est lu par le code.
- **`.gitignore` correctement construit** — `.env`, `.env.*`, `*.pem`, `*.key`, `serviceAccountKey.json`, `firebase-adminsdk-*.json`, `node_modules/`, `dist/`.
- **Historique Git propre** — `git log --all --name-only` ne contient aucun fichier de secret, à aucun commit.
- **`.claude/settings.local.json`** relu : ne contient que six autorisations d'outils en lecture seule (`npm ls`, `npm audit`, `sort`, `grep`, `awk`). Aucun secret.
- **`tools/seo_update.js` écrit dans `dist/` et non sur les sources** (lignes 77-107, commentaire explicite ligne 82). Bonne pratique délibérée.

---

## 9. SECRETS OU DONNÉES SENSIBLES DÉTECTÉS

**Aucun secret réel détecté.**

| Élément | Type | Verdict |
|---|---|---|
| `access_key` Web3Forms `003e…cf9b` | **Clé publique par conception** | **Pas un secret.** Identifiant de destination, sans accès au tableau de bord ni à l'historique. Le risque est l'abus du canal, traité en **SEC-002** — pas la confidentialité de la valeur. |
| `GOOGLE_ANALYTICS_ID = "G-XXXXXXXXXX"` | Valeur de remplissage | Non configuré. Un identifiant GA réel est de toute façon public. |
| `META_PIXEL_ID = "123456789012345"` | Valeur de remplissage | Non configuré. Un identifiant Pixel réel est de toute façon public. |
| Clé de site hCaptcha | **Absente du code** | Injectée à l'exécution par `web3forms.com/client/script.js` via `data-captcha="true"`. Une clé de site hCaptcha est publique par conception. |
| `alfa6…@gmail.com` (masquée) | Coordonnée publique | Destinée à être publique. Voir INFO-02. |
| `+224 6…8 86` (masqué) | Coordonnée publique | Destinée à être publique. |
| `https://github.com/Scottys224/alfa_Website` | URL de dépôt | `package.json:11,18,20`. Publique. **Vérifier si le dépôt GitHub est privé** — voir §18. |

**Recherches menées, toutes négatives :**

```
$ grep -rnaEo "(sk_live|sk_test|pk_live|rk_live|AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{36}
             |github_pat_|xox[baprs]-|BEGIN [A-Z ]*PRIVATE KEY|BEGIN CERTIFICATE
             |Bearer [A-Za-z0-9._-]{20,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}
             |password\s*[:=]|passwd|secret\s*[:=]|private_key|client_secret)"
             --include=*.html --include=*.js --include=*.json --include=*.css
             --include=*.toml --include=*.xml --include=.htaccess .
(aucun résultat)

$ git log --all --name-only | grep -iE '\.env|\.pem|\.key|serviceAccount|firebase|secret|credential|\.sql|\.bak|\.zip|\.old'
(aucun résultat)

$ git ls-files | grep -iE "\.(bak|old|zip|sql|tar|gz|env|log|orig|swp)$"
(aucun résultat)
```

**Aucun fichier de sauvegarde, aucune archive, aucune ancienne configuration, aucun `.env`, aucun certificat, aucune clé privée** — ni dans l'arbre de travail, ni dans l'historique Git complet.

---

## 10. PROBLÈMES FIREBASE

**Aucun. Firebase n'est pas utilisé dans ce dépôt.**

Ce point est établi par vérification, pas par défaut. Aucun des fichiers ni motifs suivants n'existe :

| Recherché | Résultat |
|---|---|
| `firebase.json` | **Absent** |
| `firestore.rules` | **Absent** |
| `storage.rules` | **Absent** |
| `firestore.indexes.json` | **Absent** |
| `.firebaserc` | **Absent** |
| SDK Firebase (`firebase/app`, `firebase-app.js`, `gstatic.com/firebasejs`) | **Absent** |
| `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` | **Absents** |
| URLs `gs://`, `*.appspot.com`, `*.firebaseio.com`, `*.firebasedatabase.app` | **Absentes** |
| Appels Firestore/Storage depuis le navigateur | **Aucun** |
| Cloud Functions, fonctions *callable* | **Aucune** |
| App Check | **Sans objet** |

```
$ grep -rniE "firebase|firestore|gs://|appspot|storageBucket|apiKey" --include=*.html --include=*.js --include=*.json --include=*.toml . | grep -v RAPPORT
./confidentialite.html:274:  Firebase Authentication)
./confidentialite.html:369:  Identifiant de notification push (jeton Firebase Cloud Messaging)
./confidentialite.html:372:  Données de diagnostic et de plantage (via Firebase Crashlytics)
./confidentialite.html:375:  Statistiques d'utilisation anonymisées (via Firebase Analytics)
./confidentialite.html:423:  <strong>Prestataires techniques :</strong> Google Firebase
```

Les cinq occurrences sont **du texte rédactionnel** dans la politique de confidentialité. Elles décrivent l'**application mobile alfa** (Authentication, Cloud Messaging, Crashlytics, Analytics), pas ce site.

**Conséquence de périmètre, à énoncer clairement :** l'application mobile alfa **utilise bien Firebase** — authentification, base de données, stockage, notifications — et gère des paiements Mobile Money via FedaPay. Ce sont, de loin, les composants les plus sensibles de l'écosystème alfa : ce sont eux qui détiennent les comptes utilisateurs, les données de course, les positions GPS et les transactions. **Leur code n'est pas dans ce dépôt et n'a donc pas pu être audité.**

Les questions suivantes restent **entièrement ouvertes** et justifient un audit dédié :

- Les règles Firestore autorisent-elles l'écriture à tout utilisateur authentifié (`allow write: if request.auth != null`) ?
- Un utilisateur peut-il modifier son propre champ `role`, `statut`, `solde` ou `paiement` ?
- La propriété des documents est-elle vérifiée (`request.auth.uid == resource.data.ownerId`) ?
- Les règles Storage autorisent-elles la lecture publique des documents de chauffeurs (permis, carte grise) — que `chauffeur.html:300-304` annonce comme téléversés « de manière cryptée » dans l'application ?
- App Check est-il activé pour empêcher les appels hors application ?
- Les Cloud Functions vérifient-elles `context.auth` et les rôles avant d'agir ?
- Les webhooks FedaPay valident-ils leur signature ?

**Recommandation : commander un audit distinct du dépôt de l'application mobile et de la configuration Firebase.** C'est la recommandation la plus importante de ce rapport en termes de risque résiduel pour l'écosystème alfa, même si elle sort du périmètre de ce site.

---

## 11. PROBLÈMES LIÉS AUX FORMULAIRES

**Inventaire complet — quatre formulaires, tous adossés à Web3Forms :**

| Formulaire | Fichier | Champs collectés | hCaptcha dans le DOM | Script hCaptcha chargé |
|---|---|---|---|---|
| Contact général | `contact.html:409` | prénom, nom, e-mail, sujet, message | ✅ L481-485 | ✅ L800 |
| Pré-inscription chauffeur | `chauffeur.html:306` | prénom, nom, téléphone, ville, véhicule, disponibilité, consentement | ✅ L414-418 | ✅ L742 |
| Pré-inscription commerçant | `commercant.html:286` | (bloc équivalent) | ✅ L413 | ✅ L739 |
| Alerte de zone | `index.html:749` | e-mail **ou** téléphone (champ unique) | ✅ L768-772 | ✅ L1420 |

**Types de formulaires vérifiés comme ABSENTS** — aucun formulaire de connexion, d'inscription, de réinitialisation de mot de passe, de réservation, de paiement, ni de téléversement de fichier :

```
$ grep -rniE 'type="file"|type="password"|enctype' --include=*.html .
(aucun résultat)
```

**Conséquence directe : toute la section « téléversement de fichiers dangereux » du cahier des charges est sans objet.** Aucun type MIME à falsifier, aucune extension à filtrer, aucune taille à borner, aucun fichier à stocker. `chauffeur.html:300-304` indique explicitement que le téléversement des documents sensibles (permis, carte grise) se fait **dans l'application mobile**, pas sur le site. C'est une décision de conception saine, qui retire au site sa surface d'attaque la plus dangereuse.

**Constats par point du cahier des charges :**

| Point vérifié | Constat |
|---|---|
| Validation côté client | Partielle — `required`, `type="email"`, `type="tel"` HTML5, plus le contrôle de casse de `js/form-handler.js:42-74` |
| Validation côté serveur | **Déléguée à Web3Forms.** Non vérifiable en lecture seule — voir §18 |
| Nettoyage des données | Aucun côté site. Délégué à Web3Forms |
| **Limitation de longueur** | **Absente sur tous les champs** — **SEC-005** |
| Protection anti-spam | hCaptcha présent dans le DOM ; **mise en application côté serveur non vérifiable** — **SEC-002** |
| hCaptcha / reCAPTCHA / Turnstile | hCaptcha, via Web3Forms. Configuré sur les 4 formulaires |
| **Contournement des validations JavaScript** | **Confirmé possible** — l'API est publique, la clé est dans le HTML — **SEC-002** |
| Injection HTML / JavaScript | Aucune surface côté site : aucune donnée de formulaire n'est réaffichée dans le DOM |
| XSS stockée / réfléchie / DOM | **Aucune.** Pas de stockage, pas de réflexion. Le seul `innerHTML` alimenté par la saisie est analysé en **INFO-01** et écarté |
| Injection dans les e-mails | **Suspicion** — `subject`, `from_name` et `replyto` sont pilotables par le client — **SEC-002** |
| Injection de commandes | **Aucune** — aucun code serveur |
| Téléversement de fichiers | **Sans objet** — aucun champ `type="file"` |
| Limitation du nombre de requêtes | Uniquement côté navigateur (`js/form-handler.js:76-91`, 4 envois par 3 min via `localStorage`). Effacer `localStorage` suffit à la réinitialiser ; une requête `curl` ne la traverse jamais. **Confort UX, pas un contrôle de sécurité** |

**Deux remarques de conception :**

1. **Une clé unique pour quatre formulaires** (`003e…cf9b` sur `index.html:753`, `contact.html:414`, `chauffeur.html:311`, `commercant.html:291`). Impossible de révoquer ou de restreindre un seul canal sans casser les trois autres. Recommandation : une clé par formulaire.
2. **Le garde-fou captcha de `js/form-handler.js:25` est structurellement fragile.** Ses trois conditions cumulatives font que si le chargement de `web3forms.com/client/script.js` échoue — blocage réseau, bloqueur de publicité, coupure du CDN — le champ `h-captcha-response` n'est jamais créé, `jetonCaptcha` vaut `null`, et **la condition entière est fausse : l'envoi est autorisé sans captcha.** Le garde-fou est en « échec ouvert ». Sur un site statique sans validation serveur, il devrait être en « échec fermé » :

```javascript
// Proposition — échec fermé. NON APPLIQUÉE.
const conteneurCaptcha = form.querySelector('.h-captcha');
if (conteneurCaptcha) {
  const jeton = form.querySelector('[name="h-captcha-response"]');
  if (!jeton || !jeton.value) {   // jeton absent OU vide → on bloque
    alert("Le contrôle anti-robot n'a pas pu être chargé ou validé. "
        + "Vérifiez votre connexion et réessayez.");
    return;
  }
}
```

---

## 12. PROBLÈMES LIÉS AUX SERVICES TIERS

**Inventaire complet des origines externes contactées par le site :**

| Service | Origine | Pages | `integrity` | Avant consentement | Constat |
|---|---|---|---|---|---|
| **Google Translate** | `translate.google.com/translate_a/element.js` | **14 / 14** | ❌ | **⚠️ OUI** | **SEC-003** — non déclaré comme sous-traitant |
| Google Translate (preconnect) | `translate.googleapis.com`, `translate.google.com` | 14 / 14 | s.o. | ⚠️ OUI | `index.html:60-61` — résolution DNS anticipée |
| **Web3Forms + hCaptcha** | `web3forms.com/client/script.js` | 5 / 14 | ❌ | OUI | Déclaré « nécessaire / sécurité » — `cookies.html:213`. Base légale défendable |
| **Web3Forms (API)** | `api.web3forms.com/submit` | 4 formulaires | s.o. | s.o. | **SEC-002** |
| Google Analytics | `googletagmanager.com` | 0 (non configuré) | ❌ | Non — conditionné | Mécanisme de consentement correct ; **SEC-004** sur le retrait |
| Meta Pixel | `connect.facebook.net/en_US/fbevents.js` | 0 (non configuré) | ❌ | Non — conditionné | Idem |
| Liens sociaux | `facebook.com`, `instagram.com` | 14 / 14 | s.o. | s.o. | ✅ Liens seuls, avec `rel="noopener noreferrer"` |
| Google Play | `play.google.com/store` | `index.html:1082` | s.o. | s.o. | ✅ Lien seul. Doublon `rel` — INFO-05 |
| Google Maps | `google.com/maps/search/…` | `index.html:691` | s.o. | s.o. | ✅ **Lien**, pas d'API embarquée, aucun script |
| **Polices** | **auto-hébergées** | 14 / 14 | s.o. | s.o. | ✅ **Excellent** — 30 `.woff2` locaux, aucun appel à Google Fonts |
| CDN de bibliothèques | **aucun** | — | — | — | ✅ Aucun jQuery, Bootstrap ni autre paquet depuis un CDN |
| Scripts publicitaires | **aucun** | — | — | — | ✅ |
| Widgets externes | **aucun** | — | — | — | ✅ Aucun chat, aucun avis, aucun réseau social embarqué |

**Constats par point du cahier des charges :**

- **Clés exposées** : uniquement la clé publique Web3Forms (**SEC-002**). La clé de site hCaptcha n'est pas dans le code — elle est injectée à l'exécution.
- **Domaines autorisés** : la restriction de domaine côté Web3Forms **n'est pas vérifiable** depuis le dépôt. C'est un réglage du tableau de bord. **À vérifier en priorité** — c'est l'une des deux mesures qui ferment SEC-002.
- **Validation côté serveur** : entièrement déléguée à Web3Forms. Aucune validation propre au site.
- **Origine des scripts** : les deux origines externes sont des domaines de premier plan (Google, Web3Forms). **Aucun CDN inconnu, aucun domaine douteux, aucun code obfusqué.**
- **Intégrité des ressources** : `integrity` absent sur les deux scripts externes. **Techniquement inapplicable** ici — Google et Web3Forms modifient leurs fichiers sans versionnement, un hash figé casserait le site. La CSP (**SEC-001**) est le seul contrôle applicable, ce qui renforce sa priorité.
- **Transmission de données personnelles** : Google reçoit IP + URL + contenu de page (**SEC-003**). Web3Forms et hCaptcha reçoivent les champs de formulaire — déclaré en `confidentialite.html:430-432`, conforme.
- **Scripts tiers chargés sans consentement** : **oui, deux.** Google Translate (**SEC-003**, non déclaré → problème) et hCaptcha (déclaré comme nécessaire à la sécurité → base légale défendable, l'intérêt légitime anti-abus est recevable).
- **Dépendance à un service non sécurisé** : les deux origines sont en HTTPS. Aucun contenu mixte : `grep` ne trouve **aucun** `src="http://"` ni `href="http://"` dans le dépôt.
- **Détournement d'une URL de retour ou d'un webhook** : **aucune surface.** Aucun paramètre `redirect`, `next`, `return_url` ou `callback` n'existe dans le projet. Aucun webhook entrant. Aucune redirection ouverte possible :

```
$ grep -rniE "redirect|return_url|next=|callback=" --include=*.html --include=*.js . | grep -v RAPPORT
(aucun résultat, hors les clés "redirects" de vercel.json et netlify.toml)
```

---

## 13. PROBLÈMES DE DÉPENDANCES

**`npm audit` : 0 vulnérabilité, toutes gravités confondues.**

```json
$ npm audit --json
{
  "auditReportVersion": 2,
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 },
    "dependencies": { "prod": 33, "dev": 0, "optional": 28, "peer": 0, "total": 60 }
  }
}
```

**Point essentiel : aucune dépendance npm n'atteint le navigateur.** Le site ne charge **aucune** bibliothèque JavaScript tierce. Les 60 paquets de l'arbre résolu servent exclusivement à des outils locaux d'optimisation d'images et de génération SEO. La surface d'attaque côté client via les dépendances est donc **nulle** — c'est un point fort notable, et rare.

| Point vérifié | Constat |
|---|---|
| `package.json` | ✅ Relu intégralement. 3 dépendances directes. **Classement incorrect** — **SEC-010** |
| `package-lock.json` | ✅ Présent (34 Ko), verrouille les 60 paquets. Bonne pratique |
| `yarn.lock` / `pnpm-lock.yaml` | Absents — pas de gestionnaires concurrents. Cohérent |
| `node_modules/` | **Non installé** et **correctement ignoré** (`.gitignore:10`) |
| Bibliothèques JavaScript côté client | **Aucune.** Les 6 fichiers JS sont écrits à la main |
| Versions obsolètes | `puppeteer ^25.4.0`, `sharp ^0.35.3`, `image-size ^2.0.2` — versions récentes et maintenues |
| Dépendances vulnérables connues | **Aucune** — `npm audit` = 0 |
| Paquets abandonnés | Aucun. Les trois sont activement maintenus |
| **Scripts postinstall suspects** | `puppeteer` télécharge Chromium à l'installation — comportement **documenté et légitime**, non suspect. Voir SEC-010 |
| Dépendances inutilisées | Les **trois** sont inutilisées en production — **SEC-010** |
| Typosquatting | **Aucun indice.** `image-size`, `puppeteer`, `sharp` : orthographes exactes des paquets légitimes |
| Point d'entrée | `package.json:5` déclare `download_fonts.js`, **fichier inexistant** — INFO/SEC-010 |
| `"private"` | **Absent** — rien n'empêche une publication accidentelle sur npm. Voir SEC-010 |

> **Réserve méthodologique :** `node_modules/` n'étant pas installé, `npm audit` s'appuie sur `package-lock.json`. C'est la méthode correcte en mode lecture seule — installer les dépendances aurait modifié le projet, ce que l'audit interdit. Le résultat est fiable pour l'arbre verrouillé. `npm ls` remonte logiquement `UNMET DEPENDENCY` pour les trois paquets, ce qui **confirme** que rien n'est installé.

---

## 14. PROBLÈMES D'EN-TÊTES HTTP

**Bilan complet.** Les quatre en-têtes de base sont présents, correctement valorisés, et **cohérents sur les trois plateformes** — c'est un point fort à créditer.

| En-tête | Statut | Valeur | Évaluation |
|---|---|---|---|
| `Strict-Transport-Security` | ✅ Présent | `max-age=31536000; includeSubDomains; preload` | **Excellent.** 1 an, sous-domaines inclus, éligible à la liste de préchargement |
| `X-Frame-Options` | ✅ Présent | `SAMEORIGIN` | **Correct.** Anti-clickjacking assuré |
| `X-Content-Type-Options` | ✅ Présent | `nosniff` | **Correct.** Anti-MIME-sniffing |
| `Referrer-Policy` | ✅ Présent | `strict-origin-when-cross-origin` | **Excellent.** Meilleur compromis fuite / analytique |
| `Content-Security-Policy` | ❌ **Absent** | — | **SEC-001 — ÉLEVÉE.** Manque le plus important |
| `Permissions-Policy` | ❌ Absent | — | SEC-006 — FAIBLE |
| `Cross-Origin-Opener-Policy` | ❌ Absent | — | SEC-006 — FAIBLE |
| `Cross-Origin-Resource-Policy` | ❌ Absent | — | SEC-006 — FAIBLE |
| `Cross-Origin-Embedder-Policy` | ❌ Absent | — | **Correct de ne pas l'ajouter** : casserait Google Translate et hCaptcha |
| `X-XSS-Protection` | ❌ Absent | — | **Correct de ne pas l'ajouter** : obsolète, retiré des navigateurs modernes, historiquement source de failles |

**Politiques trop permissives :** aucune. Il n'y a **aucun** en-tête CORS dans le projet — donc aucun `Access-Control-Allow-Origin: *`, aucun risque de CORS laxiste. Pour un site statique sans API propre, c'est le comportement souhaitable.

**Point d'attention transversal — SEC-011 :** les quatre en-têtes sont bien répliqués à l'identique sur `vercel.json`, `netlify.toml` et `.htaccess`. Toute correction — CSP en tête — devra être portée sur la configuration **effectivement active**, sans quoi elle n'aura aucun effet. Déterminer la plateforme réelle est donc un **prérequis** à la correction de SEC-001.

---

## 15. PROBLÈMES DE CONFIDENTIALITÉ ET DE COOKIES

**Base solide** : une bannière de consentement fonctionnelle avec trois choix (accepter / refuser / personnaliser), une politique de cookies dédiée (`cookies.html`), une politique de confidentialité détaillée (`confidentialite.html`), le versionnement du consentement (`js/cookies-consent.js:4`) et un horodatage (`savedAt`, ligne 121). La possibilité de **revenir** sur son choix est offerte sur toutes les pages via `[data-open-cookie-settings]` (lignes 93-107). C'est nettement au-dessus de la moyenne des sites vitrines.

| Point vérifié | Constat |
|---|---|
| Collecte excessive de données | ✅ **Non.** Chaque champ est justifié : le type de véhicule et la disponibilité sont pertinents pour un recrutement de chauffeur. Aucune date de naissance, aucun numéro d'identité, aucune adresse précise |
| **Consentement avant Analytics / Meta Pixel** | ✅ **Correct** — `js/cookies-consent.js:168-174` conditionne bien les deux |
| **Consentement avant Google Translate** | ❌ **Non** — **SEC-003 (MOYENNE)** |
| **Retrait effectif du consentement** | ❌ **Inopérant dans la session courante** — **SEC-004 (MOYENNE)** |
| Politique de confidentialité | ✅ Présente et détaillée. **Mais incomplète** : Google Translate absent de la liste des sous-traitants — SEC-003 |
| Bannière de cookies | ✅ Présente, avec `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`. Accessible |
| Refus des cookies non essentiels | ✅ Bouton « Tout refuser » explicite, au même niveau visuel qu'« Accepter » — pas de motif sombre |
| Durée de conservation | ⚠️ Le consentement est stocké **sans expiration** dans `localStorage`. La CNIL recommande un renouvellement à 6 mois. `savedAt` est enregistré mais **jamais relu** — `readConsent()` (lignes 139-163) ne vérifie que `version` |
| Formulaires demandant des données inutiles | ✅ Non |
| **Exposition d'e-mails / téléphones** | ⚠️ En clair sur 12 pages — **volontaire et légitime** pour une page de contact. Voir INFO-02 |
| Données personnelles dans les URL | ✅ **Aucune.** Aucun paramètre de requête n'est produit ni lu par le site |
| Données envoyées à des tiers sans information claire | ❌ **Oui — Google Translate.** C'est le cœur de SEC-003 |
| Cookies `Secure` / `HttpOnly` / `SameSite` | **Sans objet côté site** : le site **ne pose aucun cookie lui-même** — il utilise `localStorage`. Le cookie `googtrans` est posé par Google, dont les attributs échappent au contrôle d'alfa. Voir la remarque ci-dessous |
| Identifiants stockés dans le navigateur | ✅ **Aucun.** `localStorage` ne contient que des préférences et des horodatages |
| Jetons visibles dans les URL | ✅ Aucun |
| Contenu mixte (HTTP dans HTTPS) | ✅ **Aucun** — vérifié : aucun `src="http://"` ni `href="http://"` |

**Remarque sur `localStorage` et les cookies.** Le choix de `localStorage` plutôt que d'un cookie pour le consentement supprime toute question de `Secure` / `HttpOnly` / `SameSite`, mais présente deux limites à connaître : (1) `localStorage` est accessible en JavaScript, donc lisible par tout script tiers compromis — ce qui relie ce point à SEC-001 ; (2) il n'a **pas d'expiration native**, d'où l'absence de renouvellement du consentement. Ce sont des compromis acceptables, à documenter.

**Correction proposée pour l'expiration du consentement — NON APPLIQUÉE :**

```javascript
// js/cookies-consent.js — proposition : faire expirer le consentement à 6 mois
const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;   // ~6 mois (CNIL)

function readConsent() {
  try {
    const brut = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!brut) return null;
    const consent = JSON.parse(brut);

    if (consent.version !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    // savedAt est déjà écrit (ligne 121) mais n'était jamais relu.
    if (!consent.savedAt
        || Date.now() - new Date(consent.savedAt).getTime() > CONSENT_MAX_AGE_MS) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;                                       // la bannière réapparaît
    }
    return consent;
  } catch (error) {
    console.error("Impossible de lire le consentement :", error);
    return null;
  }
}
```

---

## 16. PLAN DE CORRECTION CLASSÉ PAR PRIORITÉ

### Priorité 1 — À traiter cette semaine

| # | Action | Réf. | Effort | Impact | Difficulté |
|---|---|---|---|---|---|
| 1 | **Activer « Require Captcha » dans le tableau de bord Web3Forms** | SEC-002 | 10 min | **Très élevé** — ferme à lui seul le scénario `curl` | ⭐ Triviale |
| 2 | **Restreindre les domaines autorisés à `alfa.com.gn` côté Web3Forms** | SEC-002 | 10 min | **Très élevé** | ⭐ Triviale |
| 3 | **Déterminer la plateforme d'hébergement réelle** (prérequis à toute correction d'en-tête) | SEC-011 | 30 min | Bloquant pour la suite | ⭐ Triviale |
| 4 | **Déployer une CSP en `Report-Only`** sur la plateforme active, collecter les violations | SEC-001 | 2 h | **Élevé** | ⭐⭐ Moyenne |
| 5 | Supprimer `test.html` du dépôt | SEC-007 | 5 min | Moyen | ⭐ Triviale |

### Priorité 2 — À traiter ce mois

| # | Action | Réf. | Effort | Impact | Difficulté |
|---|---|---|---|---|---|
| 6 | **Basculer la CSP en mode bloquant** après la période d'observation | SEC-001 | 2 h | **Élevé** | ⭐⭐ Moyenne |
| 7 | **Soumettre Google Translate au consentement** — ou le retirer au profit de pages statiques traduites | SEC-003 | 4-6 h | **Élevé** (RGPD) | ⭐⭐ Moyenne |
| 8 | **Ajouter Google Translate à la liste des sous-traitants** de `confidentialite.html` | SEC-003 | 30 min | **Élevé** (RGPD) | ⭐ Triviale |
| 9 | **Implémenter le déchargement des traceurs au retrait du consentement** | SEC-004 | 2 h | Moyen — **critique avant** de renseigner les vrais ID GA/Pixel | ⭐ Faible |
| 10 | Ajouter `Permissions-Policy`, `COOP`, `CORP` | SEC-006 | 30 min | Moyen | ⭐ Triviale |
| 11 | Ajouter `maxlength` et `pattern` sur les ~20 champs des 4 formulaires | SEC-005 | 30 min | Moyen | ⭐ Triviale |
| 12 | Passer le garde-fou captcha en « échec fermé » (`js/form-handler.js:25`) | §11 | 15 min | Moyen | ⭐ Triviale |
| 13 | Corriger les chemins de blocage de `tools/` sur Vercel/Netlify | SEC-008 | 15 min | Faible | ⭐ Triviale |

### Priorité 3 — À traiter ce trimestre

| # | Action | Réf. | Effort | Impact | Difficulté |
|---|---|---|---|---|---|
| 14 | **Interposer un relais serverless** détenant la clé Web3Forms et validant le captcha côté serveur | SEC-002 | 1-2 j | **Élevé** | ⭐⭐⭐ Élevée |
| 15 | Attribuer **une clé Web3Forms distincte par formulaire** | SEC-002 | 1 h | Moyen | ⭐ Faible |
| 16 | Migrer vers une adresse de contact sur le domaine (`contact@alfa.com.gn`) + SPF/DKIM/DMARC | INFO-02 | 2-4 h | Moyen | ⭐⭐ Moyenne |
| 17 | Faire expirer le consentement à 6 mois (relire `savedAt`) | §15 | 30 min | Faible | ⭐ Triviale |
| 18 | Supprimer les deux configurations de plateforme mortes | SEC-011 | 30 min | Faible | ⭐ Triviale |
| 19 | Reclasser `puppeteer`/`sharp`/`image-size` en `devDependencies`, ajouter `"private": true` | SEC-010 | 15 min | Faible | ⭐ Triviale |
| 20 | Ajouter `Options -Indexes` et la redirection HTTPS si Apache | SEC-009 | 15 min | Faible | ⭐ Triviale |
| 21 | Réécrire la surbrillance de `aide.html` sans `innerHTML` (API `Range`) | INFO-01 | 1 h | Faible (qualité) | ⭐⭐ Moyenne |
| 22 | Définir `smartLink()` ou remplacer les `onclick` par de vrais `href` | INFO-03 | 30 min | **Élevé commercialement**, nul en sécurité | ⭐ Faible |
| 23 | Produire `assets/og-image.jpg` | INFO-06 | 30 min | Nul en sécurité | ⭐ Triviale |
| 24 | **Commander un audit dédié de l'application mobile et de Firebase** | §10 | — | **Le plus élevé de tous** | ⭐⭐⭐ Élevée |

---

## 17. CHECKLIST DE SÉCURITÉ AVANT MISE EN PRODUCTION

### Bloquants — ne pas mettre en production sans ces points

- [ ] **« Require Captcha » activé** dans le tableau de bord Web3Forms *(SEC-002)*
- [ ] **Domaines autorisés restreints** à `alfa.com.gn` et `www.alfa.com.gn` côté Web3Forms *(SEC-002)*
- [ ] **CSP déployée** et validée sur la plateforme réellement active *(SEC-001)*
- [ ] **`test.html` supprimé** du dépôt et du site publié *(SEC-007)*
- [ ] **Google Translate déclaré** dans la politique de confidentialité *(SEC-003)*
- [ ] **Une seule configuration de plateforme** conservée, les autres supprimées *(SEC-011)*

### Vérifications à mener manuellement en environnement réel

- [ ] `curl -X POST https://api.web3forms.com/submit -d '{"access_key":"…","message":"test"}'` → **doit être rejeté** *(valide SEC-002)*
- [ ] Requête depuis une origine tierce (`Origin: https://evil.example`) → **doit être rejetée**
- [ ] `curl -I https://www.alfa.com.gn/` → vérifier la présence effective des 4 en-têtes **plus la CSP**
- [ ] `curl -I http://www.alfa.com.gn/` → **doit renvoyer une 301 vers HTTPS**
- [ ] `curl -I https://www.alfa.com.gn/.git/config` → **doit renvoyer 404**
- [ ] `curl -I https://www.alfa.com.gn/tools/seo_update.js` → **doit renvoyer 404** *(valide SEC-008)*
- [ ] `curl -I https://www.alfa.com.gn/test.html` → **doit renvoyer 404** *(valide SEC-007)*
- [ ] `https://www.alfa.com.gn/assets/images/` → **ne doit pas lister le répertoire** *(valide SEC-009)*
- [ ] Onglet Réseau, **avant** tout clic sur la bannière → aucune requête vers `google.com` ni `facebook.net` *(valide SEC-003)*
- [ ] Accepter puis refuser sans recharger → **aucune requête analytique résiduelle** *(valide SEC-004)*
- [ ] Soumettre un formulaire avec le JavaScript désactivé → comportement maîtrisé
- [ ] Soumettre avec un `message` de 10 Mo → **doit être rejeté** *(valide SEC-005)*
- [ ] Vérifier que **le dépôt GitHub `Scottys224/alfa_Website` est privé** — ou qu'il ne contient rien de sensible
- [ ] Tester les 7 boutons de téléchargement de `telechargement.html` *(INFO-03)*
- [ ] Vérifier la validité et la chaîne du certificat TLS (`ssllabs.com` — cible : note A ou A+)
- [ ] Vérifier les enregistrements SPF, DKIM et DMARC du domaine `alfa.com.gn`
- [ ] Soumettre le domaine à `hstspreload.org` — HSTS est déjà correctement configuré pour cela

### Contrôles récurrents

- [ ] `npm audit` à chaque déploiement *(actuellement : 0 vulnérabilité)*
- [ ] Roter la clé Web3Forms si un abus est constaté
- [ ] Relire la politique de confidentialité à chaque ajout de service tiers
- [ ] Réauditer après tout ajout de formulaire, de page dynamique ou de script tiers

---

## 18. LIMITES DE L'AUDIT ET ÉLÉMENTS NON VÉRIFIABLES

Cette section est essentielle à l'interprétation correcte du rapport. **Un audit statique en lecture seule sur un site statique a des angles morts structurels**, qu'il serait malhonnête de passer sous silence.

### 18.1 — Non vérifiable par nature en lecture seule

| Élément | Pourquoi | Comment le lever |
|---|---|---|
| **Réglages du tableau de bord Web3Forms** | Hors du dépôt. « Require Captcha » et la restriction de domaine sont les **deux points les plus déterminants** pour la gravité réelle de SEC-002 | Se connecter au tableau de bord Web3Forms |
| **Comportement d'échappement de Web3Forms** dans les e-mails | Code tiers non observable | Test contrôlé avec une charge HTML sur un formulaire de test |
| **En-têtes HTTP réellement émis** | Dépend de la plateforme active et de sa configuration console, qui peut surcharger les fichiers du dépôt | `curl -I` sur le site en production |
| **Plateforme d'hébergement effective** | Trois configurations coexistent (SEC-011) | Demander à l'équipe / inspecter les en-têtes de réponse |
| **Certificat TLS, chaîne, protocoles, suites** | Propriété de l'hôte | `ssllabs.com`, `testssl.sh` |
| **Redirection HTTP → HTTPS réelle** | Souvent gérée par la plateforme, hors dépôt | `curl -I http://…` |
| **Configuration DNS** (CAA, SPF, DKIM, DMARC) | Hors dépôt | `dig`, `mxtoolbox` |
| **Indexation de répertoires** | Dépend de la configuration serveur parente | Requête sur `/assets/images/` |
| **Visibilité du dépôt GitHub** | `Scottys224/alfa_Website` — **public ou privé ?** | Vérifier sur GitHub |
| **Contenu réel de `assets/`** | 314 fichiers binaires inventoriés par extension, non ouverts. Des métadonnées EXIF (géolocalisation, nom d'appareil) peuvent subsister dans les images | `exiftool` sur les `.webp` |

### 18.2 — Hors périmètre : le risque résiduel le plus important

**L'application mobile alfa, sa configuration Firebase et son intégration FedaPay ne sont pas dans ce dépôt et n'ont pas pu être auditées.**

Ce sont les composants qui détiennent réellement les données sensibles : comptes utilisateurs, authentification, positions GPS, historiques de course, documents officiels des chauffeurs (permis, carte grise) et transactions Mobile Money. Le site audité ici est une **vitrine** : sa compromission maximale exposerait des coordonnées de candidats. La compromission d'une règle Firestore mal écrite exposerait **l'intégralité de la base utilisateurs et des transactions**.

> **La conclusion la plus importante de ce rapport dépasse son propre périmètre : la note de 14/20 s'applique au site vitrine, et ne dit rien de la sécurité de la plateforme alfa. Un audit dédié du dépôt de l'application mobile et de la configuration Firebase — règles Firestore et Storage, Cloud Functions, App Check, webhooks FedaPay — doit être commandé. C'est là que se situe le risque matériel pour les utilisateurs et pour l'entreprise.**

### 18.3 — Non réalisé volontairement (mode lecture seule)

Aucun test dynamique n'a été mené : pas de scan actif, pas d'exécution du site, pas de test de charge, pas de fuzzing des formulaires, aucun envoi réel via l'API Web3Forms, aucun `npm install`, aucune installation de `node_modules/`. Les scénarios d'exploitation décrits reposent sur **l'analyse statique du code et de la configuration**, pas sur une exploitation effective. C'est conforme au mandat, et cela signifie qu'aucun constat n'a été confirmé par exploitation réelle — la colonne « Confiance » de chaque constat reflète explicitement ce degré de certitude.

### 18.4 — Familles de vulnérabilités écartées après vérification

Ces catégories figuraient au cahier des charges. Elles sont **vérifiées comme inapplicables**, et non omises :

| Catégorie | Verdict | Motif |
|---|---|---|
| Injection SQL / NoSQL | **Sans objet** | Aucune base de données, aucun code serveur |
| Injection de commandes | **Sans objet** | Aucune exécution serveur |
| Injection XXE | **Sans objet** | Aucun parsing XML côté site |
| Injection de gabarit (SSTI) | **Sans objet** | Aucun moteur de gabarit |
| SSRF | **Sans objet** | Aucune requête sortante initiée côté serveur |
| Traversée de répertoire / inclusion de fichier | **Sans objet** | Aucune opération de fichier côté serveur |
| Désérialisation, pickle, YAML | **Sans objet** | Aucune désérialisation |
| Authentification, autorisation, sessions, jetons, IDOR | **Sans objet** | Aucun système d'authentification, aucun compte, aucune session, aucune ressource identifiée par ID |
| Énumération de comptes, mots de passe faibles, réinitialisation | **Sans objet** | Aucun compte utilisateur |
| CSRF | **Sans objet** | Aucun état côté serveur, aucune action authentifiée à forger |
| Redirection ouverte | **Vérifié absent** | Aucun paramètre de redirection dans le projet |
| Prototype pollution | **Vérifié absent** | Aucune fusion d'objets, aucune affectation dynamique de clés |
| `postMessage` sans validation d'origine | **Vérifié absent** | Aucun `postMessage` |
| CORS trop permissif | **Vérifié absent** | Aucun en-tête CORS dans le projet |
| Tabnabbing | **Vérifié couvert** | Les 24 `target="_blank"` portent `rel="noopener noreferrer"` |
| XSS (stockée, réfléchie, DOM) | **Vérifié absent** | Aucun stockage, aucune réflexion. Le seul cas d'apparence est analysé et écarté en INFO-01 |
| Clickjacking | **Vérifié couvert** | `X-Frame-Options: SAMEORIGIN` sur les 3 configurations |
| Contenu mixte | **Vérifié absent** | Aucune ressource `http://` |
| Source maps exposées | **Vérifié absent** | Aucun fichier `.map`, aucun code minifié |
| Mode debug activé | **Vérifié absent** | Aucun indicateur de débogage |
| Fichiers de sauvegarde exposés | **Vérifié absent** | Aucun `.bak`, `.old`, `.zip`, `.sql`, `.tar`, `.gz` |
| Code obfusqué | **Vérifié absent** | Les 6 fichiers JS sont lisibles et non minifiés |
| Ports ou services inutiles | **Sans objet** | Hébergement statique |

---

## ANNEXE A — Tableau de synthèse des constats

| ID | Gravité | Confiance | Statut | Catégorie | Fichier principal | Priorité | Difficulté |
|---|---|---|---|---|---|---|---|
| **SEC-001** | **ÉLEVÉE** | 9/10 | Confirmé | `missing_csp` | `vercel.json:5-21` + 14 HTML | P1 | ⭐⭐ |
| **SEC-002** | **ÉLEVÉE** | 9/10 (7/10 captcha) | Confirmé / à vérifier | `client_controlled_params` | `contact.html:409-421` +3 | P1 | ⭐ / ⭐⭐⭐ |
| **SEC-003** | MOYENNE | 9/10 | Confirmé | `privacy_consent` | `js/cookies-consent.js:165-175` | P2 | ⭐⭐ |
| **SEC-004** | MOYENNE | 8/10 | Confirmé | `consent_withdrawal` | `js/cookies-consent.js:115-137` | P2 | ⭐ |
| **SEC-005** | FAIBLE | 9/10 (6/10 impact) | Confirmé / suspicion | `missing_constraints` | 4 formulaires | P3 | ⭐ |
| **SEC-006** | FAIBLE | 10/10 | Confirmé | `missing_headers` | `vercel.json:5-21` | P3 | ⭐ |
| **SEC-007** | FAIBLE | 9/10 | Confirmé | `debug_artifact` | `test.html` | P3 | ⭐ |
| **SEC-008** | FAIBLE | 8/10 | Confirmé | `source_exposure` | `vercel.json:31-35` | P3 | ⭐ |
| **SEC-009** | FAIBLE | 8/10 | Confirmé (conditionnel) | `directory_listing` | `.htaccess` | P3 | ⭐ |
| **SEC-010** | FAIBLE | 9/10 (5/10 impact) | Confirmé | `dependency_misclass` | `package.json:21-25` | P4 | ⭐ |
| **SEC-011** | FAIBLE | 10/10 | Confirmé | `config_drift` | 3 configurations | P3 | ⭐ |
| INFO-01 | INFO | 9/10 | **Écarté — non vulnérable** | `xss` (analysé) | `aide.html:911-980` | P3 (qualité) | ⭐⭐ |
| INFO-02 | INFO | — | Volontaire | `pii_exposure` | 12 pages | P3 | ⭐⭐ |
| INFO-03 | INFO | 10/10 | Défaut fonctionnel | — | `telechargement.html:346` | P3 | ⭐ |
| INFO-04 | INFO | 10/10 | Sans objet | — | — | — | — |
| INFO-05 | INFO | 10/10 | Propreté | — | `index.html:1082-1085` | P4 | ⭐ |
| INFO-06 | INFO | 10/10 | Défaut fonctionnel | — | 14 pages | P4 | ⭐ |
| INFO-07 | INFO | 10/10 | **Point positif** | — | 6 fichiers JS | — | — |
| INFO-08 | INFO | 10/10 | **Points positifs** | — | Ensemble du dépôt | — | — |

## ANNEXE B — Commandes de diagnostic exécutées (lecture seule uniquement)

```bash
git status --short
git ls-files                      # 346 fichiers suivis
git log --oneline --all --name-only
git log --all -S"003e9773" --oneline
npm ls --depth=0                  # UNMET (node_modules absent) — attendu
npm audit --json                  # 0 vulnérabilité / 60 paquets
grep -rniE "Content-Security-Policy|http-equiv" --include=*.html --include=*.json --include=*.toml .
grep -rniE "access_key|sitekey|h-captcha|hcaptcha|recaptcha|turnstile" --include=*.html --include=*.js .
grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function" --include=*.html --include=*.js .
grep -rnE "location\.(search|hash|href)|URLSearchParams|postMessage|localStorage|document\.cookie" --include=*.html --include=*.js .
grep -rniE "firebase|firestore|gs://|appspot|storageBucket|apiKey" --include=*.html --include=*.js --include=*.json .
grep -rnaEo "(sk_live|AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{36}|BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16})" .
grep -rniE 'type="file"|type="password"|enctype|maxlength|pattern=' --include=*.html .
grep -rn 'target="_blank"' --include=*.html .
```

**Commandes délibérément NON exécutées**, conformément au mandat : `npm install`, `npm update`, `npm audit fix`, `git commit`, `git push`, `git checkout`, `git add`, toute suppression de fichier, toute modification automatique de code, tout déploiement.

---

## ATTESTATION DE NON-MODIFICATION

Cet audit a été mené **exclusivement en lecture seule**.

- ✅ **Aucun fichier source modifié, supprimé, déplacé ni reformaté**
- ✅ **Aucun commit, aucune branche, aucune Pull Request créés**
- ✅ **Aucun déploiement effectué**
- ✅ **Aucune configuration Firebase, DNS, hébergement ou service tiers modifiée**
- ✅ **Aucune commande susceptible de modifier le projet exécutée** — ni `npm install`, ni `npm audit fix`, ni aucune opération d'écriture Git
- ✅ **Le rapport antérieur `RAPPORT_CYBERSECURITE_ALFA_WEBSITE.md` (86 Ko) est intact** — il n'a pas été écrasé
- ✅ **Seul fichier créé** : `RAPPORT_CYBERSECURITE_ALFA_WEBSITE_2026-07-30.md` (le présent document)
- ✅ **Toutes les données sensibles sont masquées** dans ce rapport : la clé Web3Forms est tronquée (`003e9773-…cf9b`), l'adresse e-mail est masquée (`alfa6…@gmail.com`), le numéro de téléphone est partiellement masqué. Le nom complet de l'adresse et du téléphone n'est jamais reproduit intégralement.

**Vérification finale de l'état de l'arbre de travail :**

```
$ git status --short
?? RAPPORT_CYBERSECURITE_ALFA_WEBSITE.md            (antérieur, intact)
?? RAPPORT_CYBERSECURITE_ALFA_WEBSITE_2026-07-30.md (ce rapport)
?? RAPPORT_QUALITE_RESPONSIVE_ALFA_WEBSITE.md       (antérieur, intact)
?? RAPPORT_SECURITE_2026-07-27.md                   (antérieur, intact)
```

Aucune entrée `M` (modifié), `D` (supprimé) ou `R` (renommé) : **aucun fichier suivi n'a été touché.**

---

*Rapport généré le 30 juillet 2026 — audit de cybersécurité en lecture seule du dépôt `alfa_Website`, branche `main`, commit `582798b`.*

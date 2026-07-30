# REVUE COMPLÈTE DE CODE — alfa_Website

**Date** : 30 juillet 2026
**Dépôt** : `C:\Users\alpha\Desktop\alfa_Website` — branche `main`, commit `582798b`
**Périmètre** : 31 fichiers texte analysés ligne par ligne (14 HTML, 6 JS, 3 CSS, 8 configurations) + inventaire de 314 fichiers binaires. Total : 13 182 lignes de code.
**Mode** : **lecture seule stricte**. Aucun fichier source modifié, supprimé, déplacé ni reformaté. Aucun commit, aucun déploiement. Seul fichier créé : le présent rapport.

---

## NOTE GLOBALE : **64 / 100**

| Domaine | Note | Verdict |
|---|---|---|
| **Qualité du code** | **58 / 100** | Design system CSS excellent, JavaScript propre — mais **44 % du HTML est du copier-coller** |
| **Sécurité** | **68 / 100** | Aucune faille critique. Absence de CSP et canal formulaire à durcir |
| **Performance** | **68 / 100** | Images WebP légères, polices sous-découpées — mais 3,6 Mo d'images mortes et `sizes` incorrect |
| **SEO** | **66 / 100** | Bases solides — mais **soft-404 sur Vercel** et traduction non indexable |
| **Accessibilité** | **62 / 100** | Fondations sérieuses — mais lien d'évitement invisible et vol de focus |
| **Responsive design** | **64 / 100** | Fonctionne — mais le menu mobile se ferme tout seul au défilement |

**Synthèse en trois phrases.** Ce projet est **bien meilleur que la moyenne des sites vitrines** : design system CSS structuré par variables, WebP avec `srcset`, polices auto-hébergées correctement sous-découpées, `prefers-reduced-motion`, `:focus-visible`, FAQ en `<details>` natifs, bannière de consentement accessible. Les problèmes ne viennent pas d'une méconnaissance des bonnes pratiques — l'auteur les connaît et les applique — mais de **l'absence de mécanisme de factorisation** : 13 pages HTML entretenues à la main dérivent inévitablement, et quelques détails d'implémentation (un gestionnaire `resize`, un attribut `sizes`, une règle `outline: none`) produisent des bugs visibles. Deux défauts sont **bloquants** et doivent être corrigés avant tout déploiement : la fonction `smartLink()` qui n'existe pas, et le soft-404 de la configuration Vercel.

---

# 1. QUALITÉ GÉNÉRALE DU CODE — 58/100

## QC-01 — 44 % du HTML est du code dupliqué à la main sur 13 pages

| | |
|---|---|
| **Priorité** | **ÉLEVÉ** |
| **Fichiers** | Les 13 pages HTML de production |
| **Lignes** | En-tête (~90 l.), pied de page (~165 l.), bannière cookies (~115 l.) × 13 |

**Description.** Trois blocs identiques sont recopiés dans chaque page : l'en-tête avec sa navigation et son sélecteur de langue, le pied de page complet, et la bannière de consentement avec sa fenêtre de réglages. Mesures relevées :

| Page | Lignes totales | Pied de page | Bannière cookies | En-tête | **Part de gabarit** |
|---|---|---|---|---|---|
| `mentions-legales.html` | 523 | 233→397 (165) | 400→510 (110) | ~118→200 (82) | **68 %** |
| `cgu.html` | 539 | ~340→415 | 418→525 | ~125→210 | **~65 %** |
| `cookies.html` | 537 | 254→410 | 414→520 | ~112→195 | **~66 %** |
| `contact.html` | 811 | ~590→675 | ~687→795 | ~213→300 | **~40 %** |

Sur les ~11 000 lignes de HTML du projet, environ **4 800 lignes sont du gabarit recopié**.

**Conséquence possible.** Toute évolution du pied de page ou de la bannière cookies exige 13 modifications manuelles identiques. La dérive est déjà mesurable et documentée dans ce dépôt :

- `contact.html:679-683` contient un commentaire `<!-- Script Web3Forms pour hCaptcha -->` **vide**, alors que le vrai script est 120 lignes plus bas (`contact.html:800`). Vestige d'une réorganisation appliquée sur certaines pages seulement.
- L'ordre de chargement des scripts diffère selon les pages : `main.js` est chargé **avant** `cookies-consent.js` sur `index.html` (1300 puis 1419) mais **après** sur `cgu.html` (527 puis 532).
- `telechargement.html` ne charge pas `web3forms/client/script.js` alors que 5 autres pages le font.

À terme : un correctif de sécurité ou de conformité RGPD appliqué sur 12 pages et oublié sur la 13ᵉ.

**Solution recommandée.** Introduire une factorisation **sans changer le design ni le rendu**. Deux options, par ordre d'effort croissant :

**Option A — inclusions à la compilation (recommandée).** Un générateur de site statique minimal (Eleventy) transforme les 13 pages en 13 fichiers de contenu + 3 partiels. Aucun changement de rendu, aucun JavaScript ajouté, sortie 100 % statique.

**Option B — assemblage par script Node.** Réutiliser l'approche déjà présente dans `tools/seo_update.js`, qui écrit dans `dist/` sans toucher aux sources.

**Exemple de code corrigé (Option A) — NON APPLIQUÉ :**

```njk
{# _includes/base.njk — le gabarit unique #}
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>{{ title }}</title>
    <meta name="description" content="{{ description }}" />
    <link rel="canonical" href="https://www.alfa.com.gn/{{ page.fileSlug }}" />
    {% include "partials/head-meta.njk" %}
  </head>
  <body>
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    {% include "partials/header.njk" %}
    <main id="main-content">{{ content | safe }}</main>
    {% include "partials/footer.njk" %}
    {% include "partials/cookie-banner.njk" %}
    {% include "partials/scripts.njk" %}
  </body>
</html>
```

```markdown
<!-- mentions-legales.njk — la page ne contient plus QUE son contenu propre -->
---
layout: base.njk
title: Mentions Légales - Alfa
description: Consultez les mentions légales de la société Alfa…
---
<section class="container legal-content">
  <h1>Mentions Légales</h1>
  …
</section>
```

> **Gain mesuré** : ~4 800 lignes supprimées, une seule source de vérité pour l'en-tête, le pied de page et la bannière RGPD. **Aucun changement visuel.**

---

## QC-02 — 246 attributs `style="…"` en ligne contournent le design system

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | 13 pages — `index.html` (39), `confidentialite.html` (29), `nourriture.html` (21), `contact.html`/`aide.html`/`chauffeur.html`/`commercant.html` (20 chacun) |

**Description.** Le projet possède un design system CSS remarquable (`css/style.css:4-48` : 30 variables couvrant couleurs, ombres, rayons, transitions). Pourtant 246 déclarations `style="…"` le court-circuitent. Exemples relevés :

```html
<!-- index.html:872 — taille et marge codées en dur, hors du design system -->
<h3 style="font-size: 1.5rem; margin-bottom: 16px">

<!-- chauffeur.html:422 — !important dans un attribut inline : niveau de priorité maximal -->
<button type="submit" class="btn btn-primary btn-large mt-4"
        style="width: 100%; background: var(--color-driver); color: #0F172A !important;">

<!-- index.html:781-789 — 6 propriétés en ligne sur un paragraphe de confirmation -->
<p id="notify-success" style="display: none; color: var(--color-primary);
   font-weight: bold; margin-top: 10px;">
```

**Conséquence possible.** Un changement de charte graphique dans `:root` ne se propage pas à ces 246 emplacements. Le `!important` inline de `chauffeur.html:422` est **impossible à surcharger** depuis une feuille de style — seul un autre `!important` inline le battrait. Les styles inline sont par ailleurs incompatibles avec une CSP stricte (`style-src 'self'` sans `'unsafe-inline'`), ce qui bloquera le durcissement de sécurité recommandé par l'audit du même jour.

**Solution recommandée.** Extraire les styles répétés en classes utilitaires. Le projet en possède déjà (`css/style.css:93-103` : `.text-center`, `.mt-4`, `.text-muted`) — il suffit d'étendre ce vocabulaire.

**Exemple de code corrigé — NON APPLIQUÉ :**

```css
/* css/style.css — classes utilitaires à ajouter */
.w-full          { width: 100%; }
.h3-lg           { font-size: 1.5rem; margin-bottom: 16px; }
.msg-succes      { display: none; color: var(--color-primary); font-weight: 700; margin-top: 10px; }
.msg-succes.est-visible { display: block; }
.btn-chauffeur   { background: var(--color-driver); color: var(--color-secondary); }
```

```html
<!-- Avant -->
<button class="btn btn-primary btn-large mt-4"
        style="width: 100%; background: var(--color-driver); color: #0F172A !important;">

<!-- Après — même rendu, plus de !important, compatible CSP stricte -->
<button class="btn btn-large mt-4 w-full btn-chauffeur">
```

---

## QC-03 — Code mort : règle CSS vide, point d'entrée inexistant, fichier de test

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichiers** | `css/style.css:59-61`, `package.json:5`, `test.html`, `.htaccess:17` |

**Description.** Quatre vestiges confirmés :

```css
/* css/style.css:59-61 — règle entièrement vide */
html {
  /* Removed smooth scrolling to jump directly to anchor content */
}
```

```json
// package.json:5 — pointe vers un fichier supprimé
"main": "download_fonts.js",
```

```apache
# .htaccess:17 — protège 3 fichiers qui n'existent plus dans le dépôt
<FilesMatch "^(seo_update\.js|\.gitignore|fix\.js|download_fonts\.js|fix_links\.js)$">
```

`test.html` (14 lignes) est un bac à sable de débogage `event.target` / `event.currentTarget`, suivi par Git donc déployé, sans `lang`, sans `charset`, sans `<title>`, avec trois `console.log`.

**Conséquence possible.** Nuisance faible, mais chaque vestige coûte du temps de lecture au prochain développeur, qui doit vérifier s'il est encore utile. `test.html` est indexable (`robots.txt` autorise tout) et signale à un visiteur ou un attaquant que les artefacts de développement ne sont pas filtrés.

**Solution recommandée.** Supprimer `test.html`, supprimer la règle `html {}` vide, corriger `package.json:5` vers `tools/seo_update.js`, mettre à jour la liste `<FilesMatch>`, ajouter `test*.html` à `.gitignore`.

---

## QC-04 — Nomenclature incohérente : mélange français / anglais

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichiers** | `js/main.js:51`, `js/form-handler.js:17,21,80`, `js/gtranslate.js:8` |

**Description.** Le code alterne les deux langues au sein d'un même fichier :

```javascript
// js/form-handler.js — quatre variables françaises, une anglaise, dans la même fonction
const bouton = form.querySelector('button[type="submit"]');        // FR
const jetonCaptcha = form.querySelector('[name="h-captcha-response"]'); // FR
let history = JSON.parse(localStorage.getItem("alfaFormSubmissions")); // EN
const rateLimitWindow = 3 * 60 * 1000;                             // EN
let hasUppercaseEmail = false;                                     // EN
```

```javascript
// js/main.js:51 vs js/gtranslate.js:8 — même projet, conventions opposées
function fermerMenuMobile() { … }                    // FR
function doGTranslate(lang_pair, tentative = 0) { … } // EN + snake_case
```

`js/gtranslate.js` utilise en outre `snake_case` (`lang_pair`) alors que tout le reste du projet est en `camelCase`.

**Conséquence possible.** Aucune conséquence technique. Coût cognitif à la lecture et hésitation à chaque nouvelle variable. `js/gtranslate.js` est du code tiers recopié, ce qui explique sa divergence — mais cela mérite un commentaire signalant son origine.

**Solution recommandée.** Adopter le français pour tout le code propre au projet (majoritaire), et **isoler `js/gtranslate.js` comme code externe** avec un en-tête explicite :

```javascript
// js/gtranslate.js — proposition d'en-tête
/**
 * Code fourni par GTranslate — NE PAS reformater ni renommer.
 * Conserve volontairement la convention snake_case de l'original
 * pour rester alignable sur les mises à jour amont.
 * Source : https://gtranslate.io/
 */
```

---

## Points forts confirmés — qualité du code

- **Design system CSS exemplaire** — `css/style.css:4-48`, 30 variables sémantiques (couleurs, gradients, ombres, rayons, transitions). Nettement au-dessus de la moyenne.
- **`"use strict"`** dans `js/main.js:3` et `js/cookies-consent.js:1`.
- **Aucun `eval`, `new Function`, `document.write`** dans les 20 fichiers HTML/JS.
- **Sectionnement CSS par commentaires de bannière** cohérent et lisible sur les 1 442 lignes.
- **Chaînage optionnel et coalescence nulle** employés correctement — `js/cookies-consent.js:50,78,99,254` (`acceptAllButton?.`, `currentConsent?.analytics ?? false`).
- **`tools/seo_update.js` écrit dans `dist/`** et non sur les sources (lignes 77-107, commentaire explicite ligne 82). Choix délibéré et sain.
- **Zéro dépendance JavaScript côté client** — les 6 fichiers JS sont écrits à la main, aucun framework, aucun CDN.

---

# 2. STRUCTURE DU PROJET

## ST-01 — 142 images `temp_*` inutilisées : 50 % du dossier `assets/images/`

| | |
|---|---|
| **Priorité** | **ÉLEVÉ** |
| **Fichier** | `assets/images/temp_*.webp` — 142 fichiers |

**Description.** Mesure relevée :

```
$ ls assets/images/ | wc -l              → 284 fichiers
$ ls assets/images/ | grep -c "^temp_"   → 142 fichiers
$ grep -rn "temp_" --include=*.html --include=*.css --include=*.js .  → 0 référence
$ du -sh assets/images                   → 7,3 Mo
```

**Exactement la moitié** du dossier images est constituée de doublons `temp_` préfixés, **jamais référencés** par aucun HTML, CSS ou JS. Chaque image existe en quatre exemplaires : `nom.webp`, `nom-400.webp`, `temp_nom.webp`, `temp_nom-400.webp`. Sur les 284 fichiers, seuls **71 chemins uniques** sont réellement appelés.

**Conséquence possible.** Environ **3,6 Mo de fichiers morts** versionnés dans Git, transférés à chaque clone et publiés à chaque déploiement. Allongement des builds et des déploiements. Risque de confusion : un développeur qui édite `temp_logo.webp` en croyant modifier le logo ne verra aucun effet.

**Solution recommandée.** Supprimer les 142 fichiers `temp_*` et ajouter un motif de garde. Ces fichiers sont manifestement des sorties intermédiaires du pipeline `sharp` d'optimisation d'images.

```gitignore
# .gitignore — ajout proposé
assets/images/temp_*
```

> **Vérification à faire avant suppression** : confirmer que le pipeline d'optimisation (`sharp`) n'attend pas ces fichiers en entrée. Comparer quelques paires `nom.webp` / `temp_nom.webp` pour établir laquelle est la version finale.

---

## ST-02 — Fragmentation excessive du JavaScript : 5 fichiers, 5 requêtes, 505 lignes

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `js/interactions.js` (6 l.), `js/gtranslate.js` (58 l.), `js/main.js` (109 l.), `js/form-handler.js` (128 l.), `js/cookies-consent.js` (262 l.) |

**Description.** Chaque page charge **5 fichiers JavaScript** pour un total de 563 lignes. `js/interactions.js` contient 6 lignes pour une seule fonctionnalité :

```javascript
// js/interactions.js — fichier complet, 6 lignes, 1 requête HTTP
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll("[data-annee-courante]").forEach((el) => {
        el.textContent = String(new Date().getFullYear());
    });
});
```

Trois de ces fichiers posent chacun **leur propre écouteur `DOMContentLoaded`** (`main.js:5`, `form-handler.js:1`, `interactions.js:1`, `cookies-consent.js:13`) : quatre au total.

**Conséquence possible.** 5 requêtes HTTP au lieu d'une. En HTTP/2 le surcoût est modéré, mais chaque fichier consomme un aller-retour de latence — pénalisant sur les réseaux mobiles guinéens, qui sont la cible principale du site.

**Solution recommandée.** Fusionner `interactions.js` dans `main.js` (fonctionnalité triviale), conserver `cookies-consent.js` séparé (contrainte RGPD : doit pouvoir se charger indépendamment), conserver `gtranslate.js` séparé (code tiers). Cible : **3 fichiers**.

```html
<!-- Proposition : ordre unifié et déterministe sur les 13 pages -->
<script src="js/cookies-consent.js"></script>            <!-- RGPD : au plus tôt -->
<script src="js/main.js" defer></script>                 <!-- + interactions.js fusionné -->
<script src="js/form-handler.js" defer></script>         <!-- pages à formulaire uniquement -->
<script src="js/gtranslate.js" defer></script>           <!-- tiers -->
```

---

## ST-03 — Organisation des dossiers : correcte, deux ajustements

**Constat.** La structure actuelle est **saine et lisible** :

```
alfa_Website/
├── *.html              (14 pages à la racine — correct pour un site statique)
├── css/                (2 feuilles)
├── js/                 (5 scripts)
├── assets/
│   ├── fonts/          (30 woff2 + fonts.css)
│   └── images/         (284 fichiers, dont 142 morts → ST-01)
├── tools/              (1 script de build)
└── {vercel.json, netlify.toml, .htaccess}  (3 configs → ST-04)
```

**Deux ajustements proposés** (aucun n'est bloquant) :

1. `assets/images/` mélange trois natures : captures d'application (`Appclient*.webp`), photos de plats (`Poulet.webp`), et éléments d'interface (`logo.webp`). Des sous-dossiers `assets/images/app/`, `/plats/`, `/ui/` clarifieraient.
2. Le fichier `assets/fonts/.gitkeep` est devenu inutile — le dossier contient 31 fichiers.

---

## ST-04 — Trois configurations de plateforme coexistent avec des protections divergentes

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `vercel.json` (43 l.), `netlify.toml` (18 l.), `.htaccess` (20 l.) |

**Description.** Les trois fichiers émettent bien les **mêmes quatre en-têtes de sécurité** — cohérence à créditer. Mais leurs protections de fichiers divergent :

| Protection | `vercel.json` | `netlify.toml` | `.htaccess` |
|---|---|---|---|
| Blocage `/.git` | ✅ L26-30 | ✅ L9-13 | ✅ L16 |
| Blocage effectif de `seo_update.js` | ❌ mauvais chemin | ❌ mauvais chemin | ✅ par nom de base |
| Blocage `.gitignore` | ❌ | ❌ | ✅ L17 |
| Repli 404 | ⚠️ **soft-404** (voir SEO-01) | ❌ | ❌ |

Les règles Vercel et Netlify visent `/seo_update.js`, or le fichier réside en **`tools/seo_update.js`**. La directive Apache `<FilesMatch>`, elle, s'applique au nom de base quel que soit le répertoire : elle fonctionne. D'où l'asymétrie.

**Conséquence possible.** Un site n'est servi que par une plateforme. Les deux autres configurations sont du code mort qui donne une **fausse impression de couverture** : lire `.htaccess` fait conclure que `.gitignore` est protégé, alors qu'un déploiement Vercel le sert publiquement.

**Solution recommandée.** Identifier la plateforme réelle, **supprimer les deux configurations mortes**, consolider toutes les protections dans le fichier survivant. C'est un **prérequis** à toute correction d'en-tête HTTP.

```json
// vercel.json — proposition : viser le vrai chemin
"redirects": [
  { "source": "/.git/(.*)",  "destination": "/404.html", "permanent": false },
  { "source": "/tools/(.*)", "destination": "/404.html", "permanent": false }
]
```

> Meilleure approche encore : **exclure `tools/` de l'artefact publié** via `.vercelignore`. Ce qui n'est pas déployé ne peut pas fuir.

---

# 3. HTML

## HTML-01 — `smartLink()` appelée 7 fois, définie nulle part : la page de téléchargement est cassée

| | |
|---|---|
| **Priorité** | **🔴 CRITIQUE** |
| **Fichier** | `telechargement.html` |
| **Lignes** | 346, 402, 433, 617 (+ 3 gestionnaires apparentés) |

**Description.** Les boutons de téléchargement appellent une fonction inexistante :

```html
<!-- telechargement.html:346 -->
<a class="btn-store" onclick="smartLink('client', 'android'); return false;">
<!-- telechargement.html:402 -->
<a class="btn-store" onclick="smartLink('merchant', 'android'); return false;">
<!-- telechargement.html:433 -->
<a class="btn-store" onclick="smartLink('driver', 'android'); return false;">
```

```html
<!-- telechargement.html:616-617 — injectée dynamiquement, même problème -->
smartBanner.innerHTML =
  "Vous êtes sur Android. Téléchargez rapidement notre app sur Google Play ! "
+ "<a href=\"#\" onclick=\"smartLink('client', 'android')\">Télécharger</a>";
```

Vérification :

```
$ grep -rn "function smartLink\|smartLink *=" *.html js/*.js
(aucun résultat)
```

**Conséquence possible.** Chaque clic lève `Uncaught ReferenceError: smartLink is not defined`. Le `return false` **empêche toute navigation de repli**. Résultat : **rien ne se passe**. C'est la page dont le téléchargement est l'unique raison d'être, et elle est référencée depuis le bouton « Télécharger l'app » de l'en-tête des 13 pages. Perte de conversion totale sur le parcours principal du site.

**Solution recommandée.** La solution la plus robuste **supprime le JavaScript** : utiliser de vrais `href` vers le Play Store. Un lien fonctionne sans JS, est indexable, ouvrable dans un nouvel onglet, et copiable par l'utilisateur.

**Exemple de code corrigé — NON APPLIQUÉ :**

```html
<!-- Proposition A (recommandée) : de vrais liens, aucun JS -->
<a class="btn-store"
   href="https://play.google.com/store/apps/details?id=gn.alfa.client"
   target="_blank" rel="noopener noreferrer">
  Télécharger sur Google Play
</a>
```

```javascript
// Proposition B : si la détection Android/iOS doit être conservée,
// définir la fonction dans js/main.js. NON APPLIQUÉ.
const LIENS_APPS = {
  client:   { android: "https://play.google.com/store/apps/details?id=gn.alfa.client",
              ios:     "https://apps.apple.com/app/id0000000000" },
  merchant: { android: "https://play.google.com/store/apps/details?id=gn.alfa.merchant",
              ios:     null },
  driver:   { android: "https://play.google.com/store/apps/details?id=gn.alfa.driver",
              ios:     null },
};

function smartLink(typeApp, plateforme) {
  const url = LIENS_APPS[typeApp]?.[plateforme];   // table blanche : aucune URL arbitraire
  if (!url) {
    alert("Cette application n'est pas encore disponible sur cette plateforme.");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
```

> La table de correspondance `LIENS_APPS` est volontairement fermée : même si `typeApp` devenait un jour contrôlable par l'utilisateur (via un paramètre d'URL par exemple), aucune redirection arbitraire ne serait possible.

---

## HTML-02 — Balises `<input>` malformées : slash de fermeture suivi d'un attribut

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `contact.html:432,443,455`, `chauffeur.html:329,340`, `commercant.html`, `index.html` |

**Description.** Le slash auto-fermant est placé **avant** le dernier attribut :

```html
<!-- contact.html:425-432 -->
<input
  type="text" id="prenom" name="prenom" class="form-control" required
  placeholder="Votre prénom"
/ autocomplete="given-name">
<!--  ↑ le slash précède l'attribut au lieu de terminer la balise -->
```

**Conséquence possible.** **Le comportement du navigateur est correct** — c'est important de le préciser pour ne pas surestimer ce défaut. Selon l'algorithme d'analyse HTML5, un `/` non suivi immédiatement de `>` produit une erreur d'analyse `unexpected-solidus-in-tag`, le caractère est ignoré et l'attribut suivant est **bien appliqué**. L'autocomplétion fonctionne donc en pratique.

En revanche : le validateur du W3C signale une erreur sur chaque occurrence, ce qui **noie les vraies erreurs** dans le bruit et empêche d'utiliser la validation comme filet de sécurité en intégration continue. Le motif suggère aussi une insertion automatisée d'attributs mal calibrée, susceptible d'avoir produit d'autres dégâts ailleurs.

**Solution recommandée.**

```html
<!-- Proposition : slash en fin de balise, ou pas de slash du tout (HTML5 le tolère) -->
<input
  type="text" id="prenom" name="prenom" class="form-control" required
  placeholder="Votre prénom"
  autocomplete="given-name" />
```

---

## HTML-03 — Attribut `rel` dupliqué

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichier** | `index.html:1082-1085` |

```html
<a href="https://play.google.com/store"
   target="_blank" rel="noopener noreferrer"
   rel="noopener"                              <!-- ← second rel, ignoré -->
   class="store-btn">
```

**Conséquence.** Aucune : le parseur retient la **première** occurrence, `noopener noreferrer` s'applique bien. La protection contre le *tabnabbing* est effective. Défaut de propreté uniquement, signalé par le validateur.

**Solution.** Supprimer la ligne 1084.

---

## HTML-04 — Saut de niveau de titre : `h2` → `h4`

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichier** | `index.html` |
| **Lignes** | 678 (`<h2>`) puis 748 (`<h4>`) — aucun `<h3>` entre les deux |

```html
<!-- index.html:678 -->
<h2 class="section-title">Zones <span>desservies</span></h2>
…
<!-- index.html:748 — niveau 3 sauté -->
<h4>Prévenez-moi quand alfa arrive dans ma zone</h4>
```

**Conséquence possible.** Un utilisateur de lecteur d'écran qui navigue par titres (raccourci très utilisé) perçoit un trou dans la hiérarchie et peut croire avoir manqué une section. Signal de structure dégradé pour les moteurs de recherche. Vérifié : c'est le **seul** saut de niveau du site — les 13 pages ont par ailleurs un `<h1>` unique et une hiérarchie correcte.

**Solution recommandée.** Passer en `<h3>` — le rendu visuel se règle en CSS, sans changer l'apparence.

```html
<h3 class="notify-title">Prévenez-moi quand alfa arrive dans ma zone</h3>
```
```css
/* Conserve exactement la taille visuelle actuelle du h4 */
.notify-title { font-size: 1.1rem; }
```

---

## Points forts confirmés — HTML

- **Sémantique correcte sur les 13 pages** : `<header>`, `<nav>`, `<main id="main-content">`, `<section>`, `<footer>` — vérifié, 100 occurrences.
- **Un `<h1>` unique par page** — 13/13.
- **FAQ en `<details>` / `<summary>` natifs** (`index.html:1003-1043`) — accessible au clavier, fonctionne sans JavaScript, indexable. Excellent choix.
- **`<html lang="fr">`** sur les 13 pages de production.
- **`<meta name="viewport" content="width=device-width, initial-scale=1.0">`** — sans `maximum-scale` ni `user-scalable=no` : **le zoom n'est jamais bloqué**. Point d'accessibilité important souvent manqué.
- **Tous les `target="_blank"` portent `rel="noopener noreferrer"`** — 24 occurrences vérifiées.
- **Tous les champs de formulaire ont un `<label for>` associé**, y compris les champs visuellement masqués (`index.html:762` avec `class="sr-only"`).

---

# 4. CSS — Design system solide, cascade fragmentée

## CSS-01 — Points de rupture dupliqués et dispersés

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichier** | `css/style.css` |
| **Lignes** | 854, 885, 919, 1001, 1196, 1369, 1415 |

**Description.** Les 7 requêtes média sont éparpillées et **trois valeurs sont dupliquées** :

| Ligne | Requête | Doublon |
|---|---|---|
| 854 | `max-width: 992px` | ← 1ʳᵉ |
| 885 | `max-width: 992px` | ← **2ᵉ** |
| 919 | `max-width: 768px` | ← 1ʳᵉ |
| 1001 | `max-width: 768px` | ← **2ᵉ** |
| 1196 | `max-width: 992px` | ← **3ᵉ** |
| 1369 | `max-width: 480px` | unique |
| 1415 | `prefers-reduced-motion` | unique |

**Conséquence possible.** Pour comprendre le comportement d'un composant à 900 px de large, il faut lire trois blocs situés à 342 lignes d'écart. Risque élevé de règles contradictoires introduites sans s'en apercevoir — c'est probablement l'origine de la surenchère de `!important` (CSS-02). Aucun point de rupture au-delà de 1200 px : sur écran large, le contenu est simplement centré à `--container-width: 1200px`.

**Solution recommandée.** Ne pas réécrire le CSS. Regrouper mécaniquement les blocs de même point de rupture, du plus large au plus étroit, et **documenter l'échelle** en tête de fichier :

```css
/* css/style.css — proposition d'en-tête documentaire
   ÉCHELLE DE POINTS DE RUPTURE (mobile-last, max-width)
   ─────────────────────────────────────────────────────
   ≤ 1200px  large      (à créer si besoin)
   ≤  992px  tablette   → bascule du menu en burger
   ≤  768px  mobile L
   ≤  480px  mobile S
   Toute nouvelle règle responsive va dans le bloc existant correspondant. */
```

---

## CSS-02 — Sélecteur universel et surenchère de `!important` dans le bloc mobile

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichier** | `css/style.css:1369-1402` |

```css
@media (max-width: 480px) {
    * {                          /* ← applique max-width à CHAQUE élément du document */
        max-width: 100%;
        box-sizing: border-box;  /* ← déjà défini ligne 53-57 pour * : redondant */
    }
    .footer-links-grid, .services-grid, .features-grid, .stats-grid {
        grid-template-columns: 1fr !important;
    }
    h1 { font-size: 2rem !important;   word-wrap: break-word; }
    h2 { font-size: 1.5rem !important; word-wrap: break-word; }
}
```

**Description.** Trois problèmes cumulés dans un même bloc de 33 lignes :

1. `* { max-width: 100% }` s'applique à **tous** les éléments, y compris ceux qui doivent légitimement déborder (carrousels, éléments décoratifs positionnés, contenu de la modale Google Translate).
2. `box-sizing: border-box` est déjà déclaré pour `*` aux lignes 53-57 — redondance pure.
3. Quatre `!important` pour surcharger des règles… définies dans le même fichier. Le symptôme d'un conflit de cascade non résolu, et non un besoin réel.

**Conséquence possible.** Le sélecteur universel force le moteur de rendu à recalculer une contrainte de largeur sur chaque nœud — coût mesurable sur les téléphones d'entrée de gamme, qui sont le parc dominant en Guinée. Les `!important` créent un plafond de spécificité : toute correction future devra elle-même employer `!important`, ce qui aggrave la dette à chaque itération.

**Solution recommandée.** Cibler les conteneurs réellement concernés et supprimer les `!important` en réglant le conflit à la source.

```css
/* Proposition — même résultat visuel, sans sélecteur universel ni !important */
@media (max-width: 480px) {
    /* Cibler les conteneurs, pas tous les nœuds */
    .container, .hero, section, .card, .footer { max-width: 100%; }

    /* Les grilles sont déjà à 1 colonne si la déclaration de base
       utilise auto-fit — plus besoin de !important */
    .footer-links-grid, .services-grid,
    .features-grid, .stats-grid { grid-template-columns: 1fr; }

    h1 { font-size: 2rem;   overflow-wrap: break-word; }  /* propriété standard */
    h2 { font-size: 1.5rem; overflow-wrap: break-word; }
}
```

```css
/* Et à la source, pour rendre les !important inutiles : */
.services-grid { grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); }
```

> `min(280px, 100%)` supprime à lui seul la plupart des dépassements horizontaux sur petit écran, ce qui rend le `* { max-width: 100% }` superflu.

---

## CSS-03 — `outline: none` bat `:focus-visible` par spécificité

| | |
|---|---|
| **Priorité** | **ÉLEVÉ** (accessibilité — WCAG 2.4.7 niveau AA) |
| **Fichier** | `css/style.css:1182` et `1186-1188` vs `1360-1363` |

**Description.** Le projet définit un excellent indicateur de focus global :

```css
/* css/style.css:1360-1363 — bonne pratique */
:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}
```

Mais une règle antérieure le neutralise sur le champ du formulaire d'alerte :

```css
/* css/style.css:1178-1188 */
.notify-form input {
    …
    outline: none;              /* ← ligne 1182 */
    transition: border-color 0.2s;
}
.notify-form input:focus {
    border-color: var(--color-primary);   /* seul retour visuel restant */
}
```

**Calcul de spécificité** — `.notify-form input` vaut (0, 1, 1) : une classe + un type. `:focus-visible` vaut (0, 1, 0) : une pseudo-classe. **La règle `outline: none` gagne**, même si `:focus-visible` apparaît 178 lignes plus loin dans le fichier — la spécificité prime sur l'ordre.

**Conséquence possible.** Le champ « Votre adresse e-mail ou numéro de téléphone » du formulaire d'alerte (`index.html:763`) **n'a aucun contour de focus au clavier**. Le seul retour est un changement de couleur de bordure — insuffisant au regard du critère WCAG 2.4.11 (*Focus Appearance*) et rigoureusement invisible pour un utilisateur atteint de deutéranopie, la forme de daltonisme la plus répandue. Un utilisateur naviguant à la tabulation perd la trace de sa position.

**Solution recommandée.** Ne pas supprimer le `outline: none` (il évite le contour bleu natif au clic souris), mais restaurer explicitement le contour pour le focus clavier avec une spécificité suffisante :

```css
/* Proposition — NON APPLIQUÉE */
.notify-form input {
    /* … inchangé … */
    outline: none;                    /* neutralise le contour natif au clic */
}

.notify-form input:focus-visible {    /* spécificité (0,2,1) : gagne */
    outline: 3px solid var(--color-primary);
    outline-offset: 3px;
    border-color: var(--color-primary);
}
```

---

## CSS-04 — Contraste `--text-muted` à la limite exacte du seuil AA

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichier** | `css/style.css:26` et `17` |

**Description.** Calcul de contraste effectué sur les valeurs réelles du design system :

| Couleurs | Rapport | Seuil AA | Verdict |
|---|---|---|---|
| `--text-muted: #64748B` sur `--color-background: #F8FAFC` | **4,55 : 1** | 4,5 : 1 | ✅ **Passe — de 0,05** |
| `--text-main: #334155` sur `#F8FAFC` | ~10,3 : 1 | 4,5 : 1 | ✅ Excellent |
| `--text-heading: #0F172A` sur `#F8FAFC` | ~16,4 : 1 | 4,5 : 1 | ✅ Excellent |
| `#0F172A` sur `--color-driver: #F59E0B` (bouton chauffeur) | **8,31 : 1** | 4,5 : 1 | ✅ Excellent |
| `--color-primary: #047857` sur blanc | ~5,2 : 1 | 4,5 : 1 | ✅ Passe |

**Conséquence possible.** `--text-muted` est conforme mais avec une marge de 1 %. Toute retouche du fond (passage de `#F8FAFC` à `#FFFFFF` ou l'inverse) ou usage de cette couleur sur une surface légèrement plus claire fait basculer sous le seuil. La classe `.text-muted` est employée abondamment (descriptions de cartes, mentions du pied de page).

**Note importante** : le choix `#0F172A` sur ambre `#F59E0B` pour le bouton chauffeur (`chauffeur.html:422`) est **très bien vu** — l'ambre sur texte blanc n'aurait donné que 2,15 : 1, un échec net. L'auteur a manifestement vérifié ce point.

**Solution recommandée.** Assombrir légèrement `--text-muted` pour prendre une marge de sécurité, sans changement visuel perceptible :

```css
/* css/style.css:26 — proposition */
--text-muted: #57657A;   /* 5,4:1 sur #F8FAFC — au lieu de #64748B (4,55:1) */
```

---

## Points forts confirmés — CSS

- **`@media (prefers-reduced-motion: reduce)`** (`1415-1424`) — respecte le réglage système, désactive les animations de carrousel et le `status-dot`. Rarement implémenté, et bien fait ici.
- **`@supports not (aspect-ratio: 1)`** (`1432-1442`) — repli `margin-left` pour les navigateurs sans `gap` en Flexbox (Safari < 14.1, Android < 6), avec un commentaire expliquant le choix du test de détection. Démarche professionnelle.
- **`:focus-visible` global** (`1360-1363`) — contour 3 px avec décalage.
- **`:focus-within` sur les menus déroulants** (`1071-1075`) — navigation clavier fonctionnelle sur le sélecteur de langue.
- **`scroll-margin-top: calc(var(--hauteur-header) + 20px)`** (`1355-1357`) — corrige le recouvrement des ancres par l'en-tête fixe. Détail soigné.
- **`.sr-only`** techniquement correcte (`1404-1412`) — la technique `clip: rect(0,0,0,0)` est la bonne.
- **`-webkit-backdrop-filter`** systématiquement doublé avec la version standard (`115-116`).

---

# 5. JAVASCRIPT

## JS-01 — Le menu mobile se ferme tout seul quand la barre d'adresse se replie

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** |
| **Fichier** | `js/main.js` |
| **Lignes** | 57-65 |

**Description.**

```javascript
// js/main.js:57-65
window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
        navLinks.removeAttribute("style");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
    } else {
        fermerMenuMobile();      // ← appelé à CHAQUE resize sous 992px
    }
});
```

Sur mobile, l'événement `resize` ne se déclenche pas seulement lors d'une rotation d'écran. Il se déclenche aussi :

- quand la barre d'adresse du navigateur se replie ou se déploie au défilement (iOS Safari, Chrome Android) — la hauteur du *viewport* change ;
- quand le clavier virtuel s'ouvre ou se ferme ;
- lors de tout changement d'orientation.

**Conséquence possible.** Scénario reproductible : l'utilisateur ouvre le menu burger, fait défiler légèrement la page pour atteindre un lien plus bas → la barre d'adresse se replie → `resize` se déclenche → `fermerMenuMobile()` **ferme le menu sous ses doigts**. Le menu paraît instable et « buggé » sur le parcours de navigation principal, sur la plateforme majoritaire du site. Ce défaut est d'autant plus pénalisant que le menu contient les liens vers les pages de conversion (`chauffeur.html`, `commercant.html`, `telechargement.html`).

Second effet : aucun *debounce*. Sur un défilement continu, `resize` peut se déclencher des dizaines de fois par seconde, chaque appel écrivant dans le DOM (`removeAttribute`, `setAttribute`, `innerHTML`) — travail de rendu inutile sur des appareils modestes.

**Solution recommandée.** Ne réagir qu'au **franchissement effectif du point de rupture**, pas à tout changement de dimension. `matchMedia` est l'outil exact pour cela : il ne se déclenche que lorsque la condition média change réellement d'état.

**Exemple de code corrigé — NON APPLIQUÉ :**

```javascript
// js/main.js — proposition de remplacement des lignes 57-65
const requeteBureau = window.matchMedia("(min-width: 993px)");

const gererChangementDeRupture = (evenement) => {
    if (evenement.matches) {                 // on passe en affichage bureau
        navLinks.removeAttribute("style");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.innerHTML = ICONE_BURGER;
    } else {                                 // on passe en affichage mobile
        fermerMenuMobile();
    }
};

requeteBureau.addEventListener("change", gererChangementDeRupture);
```

> **Pourquoi c'est la bonne correction** : `matchMedia` ne déclenche `change` que lorsque la largeur franchit 993 px. Un repli de la barre d'adresse ne modifie que la **hauteur** : aucun événement, le menu reste ouvert. Le *debounce* devient inutile, la cause est éliminée plutôt que masquée.

---

## JS-02 — Cinq fonctions globales exposées sur `window`

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `js/gtranslate.js:1,8,47`, `nourriture.html:1062,1075`, `telechargement.html` |

**Description.** Cinq fonctions vivent dans la portée globale, car elles doivent être atteignables depuis des attributs `onclick` :

| Fonction | Déclarée dans | Appelée par |
|---|---|---|
| `googleTranslateElementInit2` | `js/gtranslate.js:1` | rappel de l'API Google (obligatoire) |
| `doGTranslate` | `js/gtranslate.js:8` | `onclick` × 3 sur les 13 pages (39 appels) |
| `GTranslateFireEvent` | `js/gtranslate.js:47` | interne |
| `openModal` | `nourriture.html:1062` | `onclick` × 6 |
| `closeModal` | `nourriture.html:1075` | `onclick` × 12 |
| `smartLink` | **nulle part** | `onclick` × 7 → **HTML-01** |

**Conséquence possible.** Risque de collision de noms avec un script tiers. `doGTranslate` et `GTranslateFireEvent` sont particulièrement exposés : ils vivent dans le même espace de noms global que le script Google Translate lui-même. Les fonctions globales sont par ailleurs incompatibles avec une CSP stricte (`script-src` sans `'unsafe-inline'`), car les attributs `onclick` sont du script en ligne — ce qui bloquera le durcissement de sécurité recommandé.

**Solution recommandée.** Remplacer les attributs `onclick` par une délégation d'événements fondée sur des attributs `data-*`. Le comportement reste identique, le code devient compatible CSP, et rien ne fuit dans `window`.

**Exemple de code corrigé — NON APPLIQUÉ :**

```html
<!-- Avant — index.html:168-170 -->
<button type="button" onclick="doGTranslate('fr|en');" class="lang-option">English</button>

<!-- Après — aucun script en ligne -->
<button type="button" data-traduire="fr|en" class="lang-option">English</button>
```

```javascript
// js/gtranslate.js — proposition : un seul écouteur délégué, portée fermée
(() => {
  "use strict";

  document.addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-traduire]");
    if (bouton) doGTranslate(bouton.dataset.traduire);
  });

  // googleTranslateElementInit2 doit rester global : l'API Google l'exige
  window.googleTranslateElementInit2 = function () {
    new google.translate.TranslateElement(
      { pageLanguage: "fr", autoDisplay: false },
      "google_translate_element2"
    );
  };

  function doGTranslate(lang_pair, tentative = 0) { /* … inchangé … */ }
  function GTranslateFireEvent(element, event)    { /* … inchangé … */ }
})();
```

---

## JS-03 — Sondage récursif sans annulation dans `doGTranslate`

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichier** | `js/gtranslate.js:8-45` |

**Description.**

```javascript
// js/gtranslate.js:20-34
if (document.getElementById("google_translate_element2") == null || … ) {
    if (tentative >= 20) {
      console.warn("Google Translate indisponible après 20 tentatives.");
      return;
    }
    setTimeout(function () {
      doGTranslate(lang_pair, tentative + 1);
    }, 500);
}
```

**Conséquence possible.** Le garde-fou `tentative >= 20` est **bien présent** — c'est déjà mieux que la version d'origine de ce script, qui bouclait indéfiniment. Deux limites subsistent :

1. **Aucune annulation** : si l'utilisateur clique successivement sur « English » puis « 中文 » puis « Français », **trois chaînes de sondage indépendantes** tournent en parallèle pendant 10 secondes, et la dernière à aboutir gagne — pas forcément celle demandée en dernier. Comportement non déterministe.
2. Jusqu'à **10 secondes** de sondage silencieux (20 × 500 ms). L'utilisateur clique sur une langue et rien ne se passe, sans aucun retour visuel.

**Solution recommandée.** Mémoriser l'identifiant du minuteur pour annuler la chaîne précédente, et donner un retour visuel.

```javascript
// Proposition — NON APPLIQUÉE
let minuteurTraduction = null;

function doGTranslate(lang_pair, tentative = 0) {
  if (tentative === 0 && minuteurTraduction) {
    clearTimeout(minuteurTraduction);      // annule toute chaîne en cours
    minuteurTraduction = null;
  }
  if (lang_pair.value) lang_pair = lang_pair.value;
  if (lang_pair === "") return;

  /* … recherche de teCombo, inchangée … */

  if (widgetIndisponible) {
    if (tentative >= 20) {
      console.warn("Google Translate indisponible après 20 tentatives.");
      document.documentElement.classList.remove("is-translating");
      return;
    }
    document.documentElement.classList.add("is-translating");   // retour visuel
    minuteurTraduction = setTimeout(
      () => doGTranslate(lang_pair, tentative + 1), 500
    );
    return;
  }
  document.documentElement.classList.remove("is-translating");
  /* … application de la traduction, inchangée … */
}
```

---

## JS-04 — Détection de champ e-mail par heuristique fragile

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichier** | `js/form-handler.js:43` |

```javascript
// js/form-handler.js:43
const isEmailField = input.type === 'email'
                  || input.name === 'email'
                  || (input.value && input.value.includes('@'));
```

**Description.** La troisième condition classe comme « champ e-mail » **tout champ dont la valeur contient un `@` »**, quel que soit son type.

**Conséquence possible.** Sur `contact.html`, un utilisateur qui écrit dans le champ `message` : « Contactez-moi @ mon bureau » ou « Mon pseudo Instagram est @alfa_guinee » verra son message **refusé** avec le libellé trompeur *« Veuillez saisir votre e-mail en minuscules uniquement »* — parce que le message contient une majuscule et un `@`. Le formulaire bloque sans que l'utilisateur puisse comprendre pourquoi. Perte de message légitime sur le formulaire de contact principal.

**Solution recommandée.** Se limiter aux marqueurs explicites, et confier la validation de format à HTML5.

```javascript
// Proposition — NON APPLIQUÉE
const estChampEmail = input.type === "email"
                   || input.name === "email"
                   || input.dataset.valider === "email";   // opt-in explicite
```

```html
<!-- index.html:763 — le champ mixte e-mail/téléphone déclare son intention -->
<input type="text" id="notify-contact" name="contact" data-valider="email"
       autocomplete="email" inputmode="email" required />
```

---

## JS-05 — `alert()` comme unique canal d'erreur

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichier** | `js/form-handler.js:26,85,116,122` |

```javascript
// js/form-handler.js:122
alert("Une erreur s'est produite : " + err.message);
```

**Description.** Quatre `alert()` bloquants servent de retour utilisateur. Note de sécurité : `alert()` affiche du **texte brut**, donc l'interpolation de `err.message` (issu de la réponse de l'API Web3Forms) **ne présente aucun risque XSS** — il ne faut pas surestimer ce point.

**Conséquence possible.** L'expérience est datée et non stylable : la boîte native bloque le fil d'exécution, s'affiche hors du design du site, et n'est pas annoncée comme une erreur de formulaire aux lecteurs d'écran. Le projet dispose déjà d'un mécanisme d'erreur en ligne bien meilleur (`js/form-handler.js:55-64`, avec `.email-error-msg`) — les `alert()` sont une incohérence interne.

**Solution recommandée.** Réutiliser le mécanisme d'erreur en ligne déjà écrit, en ajoutant `role="alert"` pour l'annonce vocale.

```javascript
// Proposition — NON APPLIQUÉE : réutilise le motif des lignes 55-64
function afficherErreurFormulaire(form, message) {
  form.querySelectorAll(".form-error-global").forEach((el) => el.remove());
  const bloc = document.createElement("p");
  bloc.className = "form-error-global";
  bloc.setAttribute("role", "alert");        // annoncé par les lecteurs d'écran
  bloc.textContent = message;                // textContent : aucun risque d'injection
  form.prepend(bloc);
  bloc.scrollIntoView({ behavior: "smooth", block: "center" });
}
```

---

## Points forts confirmés — JavaScript

- **`js/form-handler.js:3-11`** — purge de l'historique périmé au chargement, entourée d'un `try/catch`. Bonne hygiène.
- **`js/cookies-consent.js`** — architecture propre : lecture, écriture et application du consentement séparées ; `try/catch` autour de chaque accès à `localStorage` (lignes 124-134, 140-162) ; garde-fous d'idempotence (`if (document.getElementById("alfa-google-analytics")) return;` ligne 190).
- **`IntersectionObserver`** pour les animations au défilement (`js/main.js:83-95`) avec `observer.unobserve(entry.target)` après déclenchement — pas de fuite d'observateurs.
- **`encodeURIComponent`** appliqué à l'identifiant Google Analytics avant construction d'URL (`js/cookies-consent.js:200`) — réflexe correct.
- **Aucune journalisation de donnée personnelle** — les seuls appels console portent sur des messages d'erreur génériques.
- **`defer`** correctement appliqué aux scripts non critiques.

---

# 6. CYBERSÉCURITÉ

> Un audit de sécurité complet et détaillé de ce dépôt a été produit le même jour :
> **`RAPPORT_CYBERSECURITE_ALFA_WEBSITE_2026-07-30.md`** (11 vulnérabilités, 8 observations, plan de correction en 24 points).
> Cette section en donne la synthèse pour rendre la présente revue autonome, sans dupliquer les scénarios d'exploitation détaillés.

## Synthèse : aucune faille critique

| Gravité | Nombre | Constats |
|---|---|---|
| 🔴 CRITIQUE | **0** | — |
| 🟠 ÉLEVÉE | **2** | Absence totale de CSP ; canal formulaire Web3Forms détournable |
| 🟡 MOYENNE | **2** | Google Translate hors consentement ; retrait du consentement inopérant |
| 🔵 FAIBLE | **7** | En-têtes modernes absents, `test.html` en production, `tools/` non protégé… |

**L'architecture statique élimine par construction** : injection SQL et NoSQL, injection de commande, SSRF, XXE, désérialisation, traversée de répertoire, IDOR, contrôle d'accès cassé, gestion de session. Aucune base de données, aucun code serveur, aucune authentification, aucun compte utilisateur.

## SEC-A — Aucune Content-Security-Policy sur l'ensemble du dépôt

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** |
| **Fichiers** | `vercel.json:2-23`, `netlify.toml:1-7`, `.htaccess:1-13`, les 13 pages HTML |

```
$ grep -rniE "Content-Security-Policy|http-equiv" --include=*.html --include=*.json --include=*.toml --include=.htaccess .
(aucun résultat)
```

**Description.** Deux scripts tiers obtiennent un accès total en lecture et écriture au DOM de pages qui collectent des données personnelles :

```html
<!-- index.html:1420 et 1428 — sans integrity, sans CSP pour les encadrer -->
<script src="https://web3forms.com/client/script.js" async defer></script>
<script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"></script>
```

Google Translate **réécrit intégralement le DOM** pour traduire — y compris `chauffeur.html` et `commercant.html`, qui collectent nom, prénom, téléphone, ville.

**Conséquence possible.** En cas de compromission de l'un des deux fournisseurs, rien ne restreint `connect-src` : du code injecté pourrait lire `new FormData(document.getElementById('driverForm'))` et l'émettre vers un serveur tiers, silencieusement. Aucune directive `form-action` n'empêche non plus la réécriture de la destination d'un formulaire.

**Solution recommandée.** Déployer d'abord en `Content-Security-Policy-Report-Only` pendant 7 à 14 jours, puis basculer en mode bloquant. La directive décisive est **`connect-src`**.

```json
// vercel.json — à ajouter dans "headers". NON APPLIQUÉ.
{
  "key": "Content-Security-Policy-Report-Only",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://web3forms.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://www.gstatic.com; img-src 'self' data: https://translate.googleapis.com https://*.gstatic.com; font-src 'self'; connect-src 'self' https://api.web3forms.com https://translate.googleapis.com https://*.hcaptcha.com; frame-src https://*.hcaptcha.com; form-action 'self' https://api.web3forms.com; frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
}
```

> **Attention — dépendance avec QC-02 et JS-02** : une CSP stricte interdit `'unsafe-inline'`. Les 246 attributs `style="…"` et les 39+ attributs `onclick` devront être extraits **avant** de pouvoir durcir la politique. C'est la raison pour laquelle QC-02 et JS-02, qui paraissent de simples questions de propreté, conditionnent en réalité le renforcement de la sécurité.

## SEC-B — Clé Web3Forms et champs cachés pilotables par le client

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** |
| **Fichiers** | `contact.html:409-421`, `chauffeur.html:306-318`, `commercant.html:286-298`, `index.html:749-760` |

```html
<!-- contact.html:411-421 — le sujet et l'expéditeur affiché sont fournis par le client -->
<input type="hidden" name="access_key" value="003e9773-…-…cf9b" />
<input type="hidden" name="subject"   value="Nouveau message depuis le site Alfa (Contact)" />
<input type="hidden" name="from_name" value="Alfa Website" />
```

**Description.** La clé d'accès Web3Forms est **publique par conception** — la signaler comme un secret exposé serait un faux positif. Le risque réel est différent : **tout le contenu de l'e-mail reçu par alfa est fourni par le client, y compris son sujet et son expéditeur affiché**. Le garde-fou hCaptcha de `js/form-handler.js:25` ne s'exécute que dans le navigateur ; une requête forgée hors navigateur ne le traverse jamais.

**Conséquence possible.** Un tiers peut adresser à la boîte de contact d'alfa un e-mail de contenu arbitraire, affiché comme provenant du site officiel — phishing interne avec usurpation de la marque. En volume, les vraies candidatures chauffeurs et commerçants sont noyées.

**Solution recommandée** — par ordre d'efficacité :

1. **Tableau de bord Web3Forms** : activer **« Require Captcha »** et **restreindre les domaines autorisés** à `alfa.com.gn`. Ces deux réglages ferment le scénario à eux seuls, **sans aucune modification de code**. 20 minutes.
2. Utiliser **une clé distincte par formulaire** pour pouvoir révoquer un canal abusé sans casser les trois autres.
3. À moyen terme : interposer une fonction serverless qui détient la clé en variable d'environnement et vérifie le jeton hCaptcha côté serveur.

## SEC-C — Le garde-fou captcha est en « échec ouvert »

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichier** | `js/form-handler.js:20-28` |

```javascript
const jetonCaptcha = form.querySelector('[name="h-captcha-response"]');
if (form.querySelector('.h-captcha') && jetonCaptcha && !jetonCaptcha.value) {
  alert("Veuillez valider le contrôle anti-robot avant d'envoyer.");
  return;
}
```

**Description.** Les trois conditions sont cumulatives. Si le chargement de `web3forms.com/client/script.js` échoue — coupure réseau, bloqueur de publicité, indisponibilité du CDN — le champ `h-captcha-response` n'est jamais créé, `jetonCaptcha` vaut `null`, **la condition entière est fausse et l'envoi est autorisé sans captcha**.

**Solution recommandée.** Inverser la logique en « échec fermé » :

```javascript
// Proposition — NON APPLIQUÉE
const conteneurCaptcha = form.querySelector(".h-captcha");
if (conteneurCaptcha) {
  const jeton = form.querySelector('[name="h-captcha-response"]');
  if (!jeton || !jeton.value) {          // jeton absent OU vide → on bloque
    alert("Le contrôle anti-robot n'a pas pu être chargé ou validé. "
        + "Vérifiez votre connexion et réessayez.");
    return;
  }
}
```

## Vérifications de sécurité négatives (points forts)

```
$ grep -rnaEo "(sk_live|AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{36}
             |BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|password\s*[:=])" .
(aucun résultat)

$ git log --all --name-only | grep -iE '\.env|\.pem|\.key|serviceAccount|secret'
(aucun résultat)

$ npm audit --json → "total": 0
```

- **Aucun secret** dans le code ni dans l'historique Git complet. `.gitignore` couvre `.env*`, `*.pem`, `*.key`, `serviceAccountKey.json`, `firebase-adminsdk-*.json`.
- **`npm audit` : 0 vulnérabilité** sur 60 paquets. **Aucune dépendance npm n'atteint le navigateur** — surface d'attaque client par les dépendances : nulle.
- **Aucune XSS.** Le cas d'apparence (`aide.html:939`, surbrillance de recherche par `innerHTML`) a été analysé et écarté : la chaîne de remplacement `"<mark>$1</mark>"` est un littéral, et `$1` est une sous-chaîne du texte statique de confiance, jamais la saisie utilisateur. Seules deux balises inertes sont injectées.
- **Aucune redirection ouverte, aucun `postMessage`, aucun en-tête CORS permissif, aucun contenu mixte.**
- **4 en-têtes de sécurité présents et bien valorisés** : HSTS (1 an, `includeSubDomains`, `preload`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

# 7. PERFORMANCE — 68/100

## PERF-01 — L'attribut `sizes` est identique sur les 94 images, quelle que soit leur taille réelle

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** |
| **Fichiers** | Les 13 pages — 94 balises `<img>` |
| **Lignes** | `index.html:103, 506, 682, 1153` et 90 autres |

**Description.** La même valeur est recopiée partout, sans rapport avec la largeur d'affichage effective :

```html
<!-- index.html:103 — LOGO D'EN-TÊTE, affiché à ~40 px de large -->
<img decoding="async" width="1254" height="1254"
     src="assets/images/logo.webp"
     srcset="assets/images/logo-400.webp 400w"
     sizes="(max-width: 480px) 100vw, (max-width: 992px) 50vw, 300px"
     alt="" class="header-logo-img" />

<!-- index.html:682 — CARTE, affichée à ~600 px : même sizes -->
<img … src="assets/images/map-conakry.webp"
     srcset="assets/images/map-conakry-400.webp 400w"
     sizes="(max-width: 480px) 100vw, (max-width: 992px) 50vw, 300px" … />
```

Deux problèmes distincts se cumulent :

1. **`sizes` mensonger.** Le navigateur est informé que le logo occupera **100 % de la largeur du viewport** sur mobile. Pour un logo de 40 px, l'écart est d'un facteur 10. Les attributs `width="1254" height="1254"` déclarés confirment que l'image source est un carré de 1254 px pour un rendu de 40 px.

2. **`srcset` à candidat unique.** Chaque `srcset` ne contient qu'une seule entrée (`-400.webp 400w`). Or, selon la spécification HTML, lorsque `srcset` emploie des descripteurs `w`, l'attribut `src` **n'est pas ajouté à l'ensemble des candidats**. Conséquence : sur tout navigateur moderne, la version `-400.webp` est **toujours** choisie, et les images pleine taille (`logo.webp`, `map-conakry.webp`…) ne sont **jamais servies**.

**Conséquence possible.** Deux effets opposés, tous deux négatifs :

- **~1,8 Mo d'images pleine taille versionnées et déployées pour rien** — elles ne sont téléchargées que par des navigateurs sans support de `srcset` (part de marché résiduelle).
- **Qualité dégradée sur écran haute densité** : un emplacement CSS de 300 px sur un écran à densité ×2 réclame 600 px de source. Le navigateur ne dispose que du fichier 400 px et l'étire → images visiblement floues sur la majorité des smartphones récents, y compris le milieu de gamme Android dominant en Guinée.

**Solution recommandée.** Corriger `sizes` pour refléter la mise en page réelle et fournir **au moins deux candidats** par image afin que le navigateur puisse arbitrer.

**Exemple de code corrigé — NON APPLIQUÉ :**

```html
<!-- Logo : petit et de taille fixe → ni srcset ni sizes ne sont utiles -->
<img src="assets/images/logo-400.webp"
     width="40" height="40"
     alt="" class="header-logo-img" decoding="async" />

<!-- Carte : deux candidats réels, sizes conforme à la mise en page -->
<img src="assets/images/map-conakry.webp"
     srcset="assets/images/map-conakry-400.webp 400w,
             assets/images/map-conakry.webp     800w"
     sizes="(max-width: 768px) 100vw, 600px"
     width="600" height="450"
     alt="Carte de Conakry" class="map-img"
     loading="lazy" decoding="async" />
```

> **Vérification préalable** : mesurer la largeur réelle des images pleine taille (`identify` ou l'onglet Réseau) pour écrire des descripteurs `w` exacts. Un descripteur faux est pire que pas de `srcset` du tout.

---

## PERF-02 — La police du titre principal (LCP) n'est pas préchargée

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `index.html:91`, `assets/fonts/fonts.css:57-62` et `210-216` |

**Description.** Un seul fichier de police est préchargé :

```html
<!-- index.html:91 -->
<link rel="preload" href="assets/fonts/font-7.woff2" as="font" type="font/woff2" crossorigin>
```

Or, d'après `assets/fonts/fonts.css` :

| Fichier | Famille | Graisse | Plage Unicode |
|---|---|---|---|
| `font-7.woff2` | **Inter** | 400 | latin de base (L57-62) — **préchargé** |
| `font-24.woff2` | **Poppins** | 500 | latin de base (L210-216) — non préchargé |
| `font-27.woff2` | **Poppins** | 700 | latin de base — non préchargé |

Et d'après `css/style.css:71-75`, **tous les titres emploient Poppins** :

```css
h1, h2, h3, h4 {
    font-family: 'Poppins', sans-serif;
}
```

L'élément LCP de la page d'accueil est très probablement le `<h1 class="hero-title">` (`index.html:199`) — rendu en **Poppins**, dont la police n'est pas préchargée.

**Conséquence possible.** Avec `font-display: swap` (correctement défini), le titre s'affiche d'abord dans la police de repli, puis bascule vers Poppins une fois le fichier arrivé. Ce basculement provoque un décalage visuel (**CLS**) sur l'élément le plus grand de l'écran, et retarde le **LCP** de la durée de téléchargement de la police. C'est précisément l'élément qu'il fallait précharger.

**Solution recommandée.** Précharger la police du titre en plus de celle du corps de texte — deux fichiers au maximum, pour ne pas saturer la bande passante initiale.

```html
<!-- Proposition — NON APPLIQUÉE -->
<link rel="preload" href="assets/fonts/font-24.woff2" as="font" type="font/woff2" crossorigin>
<!-- Poppins 500 latin : police du <h1> = élément LCP -->
<link rel="preload" href="assets/fonts/font-7.woff2"  as="font" type="font/woff2" crossorigin>
<!-- Inter 400 latin : corps de texte (déjà en place) -->
```

> **Vérifier d'abord** quelle graisse de Poppins le `<h1>` utilise réellement (500 ou 700) via l'onglet Réseau, et ne précharger que celle-là.

---

## PERF-03 — Aucun `fetchpriority="high"` sur l'image de héros

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `index.html`, `nourriture.html`, `chauffeur.html`, `commercant.html`, `livraison.html` |

**Description.** Vérifié : aucune occurrence de `fetchpriority` dans le dépôt. Les images de la zone visible sans défilement sont téléchargées à la priorité par défaut, en concurrence avec la vingtaine de ressources de la page.

**Conséquence possible.** Le LCP est retardé de plusieurs centaines de millisecondes sur connexion mobile lente — le profil dominant du public cible. `fetchpriority="high"` est un attribut à coût nul, largement pris en charge (Chrome, Edge, Safari 17+), ignoré sans dommage par les navigateurs plus anciens.

**Solution recommandée.**

```html
<!-- Proposition : sur la SEULE image LCP de chaque page. NON APPLIQUÉE. -->
<img src="assets/images/food-delivery.webp"
     srcset="assets/images/food-delivery-400.webp 400w,
             assets/images/food-delivery.webp     900w"
     sizes="(max-width: 768px) 100vw, 500px"
     width="900" height="600"
     alt="Livraison de repas à Conakry"
     fetchpriority="high"          <!-- priorité maximale -->
     decoding="async" />
     <!-- SURTOUT PAS loading="lazy" sur l'image LCP -->
```

> Règle : **une seule** image par page en `fetchpriority="high"`. Au-delà, l'attribut perd tout effet en diluant les priorités.

---

## PERF-04 — 3,6 Mo d'images mortes déployées

Voir **ST-01**. 142 fichiers `temp_*.webp`, zéro référence, la moitié du dossier `assets/images/`.

---

## Points forts confirmés — performance

- **Toutes les images sont en WebP**, et **individuellement légères** : la plus lourde du projet pèse **60 Ko**, la grande majorité entre 20 et 50 Ko. Le travail d'optimisation a été réellement fait.
- **`loading="lazy"`** appliqué sur 70 des 94 images — correctement omis sur le logo d'en-tête et les visuels de la zone visible.
- **`decoding="async"`** systématique sur les 94 images.
- **`width` et `height` déclarés** sur les 94 images → réservation d'espace, prévention du CLS.
- **Polices auto-hébergées avec sous-découpage `unicode-range` et `font-display: swap`** — `assets/fonts/fonts.css`. C'est le **point technique le plus remarquable du projet** : bien que le dossier pèse 865 Ko, un visiteur francophone ne télécharge que les sous-ensembles latin, soit **2 à 4 fichiers (~30 à 60 Ko)**. Les blocs cyrillique, grec, vietnamien et devanagari ne sont jamais demandés. Aucun appel à `fonts.googleapis.com` : ni requête tierce, ni fuite de confidentialité, ni aller-retour DNS supplémentaire.
- **`<link rel="preconnect">`** vers `translate.googleapis.com` et `translate.google.com` (`index.html:60-61`) — anticipe la résolution DNS et la négociation TLS.
- **`defer`** sur tous les scripts non critiques : aucun script bloquant l'analyse du document.
- **Zéro bibliothèque JavaScript tierce** : ni jQuery, ni Bootstrap, ni framework. Sur un site de cette nature, c'est le meilleur choix de performance possible.

---

# 8. ACCESSIBILITÉ — 62/100

## A11Y-01 — Le lien d'évitement est invisible même au focus

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** (WCAG 2.4.1 niveau A + 2.4.7 niveau AA) |
| **Fichiers** | `css/style.css:1404-1412` + les 13 pages HTML |

**Description.** Chaque page débute par un lien d'évitement — excellente intention :

```html
<!-- index.html:94, et identique sur les 12 autres pages -->
<a href="#main-content" class="sr-only">Aller au contenu principal</a>
```

Mais `.sr-only` masque l'élément de façon permanente, et **aucune règle `.sr-only:focus` n'existe** dans tout le projet :

```css
/* css/style.css:1404-1412 — pas de contrepartie :focus */
.sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

```
$ grep -rn "sr-only:focus\|skip-link" css/ *.html
(aucun résultat)
```

**Conséquence possible.** Le lien fonctionne pour les lecteurs d'écran, mais reste **invisible pour les utilisateurs clavier voyants** — public souvent plus nombreux (handicap moteur, tendinite, préférence d'usage). Concrètement : l'utilisateur appuie sur Tab en arrivant sur la page, le focus se place sur un élément qu'il ne voit pas, il appuie sur Entrée « à l'aveugle » ou continue de tabuler à travers les ~15 liens de navigation sur chaque page. Le mécanisme d'évitement, présent et bien intentionné, **est inopérant pour la moitié de son public**.

C'est le défaut d'accessibilité **le plus rentable à corriger** du projet : 8 lignes de CSS, un seul fichier, 13 pages améliorées d'un coup, aucun changement visuel pour les utilisateurs souris.

**Solution recommandée.** Ajouter une classe dédiée qui révèle le lien lorsqu'il reçoit le focus. Ne pas modifier `.sr-only` elle-même : elle est légitimement utilisée pour des libellés qui doivent rester masqués en permanence (`index.html:762`, `aide.html:339`, `telechargement.html:320`).

**Exemple de code corrigé — NON APPLIQUÉ :**

```css
/* css/style.css — à ajouter après .sr-only (ligne 1412) */
.skip-link {
    position: absolute;
    top: -100px;                     /* hors écran au repos */
    left: 16px;
    z-index: 2000;                   /* au-dessus du header (z-index: 1000) */
    padding: 12px 20px;
    background: var(--color-primary);
    color: var(--color-white);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
    font-weight: 600;
    transition: top 0.2s ease-in-out;
}

.skip-link:focus {
    top: 0;                          /* devient visible au focus clavier */
}
```

```html
<!-- Sur les 13 pages : remplacer sr-only par skip-link -->
<a href="#main-content" class="skip-link">Aller au contenu principal</a>
```

> **Vérifié** : chaque page possède bien un `<main id="main-content">`, la cible du lien est donc valide partout.

---

## A11Y-02 — Vol de focus au survol de la souris dans `aide.html`

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** (WCAG 2.4.3 et 2.4.7) |
| **Fichier** | `aide.html` |
| **Lignes** | 1014-1025 |

**Description.**

```javascript
// aide.html:1014-1025
const sidebar = document.querySelector(".help-sidebar");
if (sidebar) {
    sidebar.setAttribute("tabindex", "0");
    sidebar.style.outline = "none";              // ← supprime l'indicateur de focus

    sidebar.addEventListener("mouseenter", () => {
      sidebar.focus({ preventScroll: true });    // ← VOLE le focus au survol
    });

    sidebar.addEventListener("mouseleave", () => {
      sidebar.blur();                            // ← RETIRE le focus à la sortie
    });
}
```

**Conséquence possible.** Trois violations distinctes dans onze lignes :

1. **`sidebar.style.outline = "none"`** annule le `:focus-visible` global (`css/style.css:1360`) — et par style en ligne, donc **impossible à surcharger** depuis une feuille de style. Échec de WCAG 2.4.7.
2. **`focus()` au survol** déplace le focus clavier sans action de l'utilisateur. Scénario concret : l'utilisateur remplit un champ ou lit un paragraphe ; sa souris passe accidentellement au-dessus du menu latéral ; **le focus saute hors de son champ de saisie**. Sur mobile, un simple défilement peut déclencher `mouseenter` sur certains navigateurs.
3. **`blur()` à la sortie** retire le focus de la page entière. La position de tabulation est perdue : la touche Tab suivante repart du début du document.

Combinés, ces trois points rendent `aide.html` — la page de support, celle où un utilisateur en difficulté est le plus susceptible d'arriver — difficilement navigable au clavier.

**Solution recommandée.** Supprimer entièrement le pilotage du focus par la souris. Le défilement par les flèches directionnelles (déjà implémenté lignes 1027-1033) est une bonne idée : il suffit de le déclencher lorsque l'utilisateur a **volontairement** donné le focus au menu, via Tab ou par un clic.

**Exemple de code corrigé — NON APPLIQUÉ :**

```javascript
// Proposition — NON APPLIQUÉE
const sidebar = document.querySelector(".help-sidebar");
if (sidebar) {
    sidebar.setAttribute("tabindex", "0");
    sidebar.setAttribute("role", "navigation");
    sidebar.setAttribute("aria-label", "Sommaire du centre d'aide");
    // PAS de style.outline = "none" : on conserve :focus-visible
    // PAS de mouseenter/mouseleave : on ne pilote jamais le focus à la souris

    sidebar.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      sidebar.scrollTop += e.key === "ArrowDown" ? 50 : -50;
    });
}
```

```css
/* Indicateur de focus discret mais visible sur le conteneur défilable */
.help-sidebar:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: -3px;   /* vers l'intérieur : ne décale pas la mise en page */
}
```

---

## A11Y-03 — Le bouton du menu mobile conserve le libellé « Ouvrir le menu » lorsqu'il est ouvert

| | |
|---|---|
| **Priorité** | **MOYEN** (WCAG 4.1.2) |
| **Fichiers** | `index.html:180` (et 12 pages identiques), `js/main.js:13-38` |

**Description.**

```html
<!-- index.html:180 — pas d'aria-expanded initial, pas d'aria-controls -->
<button class="mobile-menu-btn" aria-label="Ouvrir le menu">
  <svg width="24" height="24" …><path d="M3 12h18M3 6h18M3 18h18" /></svg>
</button>
```

```javascript
// js/main.js:13-37 — l'icône change, le libellé accessible ne change jamais
mobileMenuBtn.addEventListener("click", () => {
    const isExpanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    mobileMenuBtn.setAttribute("aria-expanded", !isExpanded);
    if (!isExpanded) {
        …
        mobileMenuBtn.innerHTML = '<svg …><line …/><line …/></svg>';  // croix
    } else {
        …
        mobileMenuBtn.innerHTML = '<svg …><path d="M3 12h18…"/></svg>'; // burger
    }
});
```

Quatre observations, par ordre de gravité :

1. **`aria-label="Ouvrir le menu"` n'est jamais mis à jour.** Le lecteur d'écran annonce « Ouvrir le menu » alors que l'action disponible est désormais de le fermer. L'icône passe visuellement de burger à croix, mais l'information équivalente n'est pas fournie.
2. **Aucun `aria-controls`** ne relie le bouton à `.nav-links`.
3. **`aria-expanded` absent du HTML initial.** Le code fonctionne (`getAttribute` renvoie `null`, `null === "true"` est faux → premier clic correct), mais l'état replié n'est pas annoncé au premier chargement.
4. **Cible tactile de 24 × 24 px.** `css/style.css:155-161` ne définit aucun `padding` ni dimension minimale, et le SVG mesure 24 × 24. C'est exactement le minimum de WCAG 2.5.8 (AA) — conforme, mais très en dessous des 44 × 44 recommandés par Apple et des 48 × 48 de Google.

**Conséquence possible.** Un utilisateur de lecteur d'écran ne peut pas savoir si le menu est ouvert ou fermé, ni comment le refermer. Une cible de 24 px est difficile à atteindre pour une personne ayant un tremblement ou une motricité fine réduite.

**Solution recommandée.**

```html
<!-- Proposition — NON APPLIQUÉE -->
<button class="mobile-menu-btn"
        aria-label="Ouvrir le menu"
        aria-expanded="false"
        aria-controls="navigation-principale">
  <svg width="24" height="24" aria-hidden="true" focusable="false" …>…</svg>
</button>
…
<nav class="nav-links" id="navigation-principale">…</nav>
```

```javascript
// js/main.js — proposition : libellé et état synchronisés
const ICONE_BURGER = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" '
  + 'stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">'
  + '<path d="M3 12h18M3 6h18M3 18h18"/></svg>';
const ICONE_CROIX = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" '
  + 'stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">'
  + '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

mobileMenuBtn.addEventListener("click", () => {
    const estOuvert = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    const nouvelEtat = !estOuvert;

    mobileMenuBtn.setAttribute("aria-expanded", String(nouvelEtat));
    mobileMenuBtn.setAttribute("aria-label", nouvelEtat ? "Fermer le menu" : "Ouvrir le menu");
    mobileMenuBtn.innerHTML = nouvelEtat ? ICONE_CROIX : ICONE_BURGER;
    navLinks.classList.toggle("est-ouvert", nouvelEtat);   // classe CSS, pas 10 styles inline
});
```

```css
/* Cible tactile confortable + déplacement des 10 styles inline de main.js:18-28 */
.mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-secondary);
    padding: 12px;              /* 24 + 2×12 = 48×48 px de cible tactile */
    margin: -12px;              /* neutralise l'impact visuel sur la mise en page */
}

@media (max-width: 992px) {
    .mobile-menu-btn { display: block; }

    .nav-links.est-ouvert {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: var(--hauteur-header);
        left: 0;
        width: 100%;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 24px;
        box-shadow: var(--shadow-md);
        align-items: flex-start;
    }
}
```

> **Bénéfice secondaire** : cette correction retire les 10 affectations `navLinks.style.*` de `js/main.js:18-28`. Le style redevient du CSS, ce qui rend le code compatible avec une CSP `style-src` stricte (voir SEC-A) et supprime le besoin de `navLinks.removeAttribute("style")` ailleurs dans le fichier.

---

## A11Y-04 — `aria-modal="true"` sur la bannière cookies, sans gestion du focus

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | Les 13 pages — `index.html:1310-1316`, `js/cookies-consent.js:38-48` |

**Description.**

```html
<!-- index.html:1310-1316 -->
<div id="cookie-banner" class="cookie-banner"
     role="dialog" aria-modal="true"
     aria-labelledby="cookie-title" aria-describedby="cookie-description" hidden>
```

```javascript
// js/cookies-consent.js:44-48 — la bannière apparaît, le focus reste où il était
if (savedConsent) {
    applyConsent(savedConsent);
} else {
    banner.hidden = false;      // aucun focus déplacé dans la bannière
}
```

**Description du problème.** `aria-modal="true"` est une **déclaration contractuelle** : elle indique aux technologies d'assistance que tout le contenu hors de cet élément est inerte. Or la bannière n'implémente aucun des trois mécanismes que cette déclaration suppose :

1. Le focus n'est **pas déplacé** dans la bannière à son apparition.
2. Le focus n'est **pas capturé** : la touche Tab sort librement vers la page.
3. La touche Échap n'est **pas gérée**.

**Conséquence possible.** Un utilisateur de lecteur d'écran arrive sur le site : la bannière est affichée mais son focus reste sur `<body>`. Il commence à lire, et son outil lui annonce que le contenu de la page est masqué (à cause de `aria-modal`) sans qu'il comprenne pourquoi, ni où se trouve la fenêtre à traiter. À l'inverse, un utilisateur clavier tabule à travers toute la page sans jamais atteindre la bannière — puisqu'elle est placée après le pied de page dans l'ordre du document.

**Solution recommandée.** Deux options — la première est plus simple et suffisante :

**Option A (recommandée)** : retirer `aria-modal="true"` et conserver `role="dialog"`. La bannière n'est pas réellement modale — l'utilisateur peut légitimement lire la page avant de choisir. Ajouter simplement une annonce non intrusive et déplacer le focus.

**Option B** : implémenter une vraie modale avec capture du focus et gestion d'Échap.

```javascript
// js/cookies-consent.js — Option A. NON APPLIQUÉE.
// Retirer aria-modal="true" du HTML, conserver role="dialog"

if (savedConsent) {
    applyConsent(savedConsent);
} else {
    banner.hidden = false;
    // Déplacer le focus sur le titre de la bannière pour l'annoncer
    const titre = document.getElementById("cookie-title");
    if (titre) {
        titre.setAttribute("tabindex", "-1");
        titre.focus({ preventScroll: true });
    }
}

function closeAllWindows() {
    banner.hidden = true;
    settings.hidden = true;
    // Restituer le focus au début du contenu : l'utilisateur reprend sa lecture
    document.getElementById("main-content")?.focus({ preventScroll: true });
}
```

---

## A11Y-05 — Absence de capture du focus dans les six modales de `nourriture.html`

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichier** | `nourriture.html:1060-1105` |

**Description.** Les modales sont correctement étiquetées :

```html
<!-- nourriture.html:648 — role, aria-modal et aria-label : bien fait -->
<div class="cuisine-modal" role="dialog" aria-modal="true" aria-label="Plats Locaux"
     onclick="closeModal(event, 'modal-locaux')">
```

Et `openModal` gère le focus initial et sa restitution — ce qui est déjà remarquable :

```javascript
// nourriture.html:1062-1074
function openModal(id) {
  var modal = document.getElementById(id);
  if (modal) {
      declencheur = document.activeElement;   // ← mémorise l'origine : très bien
      modal.classList.add("active");
      modal.setAttribute('tabindex', '-1');
      modal.focus();                          // ← déplace le focus : très bien
  }
  document.body.style.overflow = "hidden";
}
// … et closeModal ligne 1094 : if (declencheur) declencheur.focus();  ← restitution : très bien
```

**Ce qui manque** : rien n'empêche la touche Tab de sortir de la modale vers le contenu situé derrière. L'utilisateur tabule et se retrouve à naviguer dans une page qu'il ne voit pas (elle est masquée par la superposition), sans indication de position.

**Conséquence possible.** Utilisateur clavier ou lecteur d'écran perdu dans un contenu invisible. Comme `aria-modal="true"` est déclaré, le lecteur d'écran considère le contenu extérieur comme inerte — le focus clavier et l'arbre d'accessibilité se désynchronisent.

**Solution recommandée.** Ajouter une capture du focus au gestionnaire `keydown` existant (ligne 1097), qui gère déjà Échap. Une vingtaine de lignes suffisent.

```javascript
// Proposition — à intégrer au keydown existant de nourriture.html:1097. NON APPLIQUÉE.
const SELECTEUR_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

document.addEventListener("keydown", function (e) {
  const ouverte = document.querySelector(".cuisine-modal.active");
  if (!ouverte) return;

  if (e.key === "Escape") {
    closeModal(null, ouverte.id);
    return;
  }

  if (e.key !== "Tab") return;

  const focusables = [...ouverte.querySelectorAll(SELECTEUR_FOCUSABLE)];
  if (focusables.length === 0) { e.preventDefault(); return; }

  const premier = focusables[0];
  const dernier = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === premier) {
    e.preventDefault(); dernier.focus();          // boucle vers la fin
  } else if (!e.shiftKey && document.activeElement === dernier) {
    e.preventDefault(); premier.focus();          // boucle vers le début
  }
});
```

---

## Points forts confirmés — accessibilité

Il faut le dire clairement : **les fondations d'accessibilité de ce projet sont sérieuses**, et supérieures à ce qu'on observe habituellement.

- **`alt` renseigné sur les 94 images.** Les `alt=""` (26 occurrences) sont **corrects** : ils concernent des logos décoratifs placés dans un lien qui porte déjà un texte accessible (`index.html:98-106` — le lien contient « alfa. » en texte). C'est l'usage exact prévu par la spécification, pas un oubli.
- **`prefers-reduced-motion`** respecté (`css/style.css:1415-1424`).
- **`:focus-visible` global** avec contour 3 px et décalage (`1360-1363`).
- **`:focus-within` sur les menus déroulants** (`1071-1075`) — le sélecteur de langue est utilisable au clavier.
- **Zoom jamais bloqué** — aucun `maximum-scale` ni `user-scalable=no` sur les 13 pages.
- **`<label for>` associé à tous les champs**, y compris les libellés visuellement masqués (`index.html:762`, `aide.html:339`).
- **FAQ en `<details>` / `<summary>` natifs** — accessible par construction, sans une ligne de JavaScript.
- **Modales de `nourriture.html`** : `role="dialog"`, `aria-modal`, `aria-label`, focus initial, focus restitué, Échap géré. Seule la capture du focus manque.
- **Bannière cookies** : `role`, `aria-labelledby`, `aria-describedby`, boutons « Accepter » et « Refuser » de poids visuel équivalent — pas de motif sombre.
- **`aria-haspopup="dialog"`** sur les cartes de cuisine (`nourriture.html:613`).
- **`<html lang="fr">`** sur les 13 pages, et `js/gtranslate.js:36` met à jour `document.documentElement.lang` lors d'un changement de langue.

---

# 9. SEO — 66/100

## SEO-01 — La configuration Vercel transforme toutes les URL inexistantes en pages valides (soft-404)

| | |
|---|---|
| **Priorité** | **🟠 ÉLEVÉ** |
| **Fichier** | `vercel.json` |
| **Lignes** | 37-42 |

**Description.**

```json
// vercel.json:37-42
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/404.html"
  }
]
```

Un **`rewrite`** (réécriture) sert le contenu du fichier de destination **en conservant le code de statut de ce fichier** : `404.html` est servi avec un **`200 OK`**. C'est la différence essentielle avec un `redirect`, et c'est le piège classique du soft-404.

Vercel sert **déjà** automatiquement `404.html` avec un vrai statut `404` pour les chemins introuvables. Cette règle explicite ne fait donc qu'**annuler ce comportement correct**.

**Conséquence possible.** Toute URL inexistante — `alfa.com.gn/nimportequoi`, `alfa.com.gn/wp-admin`, `alfa.com.gn/promo-2024` — renvoie `200 OK` avec le contenu de la page d'erreur. Effets concrets :

- **Google indexe des URL fantômes** comme des pages valides. La Search Console remonte des « pages en double sans balise canonique » ou des « soft 404 », et le budget d'exploration est gaspillé sur des URL infinies.
- **Un attaquant ou un robot** peut générer un nombre illimité d'URL indexables pointant sur le même contenu.
- **Aucun outil de supervision** ne peut détecter un lien mort : tout répond `200`.
- Un tiers peut publier `alfa.com.gn/arnaque-promotion` : le lien renvoie `200` et paraît légitime.

**Solution recommandée.** Supprimer entièrement le bloc `rewrites` et laisser Vercel gérer le 404 nativement. Ajouter `noindex` sur la page d'erreur par précaution.

**Exemple de code corrigé — NON APPLIQUÉ :**

```json
// vercel.json — proposition : suppression du bloc rewrites
{
  "headers": [ /* … inchangé … */ ],
  "redirects": [
    { "source": "/.git/(.*)",  "destination": "/404.html", "permanent": false },
    { "source": "/tools/(.*)", "destination": "/404.html", "permanent": false }
  ]
  // PAS de "rewrites" : Vercel sert 404.html avec un vrai statut 404
}
```

```html
<!-- 404.html — à ajouter dans <head>. NON APPLIQUÉ. -->
<meta name="robots" content="noindex, follow" />
```

> **Vérification après correction** : `curl -I https://www.alfa.com.gn/url-inexistante` doit renvoyer `HTTP/2 404` et non `HTTP/2 200`.

---

## SEO-02 — Le contenu traduit n'est pas indexable : aucun bénéfice SEO multilingue

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | Les 13 pages — `index.html:168-170, 1428` |

**Description.** Le site propose trois langues (Français, English, 中文) via un sélecteur :

```html
<!-- index.html:168-170 -->
<button type="button" onclick="doGTranslate('fr|fr');"    class="lang-option">Français</button>
<button type="button" onclick="doGTranslate('fr|en');"    class="lang-option">English</button>
<button type="button" onclick="doGTranslate('fr|zh-CN');" class="lang-option">中文</button>
```

La traduction est produite **côté navigateur** par Google Translate. Vérifié : aucun `hreflang`, aucun `rel="alternate"`, aucune URL par langue.

```
$ grep -rniE "hreflang|rel=\"alternate\"|og:locale" --include=*.html .
(aucun résultat)
```

**Conséquence possible.** Google indexe **exclusivement la version française**. Une recherche en anglais (« food delivery Conakry ») ou en chinois ne trouvera jamais le site. L'effort de traduction n'apporte **aucun trafic organique** : il n'améliore l'expérience que des visiteurs déjà présents. Pour une entreprise visant les investisseurs et partenaires internationaux — l'intérêt évident du chinois et de l'anglais dans le contexte guinéen — c'est l'essentiel du bénéfice attendu qui est perdu.

**Solution recommandée.** Générer de vraies pages par langue, indexables, avec `hreflang`. `tools/seo_update.js` fournit déjà l'ossature d'un tel générateur (il itère sur un dictionnaire de 12 pages et écrit dans `dist/`).

**Exemple de code corrigé — NON APPLIQUÉ :**

```html
<!-- index.html <head> — déclaration des variantes linguistiques -->
<link rel="alternate" hreflang="fr"        href="https://www.alfa.com.gn/" />
<link rel="alternate" hreflang="en"        href="https://www.alfa.com.gn/en/" />
<link rel="alternate" hreflang="zh-Hans"   href="https://www.alfa.com.gn/zh/" />
<link rel="alternate" hreflang="x-default" href="https://www.alfa.com.gn/" />
```

```javascript
// tools/seo_update.js — extension proposée du générateur existant
const LANGUES = ["fr", "en", "zh"];
const prefixe = (lang) => (lang === "fr" ? "" : `${lang}/`);

for (const lang of LANGUES) {
  for (const [fichier, data] of Object.entries(pages)) {
    const alternates = LANGUES.map((l) =>
      `<link rel="alternate" hreflang="${l === "zh" ? "zh-Hans" : l}" `
      + `href="${domain}/${prefixe(l)}${fichier === "index.html" ? "" : fichier}">`
    ).join("\n    ");
    // … injection dans le <head>, écriture dans dist/<lang>/ …
  }
}
```

> **Solution intermédiaire à faible coût** : si la traduction complète est trop lourde, produire **au minimum une page `/en/` d'accueil** rédigée à la main. Elle capte les recherches en anglais sur la marque et les partenariats, pour un effort d'une journée.

---

## SEO-03 — L'image de partage social référencée n'existe pas

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | Les 13 pages — `index.html:24-27` |

```html
<!-- index.html:24-27 — sur les 13 pages -->
<meta property="og:image" content="https://www.alfa.com.gn/assets/og-image.jpg" />
```

```
$ ls assets/og-image.jpg
ls: cannot access 'assets/og-image.jpg': No such file or directory
```

**Conséquence possible.** Tout partage sur WhatsApp, Facebook, LinkedIn ou X affiche un aperçu **sans visuel** — un simple bloc de texte. Or **WhatsApp est le principal canal de partage en Guinée** : c'est très probablement le vecteur de diffusion numéro un du site. Un aperçu sans image réduit fortement le taux de clic, et les plateformes mettent en cache les résultats négatifs pendant plusieurs jours.

**Solution recommandée.** Produire l'image aux dimensions attendues et compléter les métadonnées associées, absentes elles aussi.

```html
<!-- Proposition — NON APPLIQUÉE -->
<meta property="og:image"        content="https://www.alfa.com.gn/assets/og-image.jpg" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt"    content="alfa — transport, livraison et nourriture en Guinée" />
<meta property="og:locale"       content="fr_FR" />

<!-- Cartes Twitter/X : absentes du projet -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content="Alfa - Super-application de transport et livraison en Guinée" />
<meta name="twitter:description" content="Commandez un chauffeur, de la nourriture ou envoyez des colis…" />
<meta name="twitter:image"       content="https://www.alfa.com.gn/assets/og-image.jpg" />
```

> **Format** : 1200 × 630 px, moins de 300 Ko, avec le logo et l'accroche lisibles en vignette. Après publication, vider le cache via le *Facebook Sharing Debugger* et le *Post Inspector* de LinkedIn.

---

## SEO-04 — Données structurées identiques sur les 13 pages, et FAQ non balisée

| | |
|---|---|
| **Priorité** | **MOYEN** |
| **Fichiers** | `index.html:80-90` (et 12 blocs identiques), `index.html:999-1043` |

**Description.** Le même bloc `LocalBusiness` est recopié sur toutes les pages :

```json
// index.html:80-90 — identique sur les 13 pages
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "alfa",
  "description": "Commandes de nourriture, livraisons et déplacements en Guinée",
  "url": "https://www.alfa.com.gn/",
  "telephone": "+224614878886",
  "areaServed": { "@type": "City", "name": "Conakry", "addressCountry": "GN" }
}
```

Deux occasions manquées :

1. **Aucune adaptation par page.** `contact.html` gagnerait un `ContactPage`, `cgu.html` et `confidentialite.html` un `WebPage`, `telechargement.html` un `SoftwareApplication` (potentiellement éligible aux résultats enrichis avec note et prix).
2. **La FAQ n'est pas balisée.** `index.html:999-1043` contient quatre questions-réponses réelles en `<details>`, sans `FAQPage` associé — alors que c'est l'un des types de résultats enrichis les plus accessibles et les plus visibles dans les SERP.

De plus, `LocalBusiness` sans `address` ni `openingHoursSpecification` est incomplet, alors que `contact.html:400-403` fournit bien l'adresse : « Lambanyi, Commune de Lambanyi, Conakry, Guinée ».

**Conséquence possible.** Perte de résultats enrichis, moins de surface d'affichage dans les SERP, et une fiche d'entreprise moins bien comprise par Google — pénalisant pour le référencement local, pourtant décisif pour un service opérant à Conakry.

**Solution recommandée.**

```json
// index.html — LocalBusiness enrichi. NON APPLIQUÉ.
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "alfa",
  "description": "Commandes de nourriture, livraisons et déplacements en Guinée",
  "url": "https://www.alfa.com.gn/",
  "telephone": "+224614878886",
  "email": "contact@alfa.com.gn",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Lambanyi, Commune de Lambanyi",
    "addressLocality": "Conakry",
    "addressCountry": "GN"
  },
  "areaServed": { "@type": "City", "name": "Conakry", "addressCountry": "GN" },
  "priceRange": "GNF",
  "sameAs": [
    "https://www.facebook.com/alfa",
    "https://www.instagram.com/alfa.guinee"
  ]
}
```

```json
// index.html — second bloc : FAQPage, reprenant les <details> existants. NON APPLIQUÉ.
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment créer un compte ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Téléchargez l'application, ouvrez-la et sur la première page de connexion, cliquez sur « Pas encore inscrit ? Créer un compte ». Remplissez les informations demandées puis validez le code reçu par SMS ou e-mail."
      }
    },
    {
      "@type": "Question",
      "name": "Comment commander un repas ou un taxi ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ouvrez l'application, choisissez la section Nourriture ou Taxi, sélectionnez ce que vous voulez et validez votre panier ou votre trajet."
      }
    }
  ]
}
```

> **Règle impérative** : le texte du `FAQPage` doit correspondre **mot pour mot** au contenu visible dans les `<details>`. Toute divergence est une violation des consignes Google sur les données structurées et peut entraîner une action manuelle.

---

## SEO-05 — `sitemap.xml` figé et incomplet

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichier** | `sitemap.xml` |

**Description.** Trois observations :

1. Les 12 entrées portent toutes `<lastmod>2026-07-22</lastmod>`, alors que les fichiers HTML ont été modifiés le **30 juillet**. La date est fausse pour toutes les pages.
2. `aide.html` est présente, mais `404.html` et `test.html` sont absents — **ce qui est correct** pour ces deux-là.
3. `<changefreq>monthly</changefreq>` et `<priority>` sont **ignorés par Google depuis 2023**. Inoffensif, mais inutile.

**Conséquence possible.** Un `lastmod` erroné réduit la confiance de Google dans le fichier ; il peut alors l'ignorer et se rabattre sur sa propre heuristique d'exploration, retardant la prise en compte des mises à jour.

**Solution recommandée.** `tools/seo_update.js:71` génère déjà un `lastmod` correct (`new Date().toISOString().split('T')[0]`). Il suffit d'intégrer ce script au flux de déploiement, ou mieux, de dater chaque page depuis son horodatage de fichier réel :

```javascript
// tools/seo_update.js — proposition d'amélioration du lastmod
const lastmod = fs.statSync(filePath).mtime.toISOString().split("T")[0];
sitemapUrls += `
  <url>
    <loc>${domain}/${file === "index.html" ? "" : file}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
// changefreq et priority supprimés : ignorés par Google depuis 2023
```

---

## Points forts confirmés — SEO

- **13 `<title>` uniques et descriptifs**, tous sous 60 caractères, avec la marque et le pays.
- **13 `<meta name="description">` uniques**, rédigées avec un appel à l'action, longueur correcte.
- **`<link rel="canonical">`** sur chaque page, en URL absolue.
- **Open Graph** présent : `og:title`, `og:description`, `og:type`, `og:url`, `og:site_name`, `og:image`.
- **`robots.txt` correct** — `Allow: /` + déclaration du sitemap en URL absolue.
- **`sitemap.xml` présent** et bien formé, avec les 12 pages utiles.
- **HTML sémantique** : `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` sur les 13 pages.
- **Un `<h1>` unique par page** — 13/13, avec des mots-clés pertinents.
- **URL propres et lisibles** : `/chauffeur.html`, `/livraison.html`, `/mentions-legales.html`.
- **Maillage interne dense** : en-tête et pied de page relient toutes les pages entre elles.
- **`alt` descriptifs** sur les images de contenu (« Carte de Conakry », « App Chauffeur 1 »).
- **Données structurées `LocalBusiness`** présentes — le socle existe, il ne reste qu'à l'enrichir.

---

# 10. COMPATIBILITÉ ET RESPONSIVE DESIGN — 64/100

## RESP-01 — Le menu mobile se ferme au défilement

Voir **JS-01** (priorité **ÉLEVÉ**) — c'est le défaut responsive le plus visible du site.

## RESP-02 — Aucun point de rupture au-delà de 1200 px

| | |
|---|---|
| **Priorité** | **FAIBLE** |
| **Fichier** | `css/style.css:44` — `--container-width: 1200px` |

**Description.** Le contenu est plafonné à 1200 px et centré. Au-delà (écrans 1440p, 2560p, ultra-larges), les marges latérales deviennent très importantes. Ce n'est **pas un bug** — c'est un choix de mise en page défendable et répandu.

**Conséquence possible.** Le rendu paraît légèrement étroit sur un moniteur 27 pouces. Impact réel faible : le public cible est massivement mobile.

**Solution recommandée** (optionnelle) :

```css
/* Proposition : élargissement progressif sur très grand écran */
@media (min-width: 1600px) {
    :root { --container-width: 1440px; }
}
```

## RESP-03 — Analyse de compatibilité des navigateurs

**Inventaire des fonctionnalités modernes employées et de leur prise en charge :**

| Fonctionnalité | Fichier | Prise en charge | Repli présent ? |
|---|---|---|---|
| Variables CSS | `style.css:4-48` | Universelle (2017+) | Non nécessaire |
| `backdrop-filter` | `style.css:114-115` | Chrome 76+, Safari 9+ (préfixé) | ✅ `-webkit-` fourni |
| `gap` en Flexbox | `style.css:141` | Safari 14.1+ | ✅ **`@supports not (aspect-ratio: 1)` L1432-1442** |
| CSS Grid | `style.css` (multiple) | Universelle (2017+) | Non nécessaire |
| `:focus-visible` | `style.css:1360` | Safari 15.4+ | ⚠️ Aucun — dégradation silencieuse |
| `scroll-margin-top` | `style.css:1356` | Safari 14.1+ | ⚠️ Aucun — ancres décalées sur Safari ancien |
| `prefers-reduced-motion` | `style.css:1415` | Universelle | Non nécessaire |
| `IntersectionObserver` | `main.js:83` | Universelle (2019+) | ⚠️ Aucun — animations non déclenchées |
| Chaînage optionnel `?.` | `cookies-consent.js:50` | Safari 13.1+, Chrome 80+ | ⚠️ Aucun — **erreur de syntaxe** sur navigateur ancien |
| Coalescence nulle `??` | `cookies-consent.js:99` | Safari 13.1+, Chrome 80+ | ⚠️ Idem |
| `async`/`await` | `form-handler.js:14` | Universelle (2017+) | Non nécessaire |
| `fetch()` | `form-handler.js:99` | Universelle (2017+) | Non nécessaire |
| `loading="lazy"` | 70 images | Chrome 77+, Safari 15.4+ | Dégradation propre (attribut ignoré) |
| `decoding="async"` | 94 images | Chrome 65+ | Dégradation propre |
| WebP | 284 images | Universelle (Safari 14+, 2020) | ⚠️ Aucun repli JPEG/PNG |
| `matchMedia` | — | Universelle | (recommandé en JS-01) |

**Le point le plus notable** : le chaînage optionnel (`?.`) et la coalescence nulle (`??`) de `js/cookies-consent.js` sont des **erreurs de syntaxe** sur les navigateurs antérieurs à 2020. Le fichier entier échoue alors à s'analyser, ce qui signifie que **la bannière de consentement ne s'affiche pas du tout** — et donc qu'aucun consentement n'est demandé. Sur ces mêmes navigateurs, Google Analytics et Meta Pixel ne se chargent pas non plus (ils sont conditionnés par ce fichier), de sorte qu'aucune donnée ne part : le risque de conformité est donc neutralisé par accident. La conséquence réelle se limite à l'absence de bannière.

Compte tenu du parc guinéen (majorité Android récent, quelques appareils anciens), l'impact est faible mais non nul. Ces syntaxes sont par ailleurs cohérentes avec le reste du projet et je **ne recommande pas** de les retirer : la bonne réponse est de documenter la cible de compatibilité.

**Solution recommandée.** Déclarer explicitement la cible de navigateurs, pour que ce choix soit assumé plutôt qu'implicite :

```json
// package.json — proposition : documenter la cible. NON APPLIQUÉ.
"browserslist": [
  "> 0.5% in GN",
  "last 3 Chrome versions",
  "last 2 Safari versions",
  "Firefox ESR",
  "not dead"
]
```

```javascript
// js/cookies-consent.js — proposition d'en-tête documentaire
/**
 * Cible : navigateurs supportant ES2020 (chaînage optionnel, coalescence nulle).
 * Chrome 80+, Safari 13.1+, Firefox 72+ — soit ~98 % du parc en 2026.
 * Sur navigateur antérieur, ce fichier ne s'analyse pas : la bannière ne s'affiche
 * pas ET aucun traceur ne se charge (comportement dégradé sûr, pas de fuite RGPD).
 */
```

## Points forts confirmés — compatibilité et responsive

- **`@supports not (aspect-ratio: 1)`** (`style.css:1432-1442`) — repli `margin-left` pour les navigateurs sans `gap` en Flexbox, avec commentaire justifiant le choix du test. Démarche de professionnel.
- **`-webkit-backdrop-filter`** systématiquement doublé (`115-116`, `main.js:25`).
- **`meta viewport` correct** sur les 13 pages, zoom non bloqué.
- **`width` et `height` sur les 94 images** — pas de saut de mise en page au chargement.
- **Champs de formulaire en `font-size: 1rem`** — évite le zoom automatique intempestif d'iOS Safari sur les champs de saisie (déclenché sous 16 px). Détail souvent manqué.
- **Repli de police système** déclaré : `font-family: 'Inter', system-ui, -apple-system, sans-serif` (`style.css:64`).
- **`overflow-wrap` / `word-wrap: break-word`** sur les titres en dessous de 480 px (`1382`, `1386`) — évite les débordements sur les mots longs.

---

# LES 10 PROBLÈMES LES PLUS IMPORTANTS

| # | Réf. | Priorité | Problème | Fichier | Impact |
|---|---|---|---|---|---|
| **1** | HTML-01 | 🔴 **CRITIQUE** | `smartLink()` appelée 7 fois, définie nulle part — **les boutons de téléchargement ne fonctionnent pas** | `telechargement.html:346,402,433,617` | Perte de conversion totale sur le parcours principal |
| **2** | SEO-01 | 🟠 **ÉLEVÉ** | Le `rewrite` catch-all de Vercel renvoie **200 OK** pour toute URL inexistante (soft-404) | `vercel.json:37-42` | URL fantômes indexées, budget d'exploration gaspillé |
| **3** | JS-01 | 🟠 **ÉLEVÉ** | Le menu mobile **se ferme tout seul** quand la barre d'adresse se replie au défilement | `js/main.js:57-65` | Navigation instable sur mobile = plateforme majoritaire |
| **4** | A11Y-01 | 🟠 **ÉLEVÉ** | Lien d'évitement **invisible même au focus** (aucune règle `.sr-only:focus`) | `css/style.css:1404-1412` + 13 pages | WCAG 2.4.1 échoué ; 8 lignes de CSS pour corriger 13 pages |
| **5** | SEC-A | 🟠 **ÉLEVÉ** | **Aucune CSP** alors que 2 scripts tiers ont accès au DOM des formulaires de PII | `vercel.json`, `netlify.toml`, `.htaccess` | Exfiltration silencieuse possible si un fournisseur est compromis |
| **6** | SEC-B | 🟠 **ÉLEVÉ** | Clé Web3Forms + `subject`/`from_name` pilotables par le client | 4 formulaires | Usurpation de la marque alfa dans ses propres e-mails |
| **7** | PERF-01 | 🟠 **ÉLEVÉ** | `sizes` identique sur les 94 images + `srcset` à candidat unique | 13 pages | 1,8 Mo déployés pour rien **et** images floues sur écran retina |
| **8** | A11Y-02 | 🟠 **ÉLEVÉ** | **Vol de focus au survol** + `outline: none` en style inline | `aide.html:1014-1025` | La page de support est difficilement navigable au clavier |
| **9** | QC-01 | 🟠 **ÉLEVÉ** | **44 % du HTML dupliqué** — dérive déjà mesurable entre les 13 pages | 13 pages | Correctifs appliqués sur 12 pages et oubliés sur la 13ᵉ |
| **10** | ST-01 | 🟠 **ÉLEVÉ** | **142 images `temp_*` inutilisées** — 3,6 Mo, 50 % du dossier images | `assets/images/` | Poids de dépôt et de déploiement doublé sans raison |

---

# CORRECTIONS À EFFECTUER AVANT LE DÉPLOIEMENT

Cinq corrections. Aucune ne touche au design. Effort total estimé : **une demi-journée**.

### 1. Réparer les boutons de téléchargement — `HTML-01`

**Bloquant absolu.** `telechargement.html` est la page de conversion du site et ne fonctionne pas. Solution la plus simple : remplacer les 7 `onclick="smartLink(...)"` par de vrais `href` vers le Play Store (voir HTML-01, proposition A). **30 minutes.**

### 2. Supprimer le `rewrite` catch-all de Vercel — `SEO-01`

Retirer les lignes 37-42 de `vercel.json`. Vercel sert alors `404.html` avec un vrai statut 404. Ajouter `<meta name="robots" content="noindex, follow">` dans `404.html`. **10 minutes.**

### 3. Sécuriser le canal formulaire — `SEC-B`

**Aucune modification de code.** Dans le tableau de bord Web3Forms : activer **« Require Captcha »** et **restreindre les domaines autorisés** à `alfa.com.gn` et `www.alfa.com.gn`. Ces deux réglages ferment à eux seuls le scénario d'usurpation. **20 minutes.**

### 4. Corriger le menu mobile — `JS-01`

Remplacer le gestionnaire `resize` de `js/main.js:57-65` par `matchMedia` (voir JS-01). Un seul fichier, effet sur les 13 pages. **30 minutes.**

### 5. Rendre le lien d'évitement visible — `A11Y-01`

Ajouter la classe `.skip-link` dans `css/style.css` et remplacer `class="sr-only"` par `class="skip-link"` sur le premier lien des 13 pages. **30 minutes.**

### Supprimer `test.html`

Artefact de débogage déployé et indexable. **2 minutes.**

### Vérifications à mener après ces corrections

```bash
curl -I https://www.alfa.com.gn/url-inexistante   # doit renvoyer 404, pas 200
curl -I https://www.alfa.com.gn/test.html         # doit renvoyer 404
curl -X POST https://api.web3forms.com/submit \
     -d '{"access_key":"…","message":"test"}'     # doit être REJETÉ
```

- Ouvrir le menu burger sur un téléphone réel, faire défiler → **le menu doit rester ouvert**.
- Appuyer sur Tab dès l'arrivée sur la page d'accueil → **le lien d'évitement doit apparaître**.
- Cliquer sur les 7 boutons de téléchargement → **chacun doit ouvrir le Play Store**.

---

# AMÉLIORATIONS APRÈS LE DÉPLOIEMENT

### Court terme (2 à 4 semaines)

| Réf. | Action | Effort |
|---|---|---|
| PERF-01 | Corriger `sizes` et ajouter un second candidat `srcset` sur les 94 images | 3 h |
| ST-01 | Supprimer les 142 images `temp_*` (après vérification du pipeline) | 30 min |
| A11Y-02 | Retirer le vol de focus et le `outline: none` de `aide.html` | 30 min |
| A11Y-03 | Synchroniser `aria-label` / `aria-expanded` / `aria-controls` du menu ; cible tactile à 48 px | 1 h |
| SEC-C | Passer le garde-fou captcha en « échec fermé » | 15 min |
| SEO-03 | Produire `og-image.jpg` 1200×630 + ajouter `og:locale` et `twitter:card` | 2 h |
| SEC-A | Déployer la CSP en `Report-Only`, collecter les violations 7 à 14 jours | 2 h |
| PERF-02 | Précharger la police Poppins (LCP) en plus d'Inter | 15 min |
| PERF-03 | Ajouter `fetchpriority="high"` sur l'image LCP de chaque page | 30 min |
| ST-04 | Supprimer les 2 configurations de plateforme mortes | 30 min |
| HTML-04 | Corriger le saut `h2` → `h4` (`index.html:748`) | 10 min |
| JS-04 | Corriger l'heuristique de détection e-mail (`form-handler.js:43`) | 15 min |

### Moyen terme (1 à 3 mois)

| Réf. | Action | Effort |
|---|---|---|
| SEC-A | Basculer la CSP en mode bloquant | 2 h |
| QC-02 | Extraire les 246 styles inline en classes utilitaires (**prérequis CSP**) | 1 j |
| JS-02 | Remplacer les `onclick` par une délégation `data-*` (**prérequis CSP**) | 1 j |
| **QC-01** | **Factoriser en-tête / pied de page / bannière cookies via Eleventy** | **2 à 3 j** |
| SEO-04 | Enrichir `LocalBusiness` + ajouter `FAQPage` | 3 h |
| CSS-01 | Regrouper les points de rupture dupliqués | 2 h |
| CSS-02 | Supprimer le sélecteur universel et les `!important` du bloc 480 px | 3 h |
| A11Y-04 | Corriger `aria-modal` de la bannière cookies + gestion du focus | 2 h |
| A11Y-05 | Ajouter la capture du focus aux 6 modales de `nourriture.html` | 2 h |
| ST-02 | Fusionner `interactions.js` dans `main.js`, unifier l'ordre des scripts | 1 h |

### Long terme (3 à 6 mois)

| Réf. | Action | Effort |
|---|---|---|
| SEO-02 | Vraies pages `/en/` et `/zh/` avec `hreflang` (au lieu de Google Translate) | 1 à 2 sem. |
| SEC-B | Relais serverless détenant la clé Web3Forms + validation captcha serveur | 1 à 2 j |
| — | Adresse de contact sur le domaine + SPF / DKIM / DMARC | 4 h |
| — | Intégration continue : validation W3C, Lighthouse, `npm audit` à chaque *push* | 1 j |
| — | **Audit dédié de l'application mobile et de la configuration Firebase** | à cadrer |

> **La dernière ligne est la plus importante du rapport.** L'application mobile alfa, ses règles Firestore et Storage, ses Cloud Functions et son intégration FedaPay **ne sont pas dans ce dépôt**. Ce sont elles qui détiennent les comptes utilisateurs, les positions GPS, les documents officiels des chauffeurs et les transactions Mobile Money. La note de 64/100 porte sur un **site vitrine** : elle ne dit rien de la sécurité de la plateforme alfa. C'est là que se situe le risque matériel.

---

# PLAN D'ACTION CLASSÉ PAR PRIORITÉ

## Phase 0 — Bloquants (cette semaine, ~4 h)

| # | Action | Réf. | Fichier | Effort |
|---|---|---|---|---|
| 1 | Réparer les boutons de téléchargement | HTML-01 | `telechargement.html` | 30 min |
| 2 | Supprimer le `rewrite` catch-all de Vercel | SEO-01 | `vercel.json:37-42` | 10 min |
| 3 | Activer « Require Captcha » + domaines autorisés | SEC-B | *tableau de bord Web3Forms* | 20 min |
| 4 | Corriger le menu mobile (`matchMedia`) | JS-01 | `js/main.js:57-65` | 30 min |
| 5 | Rendre le lien d'évitement visible au focus | A11Y-01 | `css/style.css` + 13 pages | 30 min |
| 6 | Supprimer `test.html` | QC-03 | `test.html` | 2 min |
| 7 | Identifier la plateforme d'hébergement réelle | ST-04 | — | 30 min |

## Phase 1 — Fort impact, effort modéré (2 à 4 semaines, ~2 j)

| # | Action | Réf. | Effort |
|---|---|---|---|
| 8 | Corriger `sizes` + second candidat `srcset` | PERF-01 | 3 h |
| 9 | Supprimer les 142 images `temp_*` | ST-01 | 30 min |
| 10 | Retirer le vol de focus de `aide.html` | A11Y-02 | 30 min |
| 11 | Synchroniser les attributs ARIA du menu mobile | A11Y-03 | 1 h |
| 12 | Déployer la CSP en `Report-Only` | SEC-A | 2 h |
| 13 | Produire `og-image.jpg` + `og:locale` + `twitter:card` | SEO-03 | 2 h |
| 14 | Précharger la police Poppins + `fetchpriority` | PERF-02/03 | 45 min |
| 15 | Garde-fou captcha en « échec fermé » | SEC-C | 15 min |
| 16 | Supprimer les configurations de plateforme mortes | ST-04 | 30 min |
| 17 | Corriger le saut de titre `h2` → `h4` | HTML-04 | 10 min |
| 18 | Corriger l'heuristique de détection e-mail | JS-04 | 15 min |
| 19 | Corriger les `<input>` malformés + `rel` dupliqué | HTML-02/03 | 30 min |

## Phase 2 — Dette structurelle (1 à 3 mois, ~6 j)

| # | Action | Réf. | Effort | Dépendance |
|---|---|---|---|---|
| 20 | Extraire les 246 styles inline | QC-02 | 1 j | → prérequis de #22 |
| 21 | Remplacer les `onclick` par `data-*` délégués | JS-02 | 1 j | → prérequis de #22 |
| 22 | **Basculer la CSP en mode bloquant** | SEC-A | 2 h | **après #20 et #21** |
| 23 | **Factoriser les gabarits (Eleventy)** | QC-01 | 2 à 3 j | — |
| 24 | Enrichir `LocalBusiness` + `FAQPage` | SEO-04 | 3 h | — |
| 25 | Regrouper les points de rupture | CSS-01 | 2 h | — |
| 26 | Nettoyer le bloc 480 px (`*` et `!important`) | CSS-02 | 3 h | après #25 |
| 27 | Corriger le focus de la bannière cookies | A11Y-04 | 2 h | — |
| 28 | Capture du focus dans les modales | A11Y-05 | 2 h | — |
| 29 | Fusionner `interactions.js`, unifier l'ordre des scripts | ST-02 | 1 h | après #23 |
| 30 | Restaurer le contour de focus du champ d'alerte | CSS-03 | 15 min | — |

## Phase 3 — Stratégique (3 à 6 mois)

| # | Action | Réf. | Effort |
|---|---|---|---|
| 31 | Pages `/en/` et `/zh/` avec `hreflang` | SEO-02 | 1 à 2 sem. |
| 32 | Relais serverless pour les formulaires | SEC-B | 1 à 2 j |
| 33 | Adresse sur le domaine + SPF / DKIM / DMARC | — | 4 h |
| 34 | Intégration continue (W3C, Lighthouse, `npm audit`) | — | 1 j |
| 35 | **Audit de l'application mobile et de Firebase** | — | à cadrer |

> **Note sur l'ordonnancement.** Les actions #20 et #21 semblent de simples travaux de propreté, mais elles **conditionnent** #22 : une CSP stricte interdit `'unsafe-inline'`, or le projet compte 246 attributs `style="…"` et 39+ attributs `onclick`. Les traiter dans cet ordre évite de déployer une CSP qui casserait le site, ou une CSP permissive qui ne protégerait rien.

---

# ATTESTATION DE NON-MODIFICATION

- ✅ **Aucun fichier source modifié, supprimé, déplacé ni reformaté**
- ✅ **Aucun commit, aucune branche, aucune Pull Request**
- ✅ **Aucun déploiement, aucune modification de configuration d'hébergement ou de service tiers**
- ✅ **Aucune commande d'écriture exécutée** — ni `npm install`, ni `npm audit fix`, ni opération Git d'écriture
- ✅ **Tous les correctifs proposés le sont sous forme de blocs de code à copier**, jamais appliqués
- ✅ **Seul fichier créé** : `RAPPORT_REVUE_CODE_ALFA_WEBSITE_2026-07-30.md`
- ✅ Les rapports antérieurs sont intacts

```
$ git diff --name-only HEAD
(aucun résultat — aucun fichier suivi modifié)
```

---

*Revue réalisée le 30 juillet 2026 — analyse statique en lecture seule de `alfa_Website`, branche `main`, commit `582798b`. 13 182 lignes de code examinées.*

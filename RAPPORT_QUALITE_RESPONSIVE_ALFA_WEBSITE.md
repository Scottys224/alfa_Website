# Rapport d'audit — Qualité du code, interface et responsive
## alfa_Website

| | |
|---|---|
| **Dépôt** | `C:\Users\alpha\Desktop\alfa_Website` |
| **Branche** | `main` (commit `9811f63`) |
| **Date** | 27 juillet 2026 |
| **Type** | Site vitrine statique 12 pages (HTML/CSS/JS vanilla, sans build) |
| **Périmètre** | 100 % des fichiers suivis par Git — **162 fichiers** |
| **Méthode** | **Analyse statique du code uniquement** — aucun navigateur disponible (voir §22) |
| **Mode** | Lecture seule — aucun fichier source modifié, aucun commit, aucune branche, aucune PR, aucune dépendance installée ou mise à jour |

> ### ⚠️ Avertissement méthodologique
>
> **Le point 10 de la demande (test réel en navigateur) n'a pas pu être réalisé.** Le répertoire `node_modules/` est absent et la consigne interdit toute installation de dépendances : Puppeteer, bien que déclaré dans `package.json`, n'est donc pas exécutable. Aucun autre environnement de prévisualisation n'était disponible.
>
> Tous les constats sont **déduits de la lecture du code** et de calculs déterministes (contrastes WCAG, arithmétique de cascade CSS, traçage du flux JavaScript). Chaque problème porte la mention **« Détecté dans le code »** — **aucun n'est « Confirmé visuellement »**.
>
> Cette limite n'affecte pas tous les constats de la même façon. Les bugs de câblage JavaScript (§9) et les conflits de cascade CSS (§10) sont **vérifiables par simple recherche textuelle** et reproduits dans ce rapport (confiance 9-10/10). Les ratios de contraste sont arithmétiquement certains. Les jugements de rendu et de débordement reposent sur des hypothèses de largeur de texte et sont donnés à 70-85 %.
>
> **Ce rapport remplace une version antérieure** du 25 juillet 2026 (commit `89daccb`, 94 fichiers), devenue obsolète : le dépôt a depuis converti toutes ses images en WebP, généralisé le `lazy loading` et corrigé plusieurs points que l'ancienne version signalait comme critiques.

---

## 1. Résumé exécutif

`alfa_Website` a **nettement progressé** depuis l'audit précédent. Les corrections sont réelles et mesurables :

- **74 images converties en WebP** — `nourriture.html` passe de 7,35 Mo à **1,79 Mo** (−76 %) ;
- **`width` et `height` explicites sur les 94 balises `<img>`** — le décalage de mise en page (CLS) est éliminé ;
- **`loading="lazy"` correctement ciblé** — 59 images sur 61 dans `nourriture.html`, 10 sur 12 dans `index.html`, les logos restant volontairement en chargement immédiat ;
- **`:focus-within` ajouté sur les menus déroulants** — ils sont désormais utilisables au clavier ;
- **couleur primaire assombrie** (`#10B981` → `#047857`) — le bouton principal passe de 2,54:1 à **5,49:1**, conforme WCAG AA ;
- **`overflow-x: hidden` global supprimé**, **identifiants dupliqués éliminés**, **polices auto-hébergées** en woff2 avec `font-display: swap` et découpage `unicode-range` ;
- bannière cookies exemplaire : `role="dialog"`, `aria-modal`, cibles tactiles de 44 px.

Ce socle est sain. Mais l'audit met au jour **deux défauts de câblage qui cassent silencieusement les parcours de conversion** — et qu'aucune relecture visuelle rapide ne révèle, puisque le code « a l'air » correct :

1. **Les boutons de téléchargement ne fonctionnent pas.** `telechargement.html` appelle `smartLink()` depuis 7 gestionnaires ; cette fonction **n'est définie nulle part**. Chaque clic lève une `ReferenceError` et ne fait rien. C'est la page dont c'est l'unique raison d'être.
2. **Deux formulaires sur quatre affichent une erreur après un envoi réussi.** `chauffeur.html` et `commercant.html` déclarent `data-succes="driver-success"` / `"merchant-success"`, mais le bloc de confirmation porte l'identifiant `id="form-success"`. Le message part bien chez Web3Forms, puis le code plante en cherchant un élément inexistant et affiche *« Une erreur s'est produite »*. Les candidats chauffeurs et commerçants concluent à un échec : ils renoncent, ou renvoient en double.

Trois autres problèmes pèsent sur l'usage réel :

3. **Les quatre pages légales n'ont aucune marge latérale sur mobile.** `.legal-content { padding: 140px 0 80px }` écrase `.container { padding: 0 24px }` par simple ordre de cascade. Le texte des CGU, de la confidentialité, des cookies et des mentions légales touche les deux bords de l'écran en dessous de 800 px.
4. **Le bouton « Devenir chauffeur » est illisible** : blanc sur ambre `#F59E0B` donne **2,15:1**, très loin des 4,5:1 requis.
5. **Aucune image responsive.** 0 attribut `srcset` sur 94 images : des fichiers de 1920 px de large sont envoyés tels quels à des téléphones de 320 px.

**En résumé :** le site est correctement construit sur le fond et bien meilleur qu'il y a deux jours, mais **il ne convertit pas** — le téléchargement d'application est cassé et l'inscription partenaire semble échouer. Ces deux corrections représentent moins d'une heure de travail et sont de très loin les plus rentables du rapport.

---

## 2. Note globale : **62 / 100**

```
████████████████████████░░░░░░░░░░░░░░░░  62/100
```

| Axe | Note | Pondération | Appréciation | vs 25/07 |
|---|:---:|:---:|---|:---:|
| Responsive mobile | **62** / 100 | 25 % | Socle correct, 4 pages sans marge, plage tablette non traitée | ↗ +10 |
| Qualité du code | **58** / 100 | 20 % | Lisible, mais 2 bugs de câblage et beaucoup de code mort | ↗ +10 |
| Accessibilité | **61** / 100 | 20 % | Vrais progrès ; blocages clavier résiduels sur 6 modales | ↗↗ +23 |
| Performance | **70** / 100 | 20 % | WebP + lazy + CLS maîtrisé ; manque `srcset` | ↗↗↗ +35 |
| Expérience utilisateur | **55** / 100 | 15 % | Discours clair, mais conversions cassées | ↘ −3 |

**Calcul** : (62×0,25) + (58×0,20) + (61×0,20) + (70×0,20) + (55×0,15) = 15,5 + 11,6 + 12,2 + 14,0 + 8,25 = **61,55 → 62/100**

La performance et l'accessibilité progressent nettement. L'UX est la seule note en recul : les deux bugs de câblage (§9) coûtent plus, en usage réel, que tout ce qui a été corrigé.

## 3. Note responsive mobile : **62 / 100**

**Acquis :** `viewport` correct et identique sur les 12 pages, sans blocage du zoom. Grilles principales sûres (`minmax(min(300px, 100%), 1fr)`), `.phone-mockup { width: min(320px, 100%) }`, `aspect-ratio` sur les vignettes, effondrement en une colonne à 992 px et 768 px, `clamp()` pour les `h1` de chaque page.

**Manques :** aucune marge latérale sur 4 pages (É-1), pas d'images responsive (É-5), un bloc `@media (max-width: 480px)` inopérant à 60 %, une plage tablette 769-992 px non traitée (É-6), une régression de mise en page au changement d'orientation (É-4).

## 4. Note qualité du code : **58 / 100**

**Acquis :** séparation structure/style/comportement globalement respectée, `"use strict"`, design system par variables CSS, seulement 18 `!important` sur 1 394 lignes, aucun identifiant dupliqué, aucun `eval`, aucun sélecteur au-delà de 3 niveaux.

**Manques :** deux bugs de câblage bloquants, **29 scripts Node de développement** laissés à la racine, `js/gtranslate.js` mort (52 lignes jamais chargées) avec sa logique dupliquée à l'identique dans les 12 pages, `js/interactions.js` mort à ~90 %, sélecteurs CSS ciblant 4 classes inexistantes.

## 5. Note accessibilité : **61 / 100**

**Acquis :** un `<h1>` unique par page (12/12), `alt` sur 94 images (100 %), `:focus-visible` avec contour 3 px, `:focus-within` sur les menus, `lang="fr"`, bannière cookies exemplaire, classe `.sr-only` correcte, champs de formulaire en `font-size: 1rem`, zoom jamais bloqué.

**Manques :** 6 modales ouvertes depuis des `<div onclick>` sans `role` ni `tabindex`, aucune touche Échap, contraste non conforme sur le CTA chauffeur, cibles tactiles sous 44 px, `prefers-reduced-motion` totalement absent, `autocomplete` absent des formulaires.

## 6. Note performance : **70 / 100**

**Acquis :** 100 % WebP, `lazy loading` bien ciblé, dimensions explicites partout (CLS ≈ 0), polices auto-hébergées avec `font-display: swap` et `unicode-range`, `preconnect` vers les domaines Google Translate, CSS total de 43 Ko.

**Manques :** aucun `srcset`, `nourriture.html` à 1,79 Mo d'images, `filter: blur(120px)` sur un élément de 50vw, `backdrop-filter` sur l'en-tête fixe repeint à chaque défilement, quatre animations infinies, aucun `decoding="async"`.

## 7. Note expérience utilisateur : **55 / 100**

La navigation est claire, la proposition de valeur immédiatement compréhensible, les CTA visibles, le contenu bien rédigé et les formulaires courts. La note est tirée vers le bas par les deux parcours de conversion cassés (§9) : c'est une note d'**usage**, pas de conception.

---

## 8. Pages et fichiers examinés

**162 fichiers suivis** par Git, tous inclus dans le périmètre.

| Catégorie | Nombre | Volume analysé |
|---|---|---|
| Pages HTML | 12 | 10 550 lignes |
| Feuilles CSS | 3 | 1 819 lignes |
| JavaScript du site (`js/`) | 5 | 575 lignes |
| Scripts Node de développement (racine + `tools/`) | 29 | ~1 000 lignes |
| Images WebP | 74 | 6,8 Mo |
| Polices woff2 | 30 | 865 Ko |
| Configuration et divers | 9 | — |

**Les 12 pages :** `index.html`, `nourriture.html`, `livraison.html`, `telechargement.html`, `chauffeur.html`, `commercant.html`, `contact.html`, `aide.html`, `cgu.html`, `confidentialite.html`, `cookies.html`, `mentions-legales.html`.

**Les 5 fichiers JS du site :** `main.js` (108 l.), `interactions.js` (77 l.), `form-handler.js` (76 l.), `cookies-consent.js` (262 l.), `gtranslate.js` (52 l. — **jamais chargé**).

**Sans objet :** aucun `<table>`, aucun `<iframe>`, aucun `<video>` dans le dépôt. Les points correspondants de la demande ne s'appliquent pas.

---

## 9. Problèmes CRITIQUES

### 🔴 C-1 — Tous les boutons de téléchargement d'application sont inopérants

| | |
|---|---|
| **Gravité** | CRITIQUE |
| **Fichier** | `telechargement.html` lignes **329, 385, 416, 600** |
| **Page** | Télécharger l'application |
| **Largeur** | **Toutes** (320 → 1440 px) |
| **Confiance** | **10/10** |
| **Vérification** | Détecté dans le code |

**Preuve observée**

```html
<!-- telechargement.html:329 -->
<a class="btn-store" onclick="smartLink('client', 'android'); return false;">
```

Recherche exhaustive de la définition sur les 162 fichiers suivis :

```
$ grep -rn "function smartLink|smartLink *=" *.html js/*.js
→ aucun résultat
```

La logique équivalente existe dans `js/interactions.js:55-76`, mais elle s'attache aux éléments de classe `.smart-link` via `data-app` / `data-os`. Or :

```
$ grep -c "smart-link" *.html
→ 0 sur les 12 pages
```

Et `telechargement.html` ne charge que `js/main.js` (ligne 588) — `js/interactions.js` n'y est même pas inclus.

**Résultat attendu :** un clic ouvre l'application installée via `intent://`, ou bascule sur la fiche Google Play.
**Résultat actuel :** `Uncaught ReferenceError: smartLink is not defined`. Le `return false` empêche toute navigation de repli. **Rien ne se passe.**

**Impact utilisateur :** la page dont l'unique fonction est de distribuer les trois applications ne distribue rien. Aucun message d'erreur n'apparaît : l'utilisateur clique, constate l'absence de réaction, et quitte. Le tunnel d'acquisition est interrompu à son dernier maillon, sur les trois applications à la fois.

**Correction recommandée** — réutiliser la logique existante plutôt que redéfinir la fonction ; cela supprime au passage 7 gestionnaires en ligne.

```html
<!-- 1. Inclure le script, à côté de main.js (ligne 588) -->
<script src="js/interactions.js" defer></script>

<!-- 2. Convertir les 6 boutons — href sert de repli sans JavaScript -->
<a class="btn-store smart-link"
   data-app="client" data-os="android"
   href="https://play.google.com/store/apps/details?id=com.alfa.client">
  Télécharger sur Google Play
</a>
<!-- data-app = "client" | "merchant" | "driver", cf. interactions.js:49-53 -->
```

⚠ La bannière de la ligne 600 est injectée **après** le `DOMContentLoaded` de `interactions.js` : son lien ne sera pas capté par la boucle d'attachement. Il faut soit l'injecter avant, soit réattacher le gestionnaire après l'injection.

---

### 🔴 C-2 — Deux formulaires sur quatre affichent une erreur après un envoi réussi

| | |
|---|---|
| **Gravité** | CRITIQUE |
| **Fichiers** | `chauffeur.html:290` et `:412` — `commercant.html:270` et `:410` — `js/form-handler.js:65` |
| **Pages** | Devenir chauffeur, Devenir commerçant |
| **Largeur** | **Toutes** |
| **Confiance** | **10/10** |
| **Vérification** | Détecté dans le code |

**Preuve observée**

```html
<!-- chauffeur.html:290 — le formulaire désigne sa cible -->
<form id="driverForm" data-alfa-form data-succes="driver-success">

<!-- chauffeur.html:411-412 — mais le bloc de confirmation porte un autre identifiant -->
<div id="form-success" style="display: none; text-align: center; padding: 40px 0">
  <h3>Pré-inscription réussie !</h3>
```

Identique dans `commercant.html` : `data-succes="merchant-success"` face à `id="form-success"`.

Vérification croisée des quatre formulaires :

| Page | `data-succes` | Identifiant réel | État |
|---|---|---|---|
| `contact.html` | `contact-success` | `contact-success` | ✅ |
| `index.html` | `notify-success` | `notify-success` | ✅ |
| `chauffeur.html` | `driver-success` | `form-success` | ❌ |
| `commercant.html` | `merchant-success` | `form-success` | ❌ |

**Enchaînement exact** (`js/form-handler.js:63-72`) :

```js
if (data.success) {                                    // ✅ Web3Forms a bien accepté l'envoi
  form.style.display = "none";
  document.getElementById(form.dataset.succes).style.display = "block";
  //                     ↑ renvoie null → TypeError levée ici
} else { … }
} catch (err) {
  alert("Une erreur s'est produite : " + err.message); // ❌ message d'échec trompeur
  bouton.innerText = originalBtnText;
  bouton.disabled = false;
}
```

**Résultat attendu :** le formulaire disparaît, le bloc « Pré-inscription réussie ! » s'affiche.
**Résultat actuel :** le formulaire disparaît (la ligne précédente s'est exécutée), **puis** une alerte annonce *« Une erreur s'est produite : Cannot read properties of null (reading 'style') »*. L'utilisateur se retrouve devant une page vide portant un message d'échec — alors que sa candidature est bien arrivée.

**Impact utilisateur :** le candidat conclut à un échec. Soit il renonce, soit il recharge et renvoie, générant des doublons. Les deux formulaires touchés sont précisément ceux du recrutement de chauffeurs et de commerçants, c'est-à-dire l'offre même de la place de marché.

**Correction recommandée** — deux lignes, plus un garde-fou.

```html
<!-- chauffeur.html:412 -->
<div id="driver-success" style="display: none; …">

<!-- commercant.html:410 -->
<div id="merchant-success" style="display: none; …">
```

```js
// js/form-handler.js:63-68 — ne plus jamais transformer un succès en erreur
if (data.success) {
  const blocSucces = document.getElementById(form.dataset.succes);
  form.style.display = "none";
  if (blocSucces) {
    blocSucces.style.display = "block";
  } else {
    console.warn(`Bloc de confirmation introuvable : #${form.dataset.succes}`);
    alert("Votre message a bien été envoyé. Merci !");
  }
}
```

---

## 10. Problèmes ÉLEVÉS

### 🟠 É-1 — Les 4 pages légales n'ont aucune marge latérale sur mobile

| | |
|---|---|
| **Gravité** | ÉLEVÉE |
| **Fichiers** | `cgu.html:32`, `confidentialite.html`, `cookies.html`, `mentions-legales.html` — en conflit avec `css/style.css:85-89` |
| **Pages** | CGU, Confidentialité, Cookies, Mentions légales |
| **Largeur** | **320 → 800 px** (les 6 premières largeurs testées, et au-delà jusqu'à 800 px) |
| **Confiance** | **9/10** |
| **Vérification** | Détecté dans le code (cascade déterministe) |

**Preuve observée**

```html
<!-- cgu.html — la section cumule les deux classes -->
<section class="container legal-content">
```

```css
/* css/style.css:85-89 — chargé en premier (ligne 30 du <head>) */
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* cgu.html:32 — bloc <style> en ligne, chargé APRÈS (ligne 31 du <head>) */
.legal-content { padding: 140px 0 80px; max-width: 800px; margin: 0 auto; }
```

Les deux sélecteurs ont une spécificité identique (0-0-1-0). À spécificité égale, **la déclaration la plus tardive l'emporte** : `padding: 140px 0 80px` remplace intégralement `padding: 0 24px`. Le raccourci en trois valeurs impose `left` et `right` à **0**.

Ces 4 pages ne contiennent par ailleurs **aucune media query** — aucune correction n'intervient sur petit écran.

**Résultat attendu :** un texte juridique confortable, avec 24 px (ou 15 px sous 480 px) de respiration de chaque côté.
**Résultat actuel :** à 320 px, chaque ligne mesure exactement 320 px et touche les deux bords de la dalle. À 375 px, idem. Le retrait ne réapparaît qu'au-delà de 800 px, lorsque `max-width: 800px` prend le relais.

**Impact utilisateur :** lecture pénible, aspect non fini, et sentiment de négligence sur les pages qui doivent précisément inspirer confiance — celles qui portent l'engagement contractuel et les garanties de confidentialité. Le défaut est visible immédiatement, sans expertise.

**Correction recommandée** — dissocier les axes plutôt qu'utiliser le raccourci :

```css
/* Dans le bloc <style> des 4 pages légales */
.legal-content {
  padding-top: 140px;
  padding-bottom: 80px;
  /* padding-left / right hérités de .container : 24px, puis 15px sous 480px */
  max-width: 800px;
  margin: 0 auto;
}
```

---

### 🟠 É-2 — Le bouton « Devenir chauffeur » échoue au contraste (2,15:1)

| | |
|---|---|
| **Gravité** | ÉLEVÉE |
| **Fichiers** | `css/style.css:561-563` (`--color-driver` l. 21, `color: white !important` l. 179) ; `chauffeur.html:406` |
| **Pages** | `index.html` (section partenaires), `chauffeur.html` |
| **Largeur** | **Toutes** |
| **Confiance** | **10/10** (calcul WCAG 2.1) |
| **Vérification** | Détecté dans le code |

**Preuve observée**

```css
.btn-primary { color: white !important; }                    /* :179 */
.partner-section.driver-theme .btn-primary {
  background: var(--color-driver);                           /* :562 → #F59E0B */
}
```

```html
<!-- chauffeur.html:406 — même combinaison en style en ligne -->
<button type="submit" class="btn btn-primary btn-large mt-4"
        style="width: 100%; background: var(--color-driver)">
```

Luminance relative de `#F59E0B` : L = 0,4390. Contre le blanc (L = 1,0) :
**(1,0 + 0,05) / (0,4390 + 0,05) = 2,15:1**

| Exigence | Seuil | Résultat |
|---|---|---|
| WCAG AA, texte normal | 4,5:1 | ❌ **échec** (2,15) |
| WCAG AA, grand texte (≥ 24 px) | 3,0:1 | ❌ **échec** (2,15) |

L'échec vaut même pour le grand texte. Le bouton `btn-large` est en 1,1 rem (17,6 px), donc soumis au seuil strict de 4,5:1.

**Résultat attendu :** un libellé lisible par tous, y compris en plein soleil sur un écran d'entrée de gamme.
**Résultat actuel :** blanc sur ambre vif — un contraste que les utilisateurs malvoyants, presbytes ou simplement en extérieur ne peuvent pas déchiffrer.

**Impact utilisateur :** le CTA de recrutement des chauffeurs est le moins lisible du site. En Guinée, où la consultation se fait très majoritairement en extérieur et en plein jour, la luminosité ambiante aggrave l'échec. Il s'ajoute au bug C-2 sur la même page.

**Correction recommandée**

```css
/* Option A (recommandée) : texte sombre sur ambre → 8,6:1 */
.partner-section.driver-theme .btn-primary {
  background: var(--color-driver);
  color: #0F172A !important;           /* cohérent avec --color-secondary */
}

/* Option B : ambre assombri, texte blanc conservé → 4,6:1 */
:root { --color-driver-cta: #B45309; }
.partner-section.driver-theme .btn-primary { background: var(--color-driver-cta); }
```

L'ambre `#F59E0B` reste parfait pour les accents non textuels (`.feature-list li::before`, `h2 span`) : ces usages décoratifs relèvent du seuil 3:1 des composants graphiques, et non du texte.

---

### 🟠 É-3 — Les 6 modales « cuisine » sont inaccessibles au clavier

| | |
|---|---|
| **Gravité** | ÉLEVÉE |
| **Fichier** | `nourriture.html` l. **660, 665, 670, 675, 680, 685** (ouverture), **695, 795, 853, 890, 934, 1031** (modales), **1107-1117** (script) |
| **Page** | Livraison de nourriture |
| **Largeur** | **Toutes** |
| **Confiance** | **9/10** |
| **Vérification** | Détecté dans le code |

**Preuve observée**

```html
<!-- nourriture.html:660 — un <div> cliquable, ni focusable ni annoncé -->
<div class="cuisine-card" onclick="openModal('modal-locaux')">
```

```
$ grep -c 'cuisine-card[^>]*role=|cuisine-card[^>]*tabindex=' nourriture.html → 0
$ grep -c 'cuisine-modal[^>]*role='                            nourriture.html → 0
$ grep -rn "Escape" js/*.js *.html                             → aucun résultat
```

```js
// nourriture.html:1108-1116 — aucune gestion du focus
function openModal(id) {
  document.getElementById(id).classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeModal(event, id) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById(id).classList.remove("active");
  document.body.style.overflow = "";
}
```

Cinq défauts cumulés : (1) un `<div>` n'est pas dans l'ordre de tabulation ; (2) aucun `role="button"`, donc aucune annonce par lecteur d'écran ; (3) Entrée et Espace ne déclenchent rien ; (4) la modale n'a ni `role="dialog"` ni `aria-modal`, et le focus reste dans la page d'arrière-plan ; (5) Échap ne ferme rien et le focus n'est pas restitué.

**Résultat attendu :** parcourir les 6 catégories à la tabulation, ouvrir à Entrée, fermer à Échap, focus rendu à la carte d'origine.
**Résultat actuel :** un utilisateur au clavier ou au lecteur d'écran ne peut **ni percevoir ni ouvrir** ces 6 cartes. Le contenu qu'elles renferment — l'offre culinaire complète — lui est totalement invisible.

**Impact utilisateur :** exclusion complète des utilisateurs de technologies d'assistance sur la page produit principale. Violation de WCAG 2.1.1 (Clavier, A) et 4.1.2 (Nom, rôle, valeur, A).

**Correction recommandée** — utiliser un vrai `<button>`, qui apporte gratuitement le focus, l'ordre de tabulation, Entrée/Espace et le rôle ARIA.

```html
<button type="button" class="cuisine-card" data-modal="modal-locaux"
        aria-haspopup="dialog">
  <h3>Cuisine locale</h3>
</button>

<div class="cuisine-modal" id="modal-locaux"
     role="dialog" aria-modal="true" aria-labelledby="titre-locaux">
  <h2 id="titre-locaux">Cuisine locale</h2>
  …
</div>
```

```js
let declencheur = null;

function openModal(id) {
  const modale = document.getElementById(id);
  if (!modale) return;
  declencheur = document.activeElement;
  modale.classList.add("active");
  document.body.style.overflow = "hidden";
  modale.querySelector("button, a, h2")?.focus();
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove("active");
  document.body.style.overflow = "";
  declencheur?.focus();                     // focus restitué
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const ouverte = document.querySelector(".cuisine-modal.active");
  if (ouverte) closeModal(ouverte.id);
});
```

Prévoir une réinitialisation CSS du `<button>` (`background: none; border: 0; text-align: inherit; font: inherit; width: 100%`) pour conserver le rendu actuel.

---

### 🟠 É-4 — Le changement d'orientation casse l'en-tête si le menu mobile est ouvert

| | |
|---|---|
| **Gravité** | ÉLEVÉE |
| **Fichier** | `js/main.js:52-64` |
| **Pages** | **Les 12** |
| **Largeur** | **≤ 768 px**, après un passage par > 768 px (rotation) |
| **Confiance** | **8/10** |
| **Vérification** | Détecté dans le code |

**Preuve observée**

```js
// js/main.js:52-64
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'row';
        navLinks.style.position = 'static';
        …
    } else if (mobileMenuBtn.getAttribute("aria-expanded") !== "true") {
        navLinks.style.display = 'none';       // ← jamais atteint si le menu est resté « ouvert »
    }
});
```

**Séquence reproductible :**

1. À 390 px (portrait), l'utilisateur ouvre le menu → `aria-expanded = "true"`, style en ligne `display: flex; position: absolute`.
2. Il bascule en paysage (844 px > 768) → la première branche applique `display: flex; flex-direction: row; position: static`. `aria-expanded` **reste à `"true"`**.
3. Il revient en portrait (390 px) → `innerWidth > 768` est faux ; la branche `else if` teste `aria-expanded !== "true"`, ce qui est **faux** → **aucune réinitialisation**.

L'élément conserve son style en ligne `display: flex; flex-direction: row; position: static`. Or un style en ligne l'emporte sur `@media (max-width: 768px) { .nav-links { display: none } }` (`css/style.css:879-881`).

**Résultat attendu :** au retour en portrait, la navigation redevient le menu mobile, ou disparaît derrière le bouton burger.
**Résultat actuel :** la navigation **de bureau complète** — 6 liens, 2 menus déroulants et le bouton « Télécharger l'app » — se rend en ligne dans un en-tête de 390 px de large. `flex-wrap: wrap` (`style.css:140`) la répartit sur 3 à 4 rangées qui débordent d'un en-tête à `min-height: 80px`, lequel est en `position: fixed` et recouvre le début du contenu. Le bouton burger affiche encore la croix « ✕ ».

**Impact utilisateur :** en-tête cassé recouvrant le contenu, sur les 12 pages. La situation se résorbe après un clic sur le burger, mais l'utilisateur n'a aucune raison de deviner ce geste. La rotation d'écran est un usage courant, notamment pour consulter les photos de plats.

**Correction recommandée** — centraliser la fermeture et supprimer les styles en ligne au lieu de les écraser.

```js
function fermerMenuMobile() {
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    navLinks.removeAttribute("style");        // rend la main à la feuille de styles
    mobileMenuBtn.innerHTML = ICONE_BURGER;
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.removeAttribute("style");    // le CSS de bureau reprend la main
        mobileMenuBtn.setAttribute("aria-expanded", "false");
    } else {
        fermerMenuMobile();                   // sans condition
    }
});
```

Supprimer les styles en ligne plutôt que les écraser élimine toute la classe de bugs où JavaScript et CSS se disputent la même propriété.

---

### 🟠 É-5 — Aucune image responsive : 0 `srcset` sur 94 images

| | |
|---|---|
| **Gravité** | ÉLEVÉE |
| **Fichiers** | Les 12 pages ; principalement `nourriture.html` (61 images) et `index.html` (12) |
| **Pages** | Toutes, `nourriture.html` en premier lieu |
| **Largeur** | **320 → 480 px** (impact maximal) |
| **Confiance** | **9/10** |
| **Vérification** | Détecté dans le code |

**Preuve observée**

```
$ tr '\n' ' ' < nourriture.html | grep -o '<img[^>]*>' | grep -c srcset  → 0
(identique sur les 12 pages : 0 / 94)
```

Dimensions intrinsèques déclarées dans `nourriture.html` :

| Dimensions | Occurrences |
|---|---|
| 1920 × 1280 | 2 |
| 810 × 1440 | 2 |
| 768 × 1024 | 2 |
| 736 × 1104 | 3 |
| 640 × 800 | 2 |

Poids d'images par page :

| Page | Images uniques | Poids |
|---|---|---|
| `nourriture.html` | 45 | **1 787 Ko** |
| `index.html` | 11 | 122 Ko |
| `livraison.html` | 2 | 103 Ko |
| 9 autres pages | 1 (logo) | 10 Ko |

Le logo est déclaré en `width="1254" height="1254"` et rendu à 64 px de haut (`.header-logo-img`, `style.css:899`) — un facteur 19 en surface décodée, sur les 12 pages.

**Résultat attendu :** un téléphone de 360 px reçoit des images d'environ 360 à 720 px de large.
**Résultat actuel :** il reçoit les fichiers pleine résolution, jusqu'à 1920 px. Le `lazy loading` (59/61) étale la charge dans le temps mais ne réduit **ni les octets transférés ni le coût de décodage**.

**Impact utilisateur :** sur une connexion 3G à ~400 Ko/s, `nourriture.html` demande **plus de 4 secondes** rien qu'en images, plus le décodage sur un processeur modeste. La page catalogue — celle qui doit donner envie — est la plus lente du site. Coût de données réel pour l'utilisateur, sur un marché où le forfait se compte en mégaoctets.

**Correction recommandée** — générer 2 à 3 variantes par photo et décrire l'emplacement réel.

```html
<img src="assets/images/sauce-arachide-800.webp"
     srcset="assets/images/sauce-arachide-400.webp   400w,
             assets/images/sauce-arachide-800.webp   800w,
             assets/images/sauce-arachide-1600.webp 1600w"
     sizes="(max-width: 480px) 100vw,
            (max-width: 992px) 50vw,
            300px"
     width="800" height="800"
     loading="lazy" decoding="async"
     alt="Sauce arachide">
```

Le script `convert_images.js` déjà présent et la dépendance `sharp` déclarée permettent de produire ces variantes sans nouvel outillage. Ajouter `decoding="async"` sur les 94 images est par ailleurs un gain immédiat et sans risque.

---

### 🟠 É-6 — Plage tablette 769-992 px : la navigation déborde de l'en-tête

| | |
|---|---|
| **Gravité** | ÉLEVÉE |
| **Fichiers** | `css/style.css:136-141` (`.nav-links`), `:122` (`min-height: 80px`), `:209` (`.hero`) |
| **Page** | `index.html` en priorité ; en-tête commun aux 12 |
| **Largeur** | **769 → 992 px** — couvre l'iPad portrait (768/810 px), marge basse de la largeur testée 1024 px |
| **Confiance** | **7,5/10** |
| **Vérification** | Détecté dans le code — **à confirmer visuellement en priorité** |

**Preuve observée**

Le basculement vers le menu burger n'intervient qu'à 768 px (`style.css:878-885`). Entre 769 et 992 px, la navigation complète reste affichée :

```css
.nav-links { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.nav-container { display: flex; justify-content: space-between; min-height: 80px; }
```

À 800 px, `.container` offre 752 px utiles. Contenu à placer sur une ligne :

| Élément | Largeur estimée |
|---|---|
| Logo (image 48-64 px + « alfa. ») | ~120 px |
| 6 liens (Accueil → Contact) à 0,95 rem | ~300 px |
| Bouton « Devenir partenaire » + chevron | ~180 px |
| Sélecteur de langue (icône + « FR ») | ~70 px |
| Bouton « Télécharger l'app » | ~160 px |
| 8 espaces `gap: 16px` | ~128 px |
| **Total** | **~958 px** pour 752 px disponibles |

`flex-wrap: wrap` fait donc passer la navigation sur **2 rangées**, portant l'en-tête à environ 130-140 px. Or `min-height: 80px` ne fixe qu'un plancher, et l'en-tête est en `position: fixed` — il ne pousse pas le contenu.

**Résultat attendu :** une navigation sur une ligne, ou le menu burger.
**Résultat actuel :** en-tête sur 2 rangées d'environ 130 px, alors que `.hero` ne réserve que **88 px** de padding supérieur (`style.css:209`). Le `h1` et le début du sous-titre passent **sous l'en-tête fixe**. Les ancres sont également décalées : `section[id] { scroll-margin-top: 100px }` (`:1338`) suppose lui aussi un en-tête d'environ 80-100 px.

Les 11 autres pages réservent 140 à 160 px en haut (`.legal-content`, `.page-header`, `.service-hero`, `.download-hero`) et absorbent le débordement — **`index.html` est la seule page exposée au recouvrement**, mais l'en-tête à deux rangées reste inesthétique partout.

**Impact utilisateur :** sur iPad portrait et sur les tablettes Android de 800 à 1000 px, la page d'accueil s'ouvre sur un titre tronqué. C'est la première impression du visiteur.

**Correction recommandée**

```css
/* Basculer en menu burger dès 992px, là où la navigation ne tient plus */
@media (max-width: 992px) {
  .nav-links       { display: none; }
  .mobile-menu-btn { display: block; }
}

/* Compensation robuste, indépendante de la hauteur réelle de l'en-tête */
:root { --hauteur-header: 80px; }
.header     { min-height: var(--hauteur-header); }
.hero       { padding-top: calc(var(--hauteur-header) + 8px); }
section[id] { scroll-margin-top: calc(var(--hauteur-header) + 20px); }
```

Solution plus durable : mesurer la hauteur réelle de l'en-tête au chargement et au redimensionnement, puis l'écrire dans `--hauteur-header` — l'en-tête peut alors changer de hauteur sans jamais recouvrir le contenu.

---

## 11. Problèmes MOYENS

### 🟡 M-1 — Le champ « Être notifié » provoque un zoom automatique sur iPhone

**Fichier :** `css/style.css:1169-1176` — **Page :** `index.html` (Zones desservies) — **Largeur :** ≤ 480 px, iOS — **Confiance :** 8,5/10 — Détecté dans le code

```css
.notify-form input {
    flex: 1;
    padding: 12px 16px;
    /* aucune font-size déclarée */
}
```

Aucune règle globale `input { font: inherit }` n'existe dans le dépôt : le champ retombe sur la taille par défaut de l'agent utilisateur (~13,33 px). **Safari iOS zoome automatiquement la page dès qu'un champ de moins de 16 px reçoit le focus**, et ne dézoome pas au `blur`.

Les champs `.form-control` des 3 autres formulaires déclarent bien `font-size: 1rem` — l'incohérence ne touche que ce champ.

**Impact :** l'utilisateur tape son e-mail, la page saute à ~130 % et y reste ; la mise en page paraît cassée et la navigation exige un dézoom manuel.

```css
.notify-form input { font-size: 1rem; }        /* 16px : seuil iOS */
/* ou, préventivement, pour tout le site : */
input, textarea, select, button { font: inherit; }
```

---

### 🟡 M-2 — `prefers-reduced-motion` totalement absent, 4 animations infinies

**Fichiers :** `css/style.css:1258` (`pulse-green`), `:1284-1320` (`slideFade2/3/4`), `nourriture.html:474` (`slideFade 65s infinite`) — **Pages :** les 12 — **Largeur :** toutes — **Confiance :** 9,5/10 — Détecté dans le code

```
$ grep -rn "prefers-reduced-motion" css/ *.html  → aucun résultat
```

Quatre animations tournent **en boucle sans fin** : la pastille verte du pied de page (sur les 12 pages) et trois carrousels de captures d'écran. Aucun moyen de les arrêter.

**Impact :** inconfort réel pour les personnes sujettes aux troubles vestibulaires ou au déficit d'attention ; consommation continue de batterie et de GPU. Violation de WCAG 2.3.3 (AAA) et de l'esprit de 2.2.2 (A) pour les contenus en mouvement automatique.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .status-dot { animation: none; }
  .mockup-slide, .slide-img { animation: none; opacity: 1; }
  .mockup-slide:not(:first-child), .slide-img:not(:first-child) { display: none; }
}
```

---

### 🟡 M-3 — Cibles tactiles sous le seuil de 44 px

**Fichiers :** `css/style.css:1053`, `:1335`, `:1347`, `:823-827` — **Pages :** les 12 — **Largeur :** ≤ 768 px — **Confiance :** 8,5/10 — Détecté dans le code

| Élément | Calcul | Hauteur | Seuil recommandé |
|---|---|---|---|
| `.dropdown-content a` (Commerçant / Chauffeur) | `4px` + `16 × 1,6` + `4px` | **~33,6 px** | 44 px |
| `.lang-switcher a` (FR / EN / 中文) | idem, `padding: 4px 10px` | **~33,6 px** | 44 px |
| `.footer-column a` | `16 × 1,6`, aucun padding | **~25,6 px** | 44 px |

Ces valeurs dépassent le minimum absolu de WCAG 2.5.8 (24 × 24 px, AA) mais restent nettement sous les 44 px des recommandations Apple HIG et les 48 dp de Material Design. Les liens du pied de page, à 25,6 px avec 12 px de séparation, sont les plus difficiles à viser.

**Impact :** erreurs de frappe fréquentes sur les deux liens menant aux formulaires partenaires et sur le sélecteur de langue — c'est-à-dire sur le multilinguisme, argument différenciant du site.

```css
.dropdown-content a               { padding: 12px 20px; }   /* → ~49 px */
.lang-switcher .dropdown-content a { padding: 12px 16px; }
.footer-column a                  { padding: 9px 0; margin-bottom: 4px; } /* → ~44 px */
```

Le remplacement des deux `!important` de `.dropdown-content a` par des valeurs normales est possible : aucune règle concurrente ne les justifie.

---

### 🟡 M-4 — `autocomplete` absent des 4 formulaires

**Fichiers :** `contact.html:408-455`, `chauffeur.html`, `commercant.html`, `index.html:733` — **Confiance :** 9/10 — Détecté dans le code

```
$ grep -c 'autocomplete=' *.html
→ 1 seule occurrence (aide.html, index.html : champ de recherche)
→ 0 sur les champs des formulaires
```

Aucun champ ne porte `autocomplete="given-name"`, `"family-name"`, `"email"` ou `"tel"`. Le navigateur ne peut pas proposer le remplissage automatique.

**Impact :** sur mobile, le candidat chauffeur saisit manuellement prénom, nom, e-mail et téléphone au clavier tactile. Chaque champ à taper augmente l'abandon. Violation de WCAG 1.3.5 (Identifier la finalité de la saisie, AA).

```html
<input type="text"  id="prenom" name="prenom" autocomplete="given-name"  required>
<input type="text"  id="nom"    name="nom"    autocomplete="family-name" required>
<input type="email" id="email"  name="email"  autocomplete="email"       required>
<input type="tel"   id="tel"    name="tel"    autocomplete="tel" inputmode="tel" required>
```

`inputmode="tel"` fait par ailleurs apparaître directement le pavé numérique.

---

### 🟡 M-5 — Déclaration CSS invalide : la transition de la carte est ignorée

**Fichier :** `css/style.css:1107` — **Page :** `index.html` (Zones desservies) — **Largeur :** > 768 px (survol) — **Confiance :** 9,5/10 — Détecté dans le code

```css
.map-img { transition: transform var(--transition); }
```

`--transition` vaut `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (`style.css:45`). Après substitution :

```css
transition: transform all 0.3s cubic-bezier(0.4, 0, 0.2, 1);   /* ← syntaxe invalide */
```

`transform` et `all` sont deux valeurs de `transition-property` : la déclaration entière est **rejetée par l'analyseur CSS**. `.map-img` n'a donc aucune transition, et l'effet `scale(1.03)` de `.map-container:hover` (`:1110-1112`) s'applique par saut.

```css
.map-img { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
```

Ce cas illustre le risque d'une variable contenant un raccourci complet : elle ne peut jamais être composée. Une variable `--easing: cubic-bezier(0.4, 0, 0.2, 1)` serait réutilisable sans piège.

---

### 🟡 M-6 — Le sommaire de la page Aide garde un double défilement sur mobile

**Fichier :** `aide.html:62-66` et `:147-150` — **Page :** Centre d'aide — **Largeur :** ≤ 768 px — **Confiance :** 8/10 — Détecté dans le code

```css
.help-sidebar {
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);   /* ← jamais réinitialisé */
  overflow-y: auto;                  /* ← jamais réinitialisé */
}

@media (max-width: 768px) {
  .help-sidebar { position: static; margin-bottom: 32px; }
  /* max-height et overflow-y persistent */
}
```

La media query neutralise le `position: sticky` mais laisse `max-height` et `overflow-y`. Sur mobile, le sommaire devient un bloc statique doté de **sa propre barre de défilement interne**, imbriquée dans le défilement de la page.

S'y ajoute le problème classique de `100vh` sur mobile : sur iOS Safari et Chrome Android, `100vh` correspond au viewport **barres d'outils masquées**. `calc(100vh - 120px)` dépasse donc la zone réellement visible lorsque les barres sont affichées.

**Impact :** défilement imbriqué déclenché involontairement — l'un des schémas les plus déroutants sur écran tactile.

```css
@media (max-width: 768px) {
  .help-sidebar {
    position: static;
    margin-bottom: 32px;
    max-height: none;      /* rendre la hauteur au contenu */
    overflow-y: visible;
  }
}
.help-sidebar { max-height: calc(100dvh - 120px); }   /* unité dynamique en bureau */
```

---

### 🟡 M-7 — Hiérarchie de titres : un niveau sauté sur 3 pages

**Fichiers :** `telechargement.html:296` → `:318` ; `index.html` ; `nourriture.html` — **Confiance :** 9/10 — Détecté dans le code

```
telechargement.html : h1 → h3   (aucun h2 avant la ligne 431)
index.html          : h2 → h4   (section sécurité, puis colonnes du pied de page)
nourriture.html     : h2 → h4
```

`telechargement.html` est le cas le plus net : le `<h1>` de la ligne 296 est immédiatement suivi de trois `<h3>` (l. 318, 374, 405) pour « alfa Client », « alfa Commerçant » et « alfa Chauffeur », sans `<h2>` intermédiaire.

**Impact :** un lecteur d'écran navigue par niveaux de titre ; un saut suggère un contenu manquant. Effet SEO secondaire mais réel sur la compréhension de la structure.

```html
<h1 class="section-title">Téléchargez <span>alfa</span></h1>
<h2 class="sr-only">Nos trois applications</h2>   <!-- .sr-only existe déjà, style.css:1386 -->
<h3>alfa Client</h3>
```

Pour le pied de page, `.footer-column h4` devrait devenir `h2` (région autonome) ou `h3`.

---

### 🟡 M-8 — GTranslate : 52 lignes mortes et 12 copies divergentes

**Fichiers :** `js/gtranslate.js` (fichier entier) ; blocs en ligne des 12 pages — **Confiance :** 9,5/10 — Détecté dans le code

```
$ grep -l 'js/gtranslate.js' *.html  → aucune page ne charge ce fichier
```

Les 52 lignes de `js/gtranslate.js` sont **totalement inertes**. La même logique (`doGTranslate`, `googleTranslateElementInit2`, `GTranslateFireEvent`) est recopiée dans un bloc `<script>` sur chacune des 12 pages, soit **environ 600 lignes dupliquées**.

Les copies ont divergé — le délai de réessai n'est pas le même :

```
$ grep -o '}, [0-9]*);' *.html | sort | uniq -c
→ chaque page contient à la fois }, 10);  }, 50);  et  }, 500);
```

`js/gtranslate.js:47` utilise **500 ms** ; la copie en ligne de `nourriture.html:1425` utilise **50 ms**. Deux implémentations du même mécanisme coexistent avec des comportements différents.

**Impact :** toute correction sur la traduction doit être répétée 12 fois, avec un fichier de référence trompeur qui n'est jamais exécuté. C'est la principale dette de maintenabilité du projet.

**Correction :** conserver `js/gtranslate.js` comme source unique, l'inclure via `<script src="js/gtranslate.js" defer></script>` dans les 12 pages, et supprimer les blocs en ligne.

---

### 🟡 M-9 — `js/interactions.js` est mort à ~90 %

**Fichier :** `js/interactions.js:9-46` et `:55-76` — **Confiance :** 9,5/10 — Détecté dans le code

```
$ grep -c 'modal-trigger' *.html       → 0 sur les 12 pages
$ grep -c 'smart-link'    *.html       → 0 sur les 12 pages
$ grep -c 'data-annee-courante' *.html → 1 sur chacune des 12 pages ✅
```

Sur 77 lignes, **seul le bloc « année du copyright » (l. 2-5) s'exécute réellement**. Les gestionnaires de modales (l. 9-46) et de liens intelligents (l. 55-76) ne trouvent aucun élément correspondant. Le seul sélecteur partiellement actif est `.modal-close`, présent dans `nourriture.html` — mais le gestionnaire y lit `el.dataset.modal`, qui vaut `undefined`, et ne fait rien : la fermeture repose entièrement sur l'`onclick` en ligne.

Le fichier contient en outre du code mort explicite :

```js
// js/interactions.js:24-30 — un bloc if dont le corps ne contient que des commentaires
if (e && e.target !== el && !el.classList.contains('close-modal')) {
    // Wait, if it's the overlay (which usually has modal-close), we close it.
}
```

**Impact :** deux mécanismes de modales concurrents cohabitent sur `nourriture.html`, dont un inopérant. Un développeur qui corrigerait `interactions.js` en pensant agir sur les modales n'obtiendrait aucun effet. Ce fichier est aussi la cause directe du bug C-1.

---

### 🟡 M-10 — Aucune donnée structurée (JSON-LD)

**Fichiers :** les 12 pages — **Confiance :** 10/10 — Détecté dans le code

```
$ grep -c 'application/ld+json' *.html  → 0 sur les 12 pages
```

Le socle SEO est pourtant complet (§19) : il ne manque que le balisage sémantique.

**Impact :** pas d'éligibilité aux résultats enrichis. Trois schémas apporteraient un gain direct : `LocalBusiness` (zone de service Conakry, téléphone), `FAQPage` (`index.html` et `aide.html` contiennent déjà de nombreuses paires question/réponse), `SoftwareApplication` (les trois applications mobiles).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "alfa",
  "description": "Commandes de nourriture, livraisons et déplacements en Guinée",
  "url": "https://www.alfa.com.gn/",
  "telephone": "+224614878886",
  "areaServed": { "@type": "City", "name": "Conakry", "addressCountry": "GN" }
}
</script>
```

---

### 🟡 M-11 — `404.html` n'existe pas alors que trois configurations y redirigent

**Fichiers :** `netlify.toml:11,16` — `vercel.json:28,33` — `.htaccess:16` — **Confiance :** 9,5/10 — Détecté dans le code

```
$ ls 404.html  → fichier absent
```

`netlify.toml` et `vercel.json` redirigent `/.git/*` et `/seo_update.js` vers `/404.html`, page inexistante. Sur les deux plateformes, la cible de repli sera la page 404 générique — sans en-tête, sans pied de page, sans identité alfa.

**Impact :** double. Toute faute de frappe dans une URL, tout lien mort depuis un moteur de recherche, aboutit à une page vide dépourvue de navigation : l'utilisateur quitte le site au lieu d'être ramené vers l'accueil. Les règles de blocage ne se comportent pas non plus comme prévu.

**Correction :** créer une `404.html` reprenant l'en-tête et le pied de page du site, avec un lien de retour à l'accueil et vers les trois pages de service. Déclarer ensuite le repli (`[[redirects]] from = "/*" to = "/404.html" status = 404`).

---

### 🟡 M-12 — Boucle de réessai infinie sur la traduction

**Fichiers :** les 12 pages et `js/gtranslate.js:45-49` — **Confiance :** 8,5/10 — Détecté dans le code

```js
if (/* le widget Google Translate n'est pas prêt */) {
    setTimeout(function () { doGTranslate(lang_pair); }, 50);   // aucun compteur, aucun abandon
}
```

Aucune limite de tentatives, aucun délai croissant. Si `translate.google.com` est inaccessible — réseau coupé, bloqueur de publicités, restriction réseau, simple lenteur — la fonction se rappelle **toutes les 50 ms indéfiniment**. Chaque nouveau clic sur une langue démarre une chaîne supplémentaire, qui s'ajoute aux précédentes.

**Impact :** consommation CPU continue et batterie qui se vide, sans aucun retour à l'utilisateur : il clique sur « English », rien ne se produit, il reclique — et aggrave la situation. Scénario très plausible sur une connexion mobile instable, soit le contexte d'usage principal du site.

```js
function doGTranslate(lang_pair, tentative = 0) {
  …
  if (widgetIndisponible) {
    if (tentative >= 20) {                       // ~10 s d'attente maximale
      console.warn("Google Translate indisponible.");
      alert("La traduction est momentanément indisponible. Réessayez plus tard.");
      return;
    }
    setTimeout(() => doGTranslate(lang_pair, tentative + 1), 500);
    return;
  }
  …
}
```

---

### 🟡 M-13 — Charte graphique : des couleurs indigo/rose subsistent sur une identité vert émeraude

**Fichiers :** `css/style.css:29`, `:37`, `:300`, `:414`, `:1127` — **Confiance :** 8,5/10 — Détecté dans le code

La couleur primaire est passée à `#047857` (vert émeraude), mais plusieurs valeurs de l'ancienne charte sont restées en dur :

| Ligne | Déclaration | Problème |
|---|---|---|
| 29 | `--gradient-primary: linear-gradient(135deg, #4F46E5, #EC4899)` | Indigo → rose, appliqué au `h1` de l'accueil (`.text-gradient`) et au fond de la section CTA |
| 37 | `--shadow-glow: 0 0 20px rgba(79, 70, 229, 0.4)` | Halo **indigo** au survol d'un bouton **vert** (`.btn-primary:hover`, `.step-number`) |
| 300 | `.platform-badge { background: rgba(79, 70, 229, 0.1); color: var(--color-primary) }` | Fond indigo, texte vert |
| 414 | `.card-icon { background: #E0E7FF }` (indigo-100) | Fond indigo, icône verte |
| 1127 | `.commune-pill { background: rgba(79, 70, 229, 0.1) }` | Idem |

**Impact :** le mot mis en avant dans le titre principal (« Guinée. ») s'affiche en dégradé indigo-rose, sans rapport avec l'identité verte du reste de la page. L'incohérence est la plus visible à l'endroit le plus regardé du site.

À signaler également : `.cta-section` utilise ce dégradé comme fond avec du texte blanc. Le contraste est de **6,29:1 côté indigo** mais tombe à **3,53:1 côté rose** — conforme pour le `h2` en 2,5 rem (grand texte, seuil 3:1), **non conforme** pour le paragraphe `.cta-text p` en 1,1 rem, qui exige 4,5:1.

```css
:root {
  --gradient-primary:  linear-gradient(135deg, #047857 0%, #0EA5E9 100%);
  --shadow-glow:       0 0 20px rgba(4, 120, 87, 0.4);
  --color-primary-10:  rgba(4, 120, 87, 0.1);
}
.platform-badge, .commune-pill, .card-icon { background: var(--color-primary-10); }
```

---

## 12. Problèmes FAIBLES

| # | Constat | Fichier / ligne | Confiance |
|---|---|---|---|
| F-1 | **Le bloc `@media (max-width: 480px)` est inopérant à 60 %.** `grid-template-columns: 1fr !important` cible `.services-grid`, `.features-grid`, `.stats-grid` — **ces trois classes n'existent dans aucune page** — et `.footer-links-grid`, qui est en `display: flex` (la propriété n'a donc aucun effet). `.hero-buttons` est également inexistante. | `css/style.css:1359-1361`, `:1370-1379` | 9,5/10 |
| F-2 | **`* { max-width: 100% }`** appliqué à tous les éléments sous 480 px : palliatif global qui masque les débordements au lieu de les corriger, et empêche tout conteneur à défilement horizontal volontaire. | `css/style.css:1352-1355` | 8/10 |
| F-3 | **Règle strictement dupliquée** : `.lang-switcher .dropdown-content a { padding: 4px 10px !important }` déclarée deux fois à l'identique, à 12 lignes d'intervalle. | `css/style.css:1335` et `:1347` | 10/10 |
| F-4 | **Variable CSS non définie** : `var(--color-primary-dark, #066044)` — `--color-primary-dark` n'existe pas dans `:root`. Le repli fonctionne, mais `#066044` échappe au design system. | `css/cookies-consent.css:74-75` | 9,5/10 |
| F-5 | **`alt="logo"` non descriptif** sur les 24 occurrences du logo (en-tête + pied de page × 12 pages). Le logo étant accompagné du texte « alfa », `alt=""` (décoratif) serait plus juste et éviterait la redondance à l'oral. | Les 12 pages | 9/10 |
| F-6 | **`<style>` placé dans `<body>`**, à l'intérieur d'un `<div>`. Toléré par les navigateurs, non conforme à la spécification HTML. | `nourriture.html:465` | 9/10 |
| F-7 | **36 liens `href="javascript:void(0)"`** pour le sélecteur de langue (3 par page × 12). Un `<button type="button">` est l'élément sémantiquement correct : ces éléments ne mènent nulle part. | Les 12 pages | 9/10 |
| F-8 | **13 blocs `catch (e) {}` vides** — `GTranslateFireEvent` sur 12 pages, plus `js/gtranslate.js:51` et `js/form-handler.js:11`. Toute défaillance de la traduction est avalée sans trace. | 12 pages + `js/` | 9,5/10 |
| F-9 | **`lang="fr"` figé** alors que le site propose EN et 中文. L'attribut n'est jamais mis à jour après traduction : les lecteurs d'écran prononcent l'anglais et le chinois avec la phonétique française. Aucune balise `hreflang` non plus. | Les 12 pages | 8,5/10 |
| F-10 | **Aucun `rel="preload"` sur la police latine critique.** Les 30 `@font-face` sont pourtant bien configurés. Précharger le seul sous-ensemble latin d'Inter 400 supprimerait le FOUT initial. | `assets/fonts/fonts.css` | 8/10 |
| F-11 | **Faux QR code décoratif** : `.qr-code-grid` est un `repeating-conic-gradient` imitant un QR code, et `.qr-placeholder` un carré en pointillés. Les visiteurs vont tenter de le scanner sans résultat. | `css/style.css:959-966`, `:275-286` | 8/10 |
| F-12 | **`.footer-column a:hover` → 3,26:1.** Le vert `#047857` sur le fond `#0F172A` du pied de page échoue au seuil AA de 4,5:1. L'état de repos (`rgba(255,255,255,0.7)` → 9,10:1) est conforme : c'est le survol qui dégrade la lisibilité. | `css/style.css:829-831` | 9,5/10 |
| F-13 | **`.btn-primary:hover` → 3,77:1.** L'état de repos est conforme (`#047857` → 5,49:1), mais le survol éclaircit le fond vers `#059669` et repasse sous le seuil. Contre-intuitif : le bouton devient moins lisible au moment de l'interaction. | `css/style.css:182-186` | 9,5/10 |
| F-14 | **`body { position: static !important; top: 0 !important }`** déclaré au milieu de la feuille pour neutraliser Google Translate. Rend impossible tout positionnement ultérieur du `body` et complique le débogage. | `css/style.css:1324` | 8/10 |
| F-15 | **`.faq-item summary::after`** positionné en `right: 24px`, exactement la valeur du `padding` du `summary`. Un intitulé de question long viendra chevaucher le signe `+` / `−` sur écran étroit. | `css/style.css:702-724` | 7,5/10 |

---

## 13. Problèmes spécifiques aux petits écrans (320 – 480 px)

Largeurs concernées : **320, 360, 375, 390, 412, 480 px**.

| Constat | Largeurs | Gravité | Renvoi |
|---|---|---|---|
| Texte des pages légales collé aux deux bords | 320 → 480 (et jusqu'à 800) | ÉLEVÉE | É-1 |
| Images pleine résolution (jusqu'à 1920 px) servies à des écrans de 320 px | 320 → 480 | ÉLEVÉE | É-5 |
| En-tête cassé après rotation avec menu ouvert | ≤ 768, après passage > 768 | ÉLEVÉE | É-4 |
| Zoom automatique iOS sur le champ « Être notifié » | ≤ 480 | MOYENNE | M-1 |
| Cibles tactiles à 25-34 px (menus, pied de page) | ≤ 768 | MOYENNE | M-3 |
| Double défilement du sommaire de la page Aide | ≤ 768 | MOYENNE | M-6 |

**Ce qui fonctionne correctement à 320 px** — vérifié par le calcul :

- `.container` : `320 − 30 = 290 px` de contenu utile (padding de 15 px sous 480 px) ;
- `.cards-grid { minmax(250px, 1fr) }` → 250 ≤ 290, **pas de débordement** ;
- `.security-grid` et `.reviews-grid` utilisent `minmax(min(300px, 100%), 1fr)`, la forme protégée : **aucun risque** ;
- `.cuisines-grid { minmax(250px, 1fr) }` → 250 ≤ 290, correct ;
- `.phone-mockup { width: min(320px, 100%) }` : bien borné ;
- `h1 { font-size: 2rem !important; word-wrap: break-word }` et `img { max-width: 100%; height: auto }` : garde-fous en place ;
- `.hero-actions` et `.cta-actions` passent en colonne avec des boutons pleine largeur dès 992 px ;
- bannière cookies : boutons pleine largeur empilés sous 600 px, `min-height: 44px` respecté ;
- images des modales et carrousels bornées par `width: 100%; height: 100%; object-fit: cover`.

**Point de vigilance non tranché :** `.ecosystem-card { padding: 40px 32px }` laisse `290 − 64 = 226 px` de contenu utile à 320 px. C'est étroit mais suffisant pour du texte courant, et aucun mot long n'a été identifié dans le contenu actuel. À confirmer visuellement.

---

## 14. Problèmes spécifiques aux tablettes (768 – 1024 px)

| Constat | Largeurs | Gravité | Renvoi |
|---|---|---|---|
| Navigation débordant sur 2 rangées → recouvrement du hero sur `index.html` | 769 → 992 | ÉLEVÉE | É-6 |
| Texte des pages légales sans marge latérale | jusqu'à 800 | ÉLEVÉE | É-1 |
| `.footer-links-grid { gap: 80px }` réduit à 40 px seulement à partir de 992 px | 769 → 992 | FAIBLE | §12 |

**Ce qui fonctionne correctement :**

- à **1024 px**, la navigation dispose de 976 px utiles : elle tient sur une ligne, l'anomalie É-6 ne s'applique plus ;
- `.hero-container`, `.feature-layout`, `.footer-top`, `.zones-layout`, `.service-container` (nourriture, livraison) et `.contact-content` passent tous en une colonne à 992 px ;
- `.help-content` (page Aide) passe en une colonne à 768 px ;
- `.form-row` des formulaires chauffeur et commerçant passe en une colonne à 768 px ;
- `.notify-form` passe en colonne avec bouton pleine largeur à 992 px.

La plage **769-992 px est le seul angle mort réel** du responsive : c'est là que le menu de bureau est encore actif alors que la place manque déjà.

---

## 15. Problèmes de qualité HTML, CSS et JavaScript

### 15.1 HTML

**Points conformes :** un `<h1>` unique sur 12/12 pages ; **aucun identifiant dupliqué** sur l'ensemble du dépôt ; structure sémantique correcte (`header` / `nav` / `main` / `section` / `footer`) ; `alt` sur 94/94 images ; `width` et `height` sur 94/94 images ; aucun attribut obsolète (`align`, `bgcolor`, `<center>`, `<font>`) ; `<label for>` correctement associé à tous les champs visibles des 4 formulaires ; aucune balise mal fermée détectée.

**À corriger :** hiérarchie de titres sautée sur 3 pages (M-7) ; `<div onclick>` utilisé comme bouton, 6 fois (É-3) ; `<style>` dans `<body>` (F-6) ; 36 `href="javascript:void(0)"` (F-7) ; `alt="logo"` non descriptif (F-5).

**Duplication de contenu :** l'en-tête (~95 lignes) et le pied de page (~110 lignes) sont recopiés à l'identique dans les 12 pages, soit environ **2 500 lignes dupliquées**. C'est inhérent à un site statique sans moteur de templates et ne constitue pas un défaut en soi — mais **toute correction de l'en-tête ou du pied de page doit être répétée 12 fois**, sans filet. Les 29 scripts `fix_*.js` et `restore_*.js` du dépôt sont précisément la trace de cette contrainte.

### 15.2 CSS

| Critère | Constat |
|---|---|
| Volume | 1 394 + 155 + 270 lignes (43 Ko) — raisonnable, non minifié |
| `!important` | **18** dans `style.css` — modéré ; 5 sont évitables |
| Sélecteurs complexes | Aucun au-delà de 3 niveaux — bon point |
| Règles dupliquées | 1 duplication exacte (F-3) |
| Styles inutilisés | `.services-grid`, `.features-grid`, `.stats-grid`, `.hero-buttons` — 4 classes stylées, 0 utilisée (F-1) |
| Variables | Bon design system, mais 5 couleurs de l'ancienne charte en dur (M-13) et 1 variable non définie (F-4) |
| Conflits de media queries | `h1/h2 { font-size !important }` sous 480 px **écrase les `clamp()`** définis dans chaque page. Pour `h1` l'effet est neutre (le minimum du clamp vaut déjà 2 rem), mais le mécanisme est fragile |
| `z-index` | Échelle saine et sans conflit : `.header` 1000, `.dropdown-content` 100, bannière cookies 9999, `.hero::before` −1 |
| `100vh` | Un seul usage problématique (M-6) ; `90vh` sur le panneau cookies (`cookies-consent.css:102`) mériterait `90dvh` |
| Unités | Bon équilibre `rem` / `%` / `min()` — mais seulement **5 usages** de `clamp()`/`min()`/`max()` dans `style.css` : la typographie de base reste en `rem` figés avec des paliers `!important` |
| Organisation | Fichier monolithique de 1 394 lignes, sections ajoutées en fin de fichier (« NOUVEAU FOOTER », « NOUVELLES ZONES ») et correctifs Google Translate intercalés (l. 1323-1347) |
| Animations coûteuses | `filter: blur(120px)` sur `50vw × 50vw` (l. 225) ; 3 `backdrop-filter` dont un sur l'en-tête fixe ; 4 animations infinies |
| Risques de débordement | Aucun identifié par le calcul aux 10 largeurs testées (voir §13) |

### 15.3 JavaScript

| Critère | Constat |
|---|---|
| Erreurs logiques | **2 bugs bloquants** (C-1, C-2) + la régression d'orientation (É-4) |
| Erreurs à l'exécution | `openModal` / `closeModal` sans garde `null` ; `form-handler.js:65` déréférence sans vérification (cause de C-2) |
| Variables globales | `doGTranslate`, `googleTranslateElementInit2`, `GTranslateFireEvent`, `openModal`, `closeModal` — inévitable avec des `onclick` en ligne, mais confirme l'intérêt de passer aux `addEventListener` |
| Fonctions trop longues | Aucune ; le gestionnaire `submit` de `form-handler.js` (60 lignes) reste lisible |
| Duplication | **~600 lignes** de GTranslate recopiées sur 12 pages, avec divergence (M-8) |
| Écouteurs multiples | 4 `DOMContentLoaded` distincts + blocs en ligne. Aucune double inscription détectée |
| Écouteurs non nettoyés | `resize` et `keydown` globaux et permanents — acceptable pour un site multi-pages sans SPA |
| Erreurs avalées | 13 `catch (e) {}` vides (F-8) |
| Validation de formulaire | `required` HTML5 + `type="email"` / `type="tel"` ; garde captcha contournable si le widget n'est pas encore rendu |
| Asynchrone | `async/await` avec `try/catch` correct dans `form-handler.js` ; aucune promesse non gérée détectée |
| Code mort | `js/gtranslate.js` (52 l.) + ~90 % de `js/interactions.js` (68 l.) + **29 scripts Node à la racine** |
| Logs | Sobres : 2 `console.error`, 2 `console.info`, tous dans `cookies-consent.js` et pertinents |
| Séparation des responsabilités | Correcte dans `js/`, mais contredite par ~50 `onclick` en ligne et 15 blocs `<script>` inline |

---

## 16. Problèmes d'accessibilité

**Récapitulatif WCAG 2.1 des écarts :**

| Critère | Niveau | Constat | Renvoi |
|---|---|---|---|
| 1.4.3 Contraste minimum | AA | CTA chauffeur 2,15:1 ; `.cta-text p` sur dégradé rose 3,53:1 ; `.footer-column a:hover` 3,26:1 ; `.btn-primary:hover` 3,77:1 | É-2, M-13, F-12, F-13 |
| 2.1.1 Clavier | A | 6 modales ouvertes depuis des `<div onclick>` | É-3 |
| 4.1.2 Nom, rôle, valeur | A | Aucun `role`/`tabindex` sur les cartes ; aucun `role="dialog"` sur les modales | É-3 |
| 2.1.2 Pas de piège au clavier | A | Aucun focus trap ni touche Échap dans les modales | É-3 |
| 1.3.5 Identifier la finalité | AA | `autocomplete` absent des 4 formulaires | M-4 |
| 2.3.3 / 2.2.2 Animation | AAA / A | `prefers-reduced-motion` absent, 4 animations infinies | M-2 |
| 2.5.5 Taille de la cible | AAA | 25,6 à 33,6 px au lieu de 44 px | M-3 |
| 1.3.1 Information et relations | A | Niveaux de titre sautés sur 3 pages | M-7 |
| 3.1.2 Langue d'un passage | AA | `lang` non mis à jour après traduction | F-9 |

**Points déjà conformes, à préserver :** `:focus-visible { outline: 3px solid; outline-offset: 3px }` sur l'ensemble du site (`style.css:1342-1345`) — dépasse les exigences AA ; `:focus-within` sur les menus déroulants, qui les rend pleinement utilisables au clavier ; bannière cookies avec `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` et boutons de 44 px ; `.sr-only` correctement implémentée ; `aria-label` sur le bouton de menu mobile ; champs de formulaire en 16 px ; `alt` sur 100 % des images ; `viewport` sans `user-scalable=no` — **le zoom à 200 % et à 400 % reste possible sur les 12 pages**.

**Zoom navigateur à 200 %** — analyse par le calcul : un affichage 1280 px zoomé à 200 % équivaut à 640 px de largeur logique. Le site bascule alors sur ses règles ≤ 768 px (menu burger, grilles en une colonne) et se comporte comme sur mobile. Les problèmes É-1 (marges des pages légales) et M-3 (cibles tactiles) s'y appliquent donc également. Aucun blocage supplémentaire identifié.

**Ordre de tabulation :** l'ordre du DOM est logique (logo → liens → menus → CTA → contenu → pied de page). Aucun `tabindex` positif — bonne pratique respectée. Il manque un **lien d'évitement** (« Aller au contenu principal ») : sur `aide.html`, un utilisateur au clavier doit traverser une dizaine d'éléments de navigation avant d'atteindre le contenu, et ce sur chaque page.

**Deux points mineurs sur le bouton de menu mobile :** `aria-expanded` est absent du HTML initial (il n'apparaît qu'après le premier clic), et l'`aria-label` reste « Ouvrir le menu » une fois le menu ouvert.

---

## 17. Problèmes de performance

**Progrès notables depuis le 25 juillet :** 74 images converties en WebP (`nourriture.html` : 7,35 Mo → 1,79 Mo, −76 %) ; `loading="lazy"` sur 59/61 et 10/12 images ; `width`/`height` sur 94/94 images, **éliminant le décalage de mise en page (CLS ≈ 0)** ; polices auto-hébergées en woff2 avec `font-display: swap` et découpage `unicode-range` — un navigateur francophone ne télécharge que les sous-ensembles latins, pas les 865 Ko complets.

**Ce qui reste à traiter :**

| Constat | Impact estimé | Renvoi |
|---|---|---|
| Aucun `srcset` sur 94 images | ~1,3 Mo évitables sur `nourriture.html` en 3G | É-5 |
| Logo 1254 × 1254 rendu à 64 px | Décodage inutile sur les 12 pages | É-5 |
| `filter: blur(120px)` sur `50vw × 50vw` (`style.css:225`) | Peinture GPU coûteuse au premier rendu | — |
| `backdrop-filter: blur(12px)` sur l'en-tête **fixe** (`:112`) | Recomposition **à chaque défilement** — le poste le plus lourd sur entrée de gamme | — |
| `backdrop-filter: blur(16px)` sur `.glass-card` (`:311`) | Coût additionnel au premier rendu | — |
| 4 animations infinies | Compositing permanent, batterie | M-2 |
| Aucun `decoding="async"` | Décodage synchrone bloquant le thread principal | É-5 |
| 3 fichiers CSS en chaîne bloquante (`fonts.css` → `style.css` → `cookies-consent.css`) | 3 aller-retours avant le premier rendu | — |
| Aucun `preload` sur la police critique | FOUT au chargement initial | F-10 |

**Scénario « téléphone d'entrée de gamme, 3G » sur `nourriture.html` :** 1,79 Mo d'images (dont ~1,3 Mo évitables) + 43 Ko de CSS + ~100 Ko de police latine + le script Google Translate. À 400 Ko/s, **plus de 5 secondes avant un rendu utile**, auxquelles s'ajoute le décodage de 45 images WebP dont plusieurs en 1920 px sur un processeur modeste. Le `lazy loading` étale la charge mais ne la réduit pas.

**Mise en cache :** aucune directive `Cache-Control` n'est déclarée dans `netlify.toml` ni `vercel.json`. Les plateformes appliquent leurs valeurs par défaut — correctes pour les fichiers versionnés, non optimales pour les images et polices, qui mériteraient un `max-age` long et immuable.

---

## 18. Problèmes de compatibilité

| Fonctionnalité employée | Chrome Android | Safari iOS | Samsung Internet | Firefox | Edge | Android ancien (5-7) |
|---|---|---|---|---|---|---|
| CSS Grid, Flexbox, variables CSS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Android 5+) |
| `backdrop-filter` | ✅ | ✅ (`-webkit-` présent) | ✅ | ✅ 103+ | ✅ | ❌ dégradation |
| `aspect-ratio` | ✅ 88+ | ✅ 15+ | ✅ | ✅ | ✅ | ❌ dégradation |
| `min()` / `max()` / `clamp()` | ✅ 79+ | ✅ 13.4+ | ✅ | ✅ | ✅ | ❌ règle ignorée |
| `:focus-visible` | ✅ 86+ | ✅ 15.4+ | ✅ | ✅ | ✅ | ❌ pas de focus visible |
| `:focus-within` | ✅ 60+ | ✅ 10.1+ | ✅ | ✅ | ✅ | ⚠️ Android 6+ |
| `text-wrap: balance` | ✅ 114+ | ✅ 17.5+ | ⚠️ récent | ✅ 121+ | ✅ | ❌ ignoré, sans gravité |
| `inset` (raccourci) | ✅ 87+ | ✅ 14.1+ | ✅ | ✅ | ✅ | ❌ **bannière cookies non positionnée** |
| `gap` en Flexbox | ✅ 84+ | ✅ **14.1+** | ✅ | ✅ | ✅ | ❌ **espacements perdus** |
| `loading="lazy"` | ✅ | ✅ 15.4+ | ✅ | ✅ | ✅ | ⚠️ ignoré, sans gravité |
| Format WebP | ✅ | ✅ 14+ | ✅ | ✅ | ✅ | ⚠️ **Android < 4.2 : images absentes** |
| `IntersectionObserver` | ✅ | ✅ 12.2+ | ✅ | ✅ | ✅ | ⚠️ Android 5-6 : animations d'entrée inopérantes |
| `element.fireEvent` (`gtranslate.js`) | — | — | — | — | — | Vestige IE, jamais exécuté |

**Les deux risques concrets :**

1. **`gap` en Flexbox sur Safari iOS < 14.1** (mars 2021). `.nav-links`, `.hero-actions`, `.cta-actions`, `.footer-links-grid`, `.zones-list`, `.communes-list` et `.footer-social` reposent tous dessus. Sur un iPhone 6s resté en iOS 13, **tous les espacements horizontaux disparaissent** : les éléments se collent. Le parc concerné est aujourd'hui marginal mais non nul en Afrique de l'Ouest, où les terminaux d'occasion circulent longtemps.

2. **`inset: 0` sur la bannière cookies** (`cookies-consent.css:4`). Sur un navigateur antérieur à 2020, la propriété est ignorée : la bannière, en `position: fixed` sans `top`/`left`/`right`/`bottom`, se place à sa position statique et le fond semi-transparent ne couvre plus l'écran. Correctif immédiat et sans risque : ajouter `top: 0; right: 0; bottom: 0; left: 0;` **avant** `inset: 0`.

**Absence de préfixes vendeurs :** correcte pour les propriétés modernes, et `-webkit-backdrop-filter` ainsi que `-webkit-background-clip` sont bien présents pour Safari. Aucun `autoprefixer` n'étant employé (pas d'étape de build), ces ajouts manuels sont les bons.

**Aucun `<iframe>`, `<video>` ni `<table>`** dans le dépôt : les problèmes de compatibilité associés sont sans objet.

---

## 19. Problèmes SEO

**Socle technique complet et correct :**

| Élément | Couverture |
|---|---|
| `<title>` unique | **12/12** — de 24 à 61 caractères, dans la plage utile |
| `meta description` | **12/12** |
| `rel="canonical"` | **12/12**, URLs absolues cohérentes |
| Open Graph | **12/12** — 6 balises par page |
| `lang="fr"` | **12/12** |
| `robots.txt` | Présent, `Allow: /`, référence le sitemap |
| `sitemap.xml` | 12 URLs — correspondance exacte avec les 12 pages |
| Un `<h1>` par page | **12/12** |
| `alt` sur les images | **94/94** |
| Liens internes | Maillage dense via l'en-tête et le pied de page communs |
| Contenu dupliqué | Aucun — chaque page a son contenu propre |

**Écarts identifiés :**

| Constat | Gravité | Renvoi |
|---|---|---|
| Aucune donnée structurée JSON-LD (0/12) | MOYENNE | M-10 |
| Pas de page 404 personnalisée | MOYENNE | M-11 |
| Hiérarchie de titres sautée sur 3 pages | MOYENNE | M-7 |
| `alt="logo"` non descriptif (24 occurrences) | FAIBLE | F-5 |
| Aucune balise `hreflang` malgré l'offre EN / 中文 | FAIBLE | F-9 |
| Poids d'images pesant sur les Core Web Vitals (LCP) | ÉLEVÉE | É-5 |

**Impact des performances sur le référencement :** le CLS est désormais quasi nul grâce aux dimensions explicites — un vrai gain. En revanche le **LCP de `nourriture.html` reste dégradé** (1,79 Mo d'images sans `srcset`), et le LCP est un facteur de classement direct sur mobile. C'est le seul point de performance ayant un effet SEO mesurable.

**Remarque sur la traduction :** le contenu traduit par Google Translate est généré côté client et **n'est pas indexé**. Le site n'est donc référencé qu'en français, malgré son sélecteur trois langues. Si le référencement anglophone présente un intérêt, seules des pages traduites servies côté serveur avec `hreflang` y répondraient — c'est un choix produit, pas un défaut technique.

---

## 20. Plan de correction par ordre de priorité

### Palier 1 — Rétablir les conversions (≈ 1 h, gain maximal)

| # | Action | Fichiers | Effort |
|---|---|---|---|
| 1 | **Corriger les identifiants de confirmation** : `driver-success` et `merchant-success`, + garde `null` | `chauffeur.html:412`, `commercant.html:410`, `js/form-handler.js:65` | 15 min |
| 2 | **Rétablir les boutons de téléchargement** : inclure `interactions.js`, convertir les 7 `onclick` | `telechargement.html` | 30 min |
| 3 | **Rendre les marges aux pages légales** : `padding-top` / `padding-bottom` séparés | 4 pages légales | 10 min |

> Ces trois correctifs débloquent les parcours de conversion. À faire avant toute autre chose.

### Palier 2 — Accessibilité et lisibilité (≈ 3 h)

| # | Action | Renvoi |
|---|---|---|
| 4 | Contraste du CTA chauffeur : texte sombre sur ambre, ou ambre assombri | É-2 |
| 5 | Modales cuisine : `<button>`, `role="dialog"`, Échap, restitution du focus | É-3 |
| 6 | Ajouter le bloc `prefers-reduced-motion` | M-2 |
| 7 | Cibles tactiles à 44 px (menus déroulants, pied de page) | M-3 |
| 8 | `autocomplete` + `inputmode` sur les 4 formulaires | M-4 |
| 9 | `font-size: 1rem` sur `.notify-form input` | M-1 |
| 10 | Corriger les contrastes de survol (bouton primaire, liens du pied de page) | F-12, F-13 |

### Palier 3 — Responsive et compatibilité (≈ 3 h)

| # | Action | Renvoi |
|---|---|---|
| 11 | Menu burger dès 992 px + compensation d'en-tête par variable CSS | É-6 |
| 12 | Réinitialiser le menu mobile au redimensionnement (`removeAttribute("style")`) | É-4 |
| 13 | Neutraliser `max-height` / `overflow-y` du sommaire Aide sous 768 px | M-6 |
| 14 | Ajouter `top/right/bottom/left` avant `inset: 0` sur la bannière cookies | §18 |
| 15 | Créer `404.html` et déclarer le repli | M-11 |

### Palier 4 — Performance (≈ 4 h)

| # | Action | Renvoi |
|---|---|---|
| 16 | Générer les variantes d'images et déclarer `srcset` / `sizes` (via `convert_images.js` et `sharp`) | É-5 |
| 17 | Ajouter `decoding="async"` sur les 94 images | É-5 |
| 18 | Produire un logo dédié en 128 px au lieu du fichier 1254 px | É-5 |
| 19 | `preload` du sous-ensemble latin d'Inter 400 | F-10 |
| 20 | Réévaluer `blur(120px)` et le `backdrop-filter` de l'en-tête fixe | §17 |

### Palier 5 — Dette technique (≈ 4 h)

| # | Action | Renvoi |
|---|---|---|
| 21 | Source unique GTranslate : charger `js/gtranslate.js`, supprimer les 12 blocs en ligne | M-8 |
| 22 | Nettoyer `interactions.js` (code mort) et le CSS inutilisé | M-9, F-1 |
| 23 | Sortir les 29 scripts Node de la racine publiée | §15.3 |
| 24 | Harmoniser la charte : supprimer les valeurs indigo/rose résiduelles | M-13 |
| 25 | Corriger `transition: transform var(--transition)` et la règle dupliquée | M-5, F-3 |
| 26 | Ajouter le JSON-LD (`LocalBusiness`, `FAQPage`, `SoftwareApplication`) | M-10 |
| 27 | Rétablir la continuité des niveaux de titre | M-7 |

---

## 21. Checklist finale avant mise en production

### Bloquant — ne pas déployer sans ces vérifications

- [ ] Envoyer réellement le formulaire **chauffeur** → le bloc « Pré-inscription réussie ! » s'affiche, **aucune alerte d'erreur**
- [ ] Idem pour le formulaire **commerçant**
- [ ] Cliquer sur les **6 boutons de téléchargement** de `telechargement.html` → ouverture de Google Play ou de l'application
- [ ] Ouvrir les **4 pages légales** à 375 px → marge latérale visible des deux côtés
- [ ] Vérifier la console des 12 pages → **aucune `ReferenceError`, aucune `TypeError`**

### Responsive — aux 10 largeurs demandées

- [ ] 320 / 360 / 375 / 390 / 412 / 480 px : aucun défilement horizontal sur les 12 pages
- [ ] 768 / 1024 px : en-tête sur **une seule rangée**, hero non recouvert sur `index.html`
- [ ] 1280 / 1440 px : contenu centré, aucune ligne de texte excessivement longue
- [ ] Rotation portrait → paysage → portrait **menu ouvert** : en-tête intact
- [ ] Zoom navigateur à 200 % : aucun contenu inaccessible
- [ ] Clavier iOS : le champ « Être notifié » de `index.html` ne déclenche **pas** de zoom automatique

### Accessibilité

- [ ] Parcourir chaque page **à la seule tabulation** : tous les éléments interactifs atteignables, focus visible
- [ ] Les 6 modales de `nourriture.html` s'ouvrent à Entrée et se ferment à Échap
- [ ] Contrôler les contrastes des CTA (chauffeur, commerçant, primaire) **au repos et au survol**
- [ ] Activer « Réduire les animations » dans le système → les 4 animations s'arrêtent
- [ ] Tester au lecteur d'écran (VoiceOver iOS ou TalkBack) : `index.html`, `contact.html`, `nourriture.html`

### Performance

- [ ] Lighthouse mobile sur `index.html` et `nourriture.html` (LCP, CLS, TBT)
- [ ] `nourriture.html` en 3G simulée : premier rendu utile en moins de 3 s
- [ ] Vérifier que `srcset` sert bien la variante réduite sur un écran de 375 px

### Compatibilité

- [ ] Chrome Android, Safari iOS, Samsung Internet, Firefox, Edge — les 12 pages
- [ ] Si possible, un appareil Android d'entrée de gamme réel (fluidité du défilement avec l'en-tête `backdrop-filter`)

### SEO et configuration

- [ ] `404.html` existe et reprend l'identité du site
- [ ] `sitemap.xml` à jour, les 12 URLs répondent en 200
- [ ] Données structurées validées par le test des résultats enrichis de Google
- [ ] Vérifier que les scripts de développement ne sont pas accessibles publiquement

---

## 22. Tests qui n'ont pas pu être réalisés

Ces vérifications relèvent du point 10 de la demande et **exigent un navigateur** :

| Test demandé | Statut | Raison |
|---|---|---|
| Rendu réel aux 10 largeurs | ❌ Non réalisé | Aucun navigateur ni environnement de prévisualisation |
| Détection visuelle des débordements horizontaux | ⚠️ Calculé uniquement | Déduit de l'arithmétique des largeurs |
| Relevé des erreurs de la console | ❌ Non réalisé | Les erreurs C-1 et C-2 sont **déduites du code**, pas observées |
| Test des menus, formulaires, boutons, modales | ❌ Non réalisé | — |
| Mesure des contrastes à l'écran | ⚠️ Calculé | Ratios WCAG calculés — fiables à 99 % |
| Lighthouse / Core Web Vitals | ❌ Non réalisé | — |
| Comportement du clavier mobile iOS | ⚠️ Déduit | Règle iOS des 16 px appliquée au code |
| Test au lecteur d'écran | ❌ Non réalisé | — |
| Rotation portrait / paysage | ⚠️ Déduit | Séquence tracée dans `main.js:52-64` |
| Rendu sur navigateurs anciens | ❌ Non réalisé | Compatibilité déduite des tables de support |

**Pourquoi :** `node_modules/` est absent et la consigne interdit toute installation de dépendances. Puppeteer, bien que déclaré dans `package.json`, n'est donc pas exécutable. Aucun serveur de développement n'a été lancé, conformément à la contrainte de lecture seule.

**Priorité de confirmation visuelle**, par ordre décroissant d'incertitude :

1. **É-6** (navigation tablette 769-992 px) — confiance 7,5/10, la plus basse du rapport ; dépend de la largeur réelle du texte rendu
2. **F-15** (chevauchement du marqueur FAQ) — confiance 7,5/10
3. **É-4** (rotation d'écran) — confiance 8/10 ; la logique est certaine, le rendu exact ne l'est pas
4. **M-6** (double défilement du sommaire Aide) — confiance 8/10
5. **É-1** (marges des pages légales) — confiance 9/10 ; la cascade est déterministe, seul l'aspect visuel reste à qualifier

Les bugs **C-1** et **C-2** ne nécessitent pas de confirmation : l'absence de définition d'une fonction et la non-correspondance d'un identifiant sont des faits vérifiables par simple recherche textuelle, reproduits dans ce rapport.

---

*Audit réalisé le 27 juillet 2026 par analyse statique de l'intégralité des 162 fichiers suivis de la branche `main` (commit `9811f63`). Aucun fichier source n'a été modifié, déplacé, reformaté ni supprimé. Aucun commit, aucune branche, aucune Pull Request. Aucune dépendance installée ou mise à jour. Seul le présent rapport a été créé.*

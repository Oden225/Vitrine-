---
name: ui-story-motion
description: Film d'interface en motion design (« UI story ») joué directement dans une page web ou exporté en vidéo verticale MP4 avec sound design. Raconte une action utilisateur de bout en bout — traînées de lumière et logo qui éclate, nom écrit lettre à lettre, bouton qui naît d'un trait et bascule en 3D dans un halo, écran réel visité par une caméra (zooms, panoramiques filés, curseur qui clique, surlignage), fonte liquide en notification, barre de progression en très gros plan, coche de validation et résultat. Utiliser ce skill dès qu'on veut présenter une application, un outil, une fonctionnalité ou un projet de portfolio de façon animée et cinématique — section « outils » ou « projets » d'un site vitrine, démo produit, teaser, spot TikTok/Reels/Shorts, vidéo de lancement — même si la personne parle seulement de « motion design », « animation de démo », « vidéo de présentation de mon app » ou montre une vidéo de référence de ce style (type promo Google Drive / Apple).
---

# UI Story — le film d'interface

Un composant sans dépendance (HTML, CSS, JavaScript Web Animations) qui transforme des **captures d'écran réelles** en un court film par chapitre, dans le style des promos produit « une action, du logo à la validation ». Le même code sert pour le site (lecture automatique quand la section est visible) et pour une vidéo 1080×1920 avec son.

Fichiers :
- `assets/ui-story.js` — le moteur `createUIStory(element, chapitres, options)`.
- `assets/ui-story.css` — styles, entièrement pilotés par des variables `--us-*`, plus le mode `us-video`.
- `assets/demo.html` — exemple minimal ; `demo.html?video=1` = mode vidéo plein écran.
- `scripts/record.mjs` — enregistre la page en vidéo verticale et horodate les temps forts.
- `scripts/sound.py` — synthétise le sound design calé sur ces temps forts (bibliothèque standard Python).
- `references/sound-design.md` — la logique sonore et comment la modifier.
- `references/export-video.md` — la chaîne complète vers un MP4 prêt pour TikTok / Reels.

## 1. Le style : ce qu'il faut garder

Le film raconte **une seule action**, enchaînée sans coupe : chaque élément *devient* le suivant (le bouton devient l'écran, l'écran devient la notification, la barre devient la coche). C'est ce qui donne l'impression de « film » plutôt que de diaporama.

| Temps | Durée | Ce qui se passe | Courbe |
|---|---|---|---|
| Ouverture | ~0,5 s | deux traînées de lumière convergent depuis des coins opposés | accélération (`in`) |
| Logo | ~0,6 s | éclair radial, le logo éclate avec dépassement (×1,2 puis ×1) et petite rotation | `out` + dépassement |
| Nom | 45 ms/lettre | lettres qui montent, nettes après un flou, lueur d'accent qui retombe ; le logo glisse à mesure que le nom s'élargit | `out` |
| Bouton | ~0,5 s | le titre s'envole ; le bouton naît d'un trait fin (échelle 0,06×0,22) et rebondit à 1,07 puis 1 | `out` |
| Clic | ~0,8 s | curseur qui arrive en arc, enfoncement 0,93 | — |
| Bascule | ~0,7 s | le bouton bascule en 3D (rotateX 58°, flou) dans un halo d'accent ; l'écran arrive couché (rotateX 66°, ×0,3) et se pose incliné | `in` puis `back` |
| Visite | ~2 s/point | la caméra amène chaque point au centre (zoom 2 à 2,6, inclinaison qui change), léger flou de mouvement, curseur, anneau de surlignage, étiquette | `inOut` |
| Panoramique | ~0,6 s | entre deux écrans : glissement flou vers la gauche, nouvel écran depuis la droite | `in` / `out` |
| Fonte liquide | ~1 s | l'écran se déforme (filtre de turbulence) et se contracte ; la notification se reforme depuis la même goutte | `in` puis `back` |
| Gros plan | ~2 s | caméra ×2,7 sur la barre ; la caméra suit le bord de remplissage | `inOut` |
| Validation | ~1,5 s | la carte se contracte en pastille, la coche se dessine, le résultat monte | `back` |

Règles qui font la différence :
- **Une couleur d'accent** (traînées, halo, surlignage, remplissage, pastille). Tout le reste est neutre.
- **Dépassement léger** (`cubic-bezier(.34,1.56,.64,1)`) sur ce qui *apparaît*, accélération franche sur ce qui *part*.
- **Le flou de mouvement remplace la vitesse** : 1,5 à 8 px de flou pendant les grands déplacements, jamais à l'arrêt.
- **Étiquettes de 2 à 5 mots** qui disent ce que l'utilisateur obtient (« 835 mg par injection »), pas le nom du champ.
- **Un résultat concret à la fin** (une valeur, « Prêt à imprimer ») : c'est la chute du film.

## 2. Préparer le contenu

Chaque chapitre = un outil ou une fonctionnalité :

```js
const chapters = [{
  name: 'NormoDose',                 // écrit lettre à lettre (court : 4 à 14 caractères)
  title: 'NormoDose',                // titre du panneau d'infos (sinon name)
  tags: ['En service', 'Posologie'], devTag: 'En développement',  // devTag = pastille grisée
  desc: 'Une ou deux phrases.',
  cta: '+ Nouveau calcul',           // texte du bouton qui lance l'action
  fiche: '#cr-01', url: 'https://…', urlLabel: 'Ouvrir NormoDose',
  mark: '<svg …>…</svg>',            // logo (facultatif) : SVG écrit par l'auteur, inséré tel quel
  screens: [{ src: 'img/calcul.webp', alt: 'Description de l’écran', hotspots: [
    { x: .30, y: .23, zoom: 2.2, rx: 12, ry: -14, label: 'Enfant : dose au poids' }] }],
  result: { title: 'Calcul de dose', meta: 'Amoxicilline IV · 25 kg', value: '835 mg par injection',
            icon: '<svg …>' /* facultatif */ }
}];
createUIStory(document.getElementById('story'), chapters, { hold: 1000 });
```

- **Captures réelles uniquement** — jamais de maquette présentée comme vraie (la démo l'indique clairement). Données de patients ou de clients masquées ou fictives, et dit comme tel.
- 1 à 2 écrans par chapitre, **3 points au plus** : au-delà le chapitre dépasse 20 s.
- Coordonnées `x`, `y` en fraction de l'image (0 à 1). Pour les trouver : superposer une grille de 10 % à la capture (Pillow) et lire la case, puis vérifier en capturant la scène au moment du point.
- `zoom` 2 pour un grand bloc, 2,4 à 2,6 pour un petit bouton ; alterner le signe de `ry` d'un point à l'autre pour que la caméra « tourne ».
- `mark` et `icon` sont insérés comme HTML : n'y mettre que du SVG écrit par l'auteur, jamais un texte venu d'un visiteur. Tous les textes passent par `textContent`.

## 3. Intégrer dans une page

```html
<link rel="stylesheet" href="css/ui-story.css">
<style>#story{--us-display:'Newsreader',serif;--us-body:'Public Sans',sans-serif;--us-accent:#6CCBEA}</style>
<div id="story" role="region" aria-roledescription="film" aria-label="Film des outils"></div>
<script src="js/ui-story.js" defer></script>
<script src="js/site.js" defer></script>  <!-- appelle createUIStory -->
```

Adapter l'identité en changeant les variables (`--us-bg`, `--us-stage-a`, `--us-accent`, `--us-accent-ink`, `--us-glow`, `--us-card`, polices). Ne pas toucher aux durées dans le CSS : elles sont dans le JS.

Ce que le moteur garantit déjà (à préserver si on le modifie) :
- lecture **seulement quand la scène est visible** (seuil 35 %), arrêt sinon ;
- `prefers-reduced-motion` : image fixe à plat, navigation manuelle, bouton pause masqué ;
- boutons précédent / suivant / pastilles / pause de 44 px avec `aria-label`, titre en `aria-live` ;
- chaque relance incrémente un numéro de lecture : une ancienne boucle s'arrête d'elle-même (`alive()`), pas de films superposés ;
- `still()` remet la scène dans un état propre (pause, changement de taille, sortie d'écran).

Options : `hold` (lecture d'une étiquette, ms), `autoplay`, `headingTag`, `labels` (textes des boutons), `onCue(nom, chapitre)` (temps forts, pour le son). Méthodes renvoyées : `goTo(i)`, `setPaused(bool)`, `chapter`.

**Sur un site, pas de son** : un son qui démarre seul gêne et les navigateurs le bloquent. Le son est pour la vidéo.

## 4. Exporter en vidéo avec sound design

Lire `references/export-video.md`. En bref : servir la page, `node scripts/record.mjs --url …?video=1 --seconds 20 --out sortie`, puis `python3 scripts/sound.py sortie/cues.json sortie/sound.wav`, puis ffmpeg pour assembler en MP4 H.264 + AAC 1080×1920. Le mode `us-video` agrandit curseur, bouton, notification et coche pour une lecture sur téléphone.

## 5. Vérifier avant de livrer

Avec Playwright (Chromium présent sur la machine) :
1. Capturer la scène toutes les 0,5 s pendant un chapitre entier et assembler une planche : vérifier chaque temps du tableau ci-dessus, et que le curseur tombe sur le bon élément à chaque point.
2. Cliquer « suivant » : le titre change, aucun anneau ni curseur parasite à l'arrivée de l'écran.
3. Pause : la scène se fige proprement, le bouton dit « Lire ».
4. Mobile 390 px : pas de défilement horizontal, étiquettes dans la scène.
5. `reducedMotion: 'reduce'` : image fixe, navigation fonctionnelle.
6. Console sans erreur.
7. Pour une vidéo : extraire une image par seconde du MP4 et regarder la planche ; écouter que les sons tombent sur les gestes.

Pièges connus :

| Symptôme | Cause | Correction |
|---|---|---|
| Un élément « clignote » avant de disparaître | fondu écrit de 1 vers 0 alors qu'il était déjà invisible | faire disparaître avec `go(el, {opacity: 0})`, qui part de l'état réel |
| Le point visé n'est pas au centre | origine et transformation animées séparément | `camT()` calcule les deux ensemble |
| Films superposés après un clic | ancienne boucle encore active | tester `alive()` après chaque `await` |
| L'écran reste visible derrière l'ouverture | l'image fixe de départ finit de charger après le début du film | `still()` mémorise le numéro de lecture et abandonne s'il a changé |
| Coche invisible | `stroke-dasharray` différent de la longueur du tracé | garder 20 pour le tracé fourni, ou recalculer avec `getTotalLength()` |
| Sons décalés dans la vidéo | origine des horloges différente du début de l'enregistrement | `record.mjs` mesure ce décalage et l'applique ; vérifier à l'oreille sur le premier clic |

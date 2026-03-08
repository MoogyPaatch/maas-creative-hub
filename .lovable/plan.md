

## Diagnostic UX actuel

### Ce qui fonctionne
- Navigation clavier (flèches, Escape) sur DC et PPM
- Mode plein écran disponible
- Thumbnails sidebar + mobile
- Transitions framer-motion basiques (fade + slide)

### Ce qui manque pour être "créatif et innovant"

1. **Thumbnails vides** : sans images (thumbnail_url vide dans les mock), on voit juste des numéros gris dans des boîtes. Zero impact visuel.

2. **Pas de gesture mobile** : pas de swipe gauche/droite. Sur mobile, il faut cliquer sur les petites flèches.

3. **Transitions plates** : simple fade+translate de 40px. Pas de profondeur, pas de parallaxe, pas d'effet "reveal" cinématique.

4. **Layout DC sans image = mur de texte** : quand `thumbnail_url` est vide (cas actuel des mocks), la moitié gauche est un bloc gris vide avec juste "Piste 1". Pas engageant.

5. **Pas d'indicateur de progression** : aucune barre de progression, aucun dots indicator entre les slides.

6. **Header utilitaire, pas immersif** : les boutons Google Slides/PPTX/Plein écran ressemblent à un toolbar admin, pas à une expérience créative.

7. **Duplication de code** : DCPresentation et PPMPresentation dupliquent NavButtons, Thumbnails, le shell fullscreen, la logique clavier -- ~150 lignes identiques.

---

## Plan d'amélioration

### 1. Composant `SlideShell` partagé
Extraire la logique commune (navigation clavier, fullscreen, thumbnails, nav arrows, header) dans un composant réutilisable. DC et PPM deviennent des "slide providers" qui ne fournissent que le contenu.

### 2. Thumbnails visuelles enrichies
- Pour DC : gradient coloré unique par piste (généré depuis le titre) + titre tronqué au lieu d'un bloc gris vide
- Pour PPM : icone + titre déjà en place, mais agrandir et ajouter un fond coloré par section
- Indicateur actif : bordure animée au lieu d'un simple `border-primary`

### 3. Transitions cinématiques
Remplacer le fade basique par des transitions plus immersives :
- Slide entrant : scale 0.95 → 1 + opacity 0 → 1 + léger blur
- Slide sortant : scale 1 → 1.02 + opacity 1 → 0
- Durée 0.35s avec easing custom

### 4. Indicateur de progression
Ajouter une barre fine animée en haut du slide area (style progress bar) + dots cliquables en overlay bas central, avec le numéro de slide actuel.

### 5. Layout DC sans image : mode "statement"
Quand pas de thumbnail, passer en layout pleine largeur centré avec :
- Numéro de piste XXL en fond (style typographique géant semi-transparent)
- Titre en gros, headline en accent
- Sections concept/tone/justification en cards empilées
- Bouton "Choisir" proéminent

### 6. Swipe mobile
Ajouter la détection de swipe via touch events (touchstart/touchend delta) pour naviguer entre slides sur mobile.

### 7. Header immersif
Transformer le header en overlay semi-transparent sur le slide plutôt qu'une barre séparée. Titre + compteur fondus dans le visuel. Boutons d'action en hover/tap pour maximiser l'espace créatif.

---

## Fichiers impactés

1. **`src/components/output/SlideShell.tsx`** -- nouveau, logique commune (nav, keyboard, fullscreen, thumbnails, progress)
2. **`src/components/output/DCPresentation.tsx`** -- refacto pour utiliser SlideShell, nouveau layout "statement" sans image
3. **`src/components/output/PPMPresentation.tsx`** -- refacto pour utiliser SlideShell
4. **`src/pages/DemoSlides.tsx`** -- ajout de vraies images placeholder (via gradient/SVG) pour tester le rendu

### Priorités
- SlideShell + refacto DC/PPM (factorisation, élimine la duplication)
- Transitions cinématiques + progress indicator
- Layout DC "statement" sans image
- Swipe mobile
- Header overlay immersif


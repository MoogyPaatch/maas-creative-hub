

## Canvas Créatif — Plan

### Concept

Un **canevas interactif en plein écran** accessible depuis l'étape Livraison, à côté de la galerie. Le client peut glisser les assets finaux sur une surface libre, les redimensionner, les tourner, ajouter du texte et des annotations, puis exporter la composition en image.

Inspiré d'un mini Figma / moodboard : surface infinie avec zoom/pan, éléments librement positionnables.

### Fonctionnalités

1. **Surface zoomable & pannable** — molette pour zoom, clic-drag sur le fond pour pan, mini-map optionnelle
2. **Drag des assets** — depuis la galerie vers le canevas (ou via bouton "Ajouter au canevas")
3. **Sélection & transformation** — clic sur un élément pour le sélectionner, poignées de resize aux coins, rotation via poignée dédiée
4. **Calques** — ordre z-index, monter/descendre, panneau latéral avec la liste des éléments
5. **Texte libre** — double-clic sur le fond pour ajouter un bloc texte éditable (titres, annotations)
6. **Snap & guides** — lignes de guidage magnétiques quand un élément s'aligne avec un autre
7. **Export** — bouton "Exporter en PNG" via `html2canvas` ou Canvas API
8. **Templates** — quelques layouts prédéfinis (grille 2x2, panoramique, story portrait) pour démarrer vite

### Architecture technique

**Nouveau fichier** : `src/components/output/CreativeCanvas.tsx`

- Surface : un `<div>` avec `transform: translate(panX, panY) scale(zoom)` appliqué à un conteneur enfant
- Éléments : tableau d'objets `CanvasElement[]` dans le state, chacun avec `{ id, type, x, y, width, height, rotation, zIndex, src?, text? }`
- Interactions : `onPointerDown/Move/Up` natifs pour drag, resize et rotation (pas de lib externe)
- Resize : détection de la poignée cliquée (coin NE, SE, SW, NW) et calcul delta
- Zoom : `onWheel` avec clamp [0.1, 3]

**Types** (`src/types/index.ts`) :

```ts
export interface CanvasElement {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  src?: string;       // pour images
  text?: string;      // pour texte
  fontSize?: number;
  color?: string;
}
```

**Intégration OutputPanel** :

- Nouvel onglet "Canevas" dans la barre du bas, visible uniquement à l'étape Livraison (à côté de "Campagne")
- Le canevas reçoit les `production_assets` en props pour pouvoir les glisser

**Intégration Démo** :

- Un bouton "Ouvrir le canevas" dans la galerie de campagne
- Quelques éléments pré-placés pour montrer le rendu

### Toolbar du canevas (barre flottante en haut)

- Zoom in/out + reset
- Outil sélection / outil texte
- Bouton "Ajouter un asset" (ouvre un picker depuis la galerie)
- Bouton "Template" (dropdown avec layouts)
- Bouton "Exporter PNG"
- Bouton retour galerie

### Fichiers impactés

1. `src/types/index.ts` — ajout `CanvasElement`
2. `src/components/output/CreativeCanvas.tsx` — **nouveau** (composant principal)
3. `src/components/output/OutputPanel.tsx` — ajout onglet "Canevas"
4. `src/components/output/CampaignGallery.tsx` — bouton "Ouvrir le canevas"
5. `src/pages/Demo.tsx` — passage des assets au canevas

### Complexité

Implémentation en pur React + pointer events, pas de librairie externe lourde. Export via `canvas.toBlob()` natif. Estimation : composant conséquent (~400-500 lignes) mais autonome.


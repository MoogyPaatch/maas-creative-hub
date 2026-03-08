

## Galerie de Campagne — Assets de Production

### Résumé

Créer un composant `CampaignGallery` en format **galerie scrollable par sections** (pas de slides) pour visualiser les assets finaux : images, vidéos, audio, documents. Intégrer dans `OutputPanel` et ajouter un onglet démo.

### 1. Types (`src/types/index.ts`)

Ajouter :

```ts
export interface ProductionAsset {
  id: string;
  type: "image" | "video" | "audio" | "document";
  title: string;
  format: string;        // "1080x1080", "16:9", "MP3", "PDF"
  url: string;           // URL signée temporaire
  thumbnail_url?: string;
  duration?: string;     // audio/vidéo
  file_size?: string;
}
```

Ajouter dans `MessageMetadata` :
- `production_assets?: ProductionAsset[]`
- `campaign_title?: string`
- `zip_url?: string`

### 2. Composant `CampaignGallery` (nouveau fichier)

`src/components/output/CampaignGallery.tsx` — Vue scrollable continue :

- **Header** : titre campagne, stats (X images, Y vidéos...), bouton "Tout télécharger" si `zip_url`
- **Section Images** : grille 2-3 colonnes responsive. Clic ouvre une **lightbox modale** plein écran (navigation ←→, Escape pour fermer). Chaque carte affiche titre + format en overlay.
- **Section Vidéos** : `<video>` HTML5 natif avec `poster` (thumbnail_url), contrôles, fond sombre. Grille 1-2 colonnes.
- **Section Audio** : Player compact par fichier avec `<audio>` + barre de progression custom stylisée, icône, titre, durée.
- **Section Documents** : Cartes avec icône par extension (FileText pour PDF, Presentation pour PPTX), titre, format, bouton download.
- Sections vides masquées automatiquement.
- Animations framer-motion : staggered reveal au scroll.

### 3. Intégration `OutputPanel`

- Import `CampaignGallery`
- Ajouter mapping : `active.type === "campaign_gallery"` → `<CampaignGallery>`
- Ajouter label : `campaign_gallery: "Campagne"`

### 4. Page démo (`DemoSlides.tsx`)

- Ajouter 3e onglet "Campagne"
- Données mock avec placeholder.svg pour images, et des assets fictifs pour chaque type

### Fichiers impactés

1. `src/types/index.ts` — ajout `ProductionAsset` + champs metadata
2. `src/components/output/CampaignGallery.tsx` — **nouveau**
3. `src/components/output/OutputPanel.tsx` — mapping + label
4. `src/pages/DemoSlides.tsx` — onglet démo


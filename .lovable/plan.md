

## Upload des Assets de Marque — Plan d'implémentation

### Résumé

Deux points d'entrée pour les assets de marque : (1) un panneau dédié accessible dès le brief via un onglet permanent dans l'OutputPanel, et (2) un message IA post-brief demandant les assets manquants avec quick reply pour ouvrir le panneau.

### 1. Types (`src/types/index.ts`)

Ajouter :

```ts
export type BrandAssetCategory = "logo" | "product" | "guidelines" | "typography" | "graphics";

export interface BrandAsset {
  id: string;
  category: BrandAssetCategory;
  file_name: string;
  file_size: string;
  file_type: string;
  preview_url: string;
  uploaded_at: string;
}
```

Ajouter dans `MessageMetadata` : `requested_asset_categories?: BrandAssetCategory[]`

### 2. Composant `BrandAssetsPanel` (nouveau)

`src/components/output/BrandAssetsPanel.tsx`

- 5 catégories collapsibles avec icônes (Image, Package, FileText, Type, Palette) : Logos, Visuels produit, Charte graphique, Typographies, Éléments graphiques
- Chaque section : zone drag & drop + bouton "Parcourir" (input file hidden)
- Fichiers uploadés : thumbnails via `URL.createObjectURL()`, nom, taille, bouton supprimer
- Compteur par catégorie
- State local (pas de backend pour la démo) — props `assets` + `onAssetsChange` pour remonter au parent
- Animations framer-motion staggered sur les items

### 3. Intégration `OutputPanel`

- Ajouter `brand_assets` dans les labels
- Ajouter un **onglet permanent "Assets"** toujours visible dans la barre du bas (même sans artifact), positionné en premier
- Nouvelle prop `brandAssets` + `onBrandAssetsChange` passées depuis le parent
- Quand un message avec `metadata.type === "asset_request"` est reçu et que l'utilisateur clique le quick reply, switch vers cet onglet

### 4. Intégration Démo (`src/pages/Demo.tsx`)

- State `brandAssets` dans DemoPage, passé à OutputPanel
- Après le message de validation du brief, ajouter un message IA demandant les assets :
  > "Pour avancer sur les pistes créatives, j'aurais besoin de quelques éléments : votre logo en HD, des visuels du produit et votre charte graphique si vous en avez une."
  Quick replies : "📎 Voir les assets" / "Passer pour l'instant"
- Pré-remplir 2 assets mock (un logo placeholder, un PDF guidelines) pour montrer le rendu

### Fichiers impactés

1. `src/types/index.ts` — ajout `BrandAsset`, `BrandAssetCategory`, metadata field
2. `src/components/output/BrandAssetsPanel.tsx` — **nouveau**
3. `src/components/output/OutputPanel.tsx` — onglet permanent + nouvelles props
4. `src/pages/Demo.tsx` — state assets, message IA, mock data


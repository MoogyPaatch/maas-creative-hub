

## PPM : Présentation en mode Slides navigable

### Contexte

Le PPM actuel est un long scroll avec toutes les sections empilées. Pour reproduire le process agence (présentation slide au client), on va le transformer en **deck de slides navigable** — exactement comme ce qu'on a fait pour les pistes DC, mais adapté à la structure PPM.

### Architecture des slides

Chaque section PPM devient une ou plusieurs slides :

```text
Slide 1 : Page de titre (résumé + liens download)
Slide 2 : Storyboard Overview (grille des frames)
Slide 3+ : Frames storyboard détaillées (2-3 frames par slide si nombreuses)
Slide N : Casting (grille des rôles)
Slide N+1 : Décors (grille des lieux)
Slide N+2 : Notes de production (budget + planning)
Slide N+3 : Maquettes (grille des formats)
```

Les sections vides sont automatiquement ignorées.

### Composant refactoré

On réécrit `PPMPresentation.tsx` en reprenant le même pattern que `DCPresentation.tsx` :

- **Header bar** : titre "Dossier PPM", compteur slide X/Y, boutons Google Slides / PPTX / Plein écran
- **Sidebar miniatures** (desktop) : petites previews de chaque slide avec icône de section (Film, Users, MapPin, etc.)
- **Zone slide principale** : contenu de la section courante, rendu en pleine page avec layout agence (titres larges, grilles aérées, fond sombre pour les visuels storyboard)
- **Navigation** : flèches gauche/droite, clavier (←→), miniatures cliquables
- **Mode plein écran** : overlay `fixed inset-0` avec la même mécanique que DC
- **Transitions** : `AnimatePresence` avec slide horizontal entre les sections

### Détails techniques

1. **Génération dynamique des slides** : une fonction `buildSlides(metadata)` construit un tableau `{icon, title, content: ReactNode}[]` à partir des données PPM disponibles
2. **Miniatures** : chaque slide a son icône de section + numéro, pas de thumbnail image (contrairement à DC)
3. **Storyboard** : si >6 frames, on les répartit sur plusieurs slides (3 par slide) pour éviter la surcharge
4. **Style cohérent** : même header/footer/nav que DC pour une UX homogène entre les onglets

### Fichier modifié

- `src/components/output/PPMPresentation.tsx` — réécriture complète


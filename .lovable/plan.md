

## Analyse de l'espace client actuel

Aujourd'hui, le client voit une grille de cards identique à celle de l'agence, mais sans le Kanban ni les filtres par phase. C'est effectivement peu engageant : pas de hiérarchie visuelle, pas de mise en avant du projet actif, et trop d'informations techniques (phases internes, barres de progression brutes).

## Proposition : un espace client repensé

L'idée est de remplacer la grille plate par une interface orientée **action et statut**, adaptée au workflow simplifié client (4 étapes : Brief → Direction Créative → Pré-Production → Livraison).

### Structure proposée

```text
┌─────────────────────────────────────────────────┐
│  Header (logo + user + déconnexion)             │
├─────────────────────────────────────────────────┤
│  Bienvenue, [Prénom]              [+ Nouvelle]  │
├─────────────────────────────────────────────────┤
│  🔔 CARTE "ACTION REQUISE" (si applicable)      │
│  ┌─────────────────────────────────────────┐    │
│  │ Campagne X — Validation brief attendue  │    │
│  │ [Voir le projet →]                      │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  PROJET ACTIF (hero card, grande)               │
│  ┌─────────────────────────────────────────┐    │
│  │ Nom campagne                            │    │
│  │ ○───●───○───○  Brief → DC → PPM → Livr │    │
│  │ Dernière activité : il y a 2h           │    │
│  │                          [Continuer →]  │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  AUTRES PROJETS (liste compacte)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Camp. Y  │ │ Camp. Z  │ │ Camp. W  │        │
│  │ Livré ✓  │ │ Brief    │ │ Terminé  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────┘
```

### Changements concrets

**1. Bannière d'action requise** (conditionnelle)
- Si un projet a `pending_validation: true`, afficher une carte proéminente en haut avec un fond accent/warning
- Lien direct vers le projet concerné

**2. Hero card pour le projet le plus récent/actif**
- Card plus grande, mise en avant visuellement
- Stepper horizontal simplifié avec les 4 phases client (Brief Client, Direction Créative, PPM, Livraison) au lieu des 9 phases internes
- Affichage de la dernière activité (date relative)
- CTA "Continuer" bien visible

**3. Liste compacte des autres projets**
- Cards plus petites, en grille
- Juste le nom, le statut simplifié (En cours / Livré / Terminé), et la date
- Pas de barre de progression technique

**4. Message d'accueil personnalisé**
- "Bienvenue, [prénom]" au lieu de "Projets"
- Sous-titre contextuel ("1 action en attente" ou "Tous vos projets sont à jour")

**5. Mapping des phases internes → phases client**
- Fonction utilitaire qui convertit les 9 phases internes en 4 étapes client visibles
- `commercial` → Brief Client
- `planner`, `dc_visual`, `dc_copy` → Direction Créative
- `ppm` → Pré-Production
- `prod_*`, `delivered`, `finished` → Livraison

### Fichiers modifiés

| Fichier | Action |
|---|---|
| `src/pages/Projects.tsx` | Refonte du rendu conditionnel `!isAgency` : hero card, action banner, liste compacte, stepper client |
| `src/types/index.ts` | Ajouter `CLIENT_PHASES` (mapping des 4 étapes client) |

Aucune nouvelle dépendance nécessaire — tout est faisable avec les composants existants (framer-motion, lucide, tailwind).


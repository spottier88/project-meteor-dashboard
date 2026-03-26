

# Amelioration visuelle de la presentation des revues de projets

## Modifications prevues

### 1. Blocs de taches colores avec icones (Web + PPTX)

Remplacer les en-tetes noirs uniformes des 3 blocs de taches par des couleurs et icones distinctes selon le statut :

| Bloc | Couleur en-tete | Icone |
|---|---|---|
| Taches terminees | Vert (`#22c55e`) | `CheckCircle` |
| Taches en cours | Bleu (`#3b82f6`) | `Clock` |
| Taches a venir | Gris (`#6b7280`) | `CircleDot` |

**Web** : Modifier le composant `Section` pour accepter une prop `headerColor` et une prop `icon`. Appliquer sur les 3 blocs de taches dans `PresentationSlide.tsx`.

**PPTX** : Modifier `addTasksSection` dans `slideGenerators.ts` pour passer la couleur de fond du titre (`fill.color`) correspondante a chaque bloc au lieu du noir uniforme. Ajouter les emojis equivalents dans le titre (✅, 🔄, 📋).

### 2. Affichage du % d'avancement dans l'en-tete (Web + PPTX)

Le champ `completion` est deja disponible dans `data.project.completion` (et `data.lastReview?.completion`).

**Web** : Ajouter dans l'en-tete rouge de `PresentationSlide.tsx` un indicateur visuel d'avancement — une barre de progression circulaire ou lineaire avec le pourcentage affiche.

**PPTX** : Ajouter dans `addProjectHeader` de `slideGenerators.ts` un texte "Avancement : XX%" dans l'en-tete.

**Summary (Web)** : Ajouter une colonne "Avancement" dans le tableau de `PresentationSummary.tsx`.

**Summary (PPTX)** : Ajouter une colonne "%" dans `addSummaryTable` de `slideGenerators.ts`.

### 3. Ordonnancement des projets dans la presentation web

Actuellement le tri est fixe (orageux en premier) dans `ProjectPresentation.tsx`. Ajouter un selecteur de tri dans la barre de navigation (`PresentationNavigation.tsx`) avec les options :

- Meteo (orageux d'abord) — tri actuel par defaut
- Avancement (du plus faible au plus eleve)
- Alphabetique (A→Z)
- Statut du cycle de vie (a l'etude → en cours → suspendu)

**Mecanisme** : Remonter le state de tri dans `PresentationView.tsx`. Le tri s'applique sur la liste `projects` via un `useMemo`. Le selecteur est un `Select` compact dans la barre de navigation, visible uniquement quand il y a plus d'un projet.

Cette fonctionnalite est limitee a l'interface web (pas d'impact PPTX — l'ordre d'export reste celui du panier/portefeuille).

### Fichiers impactes

| Fichier | Modifications |
|---|---|
| `src/components/presentation/PresentationSlide.tsx` | Ajout couleurs/icones sur blocs taches, ajout % avancement en-tete, props `headerColor`/`icon` sur `Section` |
| `src/components/presentation/PresentationSummary.tsx` | Ajout colonne avancement dans le tableau |
| `src/components/presentation/PresentationNavigation.tsx` | Ajout selecteur de tri |
| `src/components/presentation/PresentationView.tsx` | State de tri + `useMemo` pour trier les projets |
| `src/components/pptx/slideGenerators.ts` | Couleurs des en-tetes taches, emojis, colonne/texte avancement |
| `src/components/pptx/PPTXStyles.ts` | Ajout des couleurs de statut de taches |
| `src/pages/ProjectPresentation.tsx` | Retirer le tri fixe (delegue a `PresentationView`) |


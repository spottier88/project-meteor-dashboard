
# Rose des projets — nouvelle cartographie du portefeuille

Inspiration : graphe "Faire de la vie étudiante…" (rose polaire à 4 quadrants).
Objectif : remplacer la matrice bubble jugée insatisfaisante par une visualisation polaire dense et lisible.

## Concept visuel

```text
                  PRIORITÉ HAUTE
        ┌──────────────────┬──────────────────┐
        │  Haute / Sain    │  Haute / À risque│
        │  (sunny+cloudy)  │  (stormy)        │
 MÉTÉO  │      ◖◗◖◗        │      ◖◗◖◗        │ MÉTÉO
 SAINE  ├──────────────────┼──────────────────┤ À RISQUE
        │ Standard / Sain  │ Standard / Risque│
        │      ◖◗◖◗        │      ◖◗◖◗        │
        └──────────────────┴──────────────────┘
                PRIORITÉ STANDARD
```

- 4 quadrants délimités par 2 axes en pointillés : **Priorité (haute/standard)** verticalement, **Météo (saine = sunny+cloudy / à risque = stormy)** horizontalement.
- Chaque **pétale = 1 projet** :
  - **Angle** : réparti uniformément entre les projets du même quadrant (largeur ∝ 1/n du quadrant).
  - **Rayon** : proportionnel à l'**avancement (0–100 %)**.
  - **Remplissage** : couleur du **statut cycle de vie** (study/validated/in_progress/completed/suspended/abandoned), tokens design system.
  - **Anneau extérieur (bordure épaisse)** : couleur de la **météo** (sunny=vert, cloudy=ambre, stormy=rouge).
  - **Numéro** centré dans le pétale (≥1 pétale).
- Cercles concentriques discrets à 25 / 50 / 75 / 100 % (grille polaire).
- Labels d'axes : « Priorité haute », « Priorité standard », « Sain », « À risque ».
- **Tooltip** au survol : titre, chef de projet, direction, avancement %, météo, statut cycle de vie, dernière revue.
- Légende sous le graphe (statuts cycle de vie + anneaux météo).
- Légende numérotée latérale (n° ⇄ titre projet) pour lecture rapide.

## Détails techniques

- **Nouveau composant** `src/components/portfolio/cartography/CartographyProjectRose.tsx` :
  - SVG natif (viewBox carré, responsive), pas de dépendance Recharts (Recharts ne gère pas proprement ce type d'angle/rayon mixte).
  - Pure fonction `buildPetals(projects)` qui :
    1. Classe les projets dans 4 buckets via `priority` (high → "haute", autres → "standard") et `weather` (sunny|cloudy → "saine", stormy|null → "à risque" — `null` traité comme à risque, configurable).
    2. Pour chaque bucket, calcule angle de départ, largeur angulaire = quadrant / n.
    3. Calcule rayon = `(completion/100) * R_max` (R_min = 8 % pour rester visible si 0 %).
  - Génère chaque pétale comme `path` SVG (arc + lignes radiales) avec `fill` = token cycle de vie, `stroke` = token météo, `strokeWidth` = 4.
  - Tokens couleurs définis dans le composant à partir des classes existantes (`PortfolioCharts.tsx` LIFECYCLE_COLORS + STATUS_COLORS) — pas de hardcode hors palette.
- **Modification** `PortfolioCartographyTab.tsx` :
  - L'onglet `matrix` rend désormais `CartographyProjectRose` (renommé l'intitulé en « Rose des projets »).
  - Retire l'import `CartographyBubbleMatrix` (fichier conservé sur disque pour rollback éventuel mais plus utilisé).
- **Données** : `CartographyProject` expose déjà `weather`, `lifecycle_status`, `completion`. Ajout d'une lecture `priority` :
  - Étendre `useCartographyData` pour récupérer `projects.priority` (champ existant côté DB), et l'ajouter à l'enrichissement + à `buildCartographyProjects`.
- **Légende** : mise à jour `CartographyLegend.tsx` pour inclure l'explication "rayon = avancement / couleur = cycle de vie / anneau = météo".
- **Filtres** : inchangés (direction / météo / cycle / innovation). Si filtres réduisent un quadrant à 0 projet, message « Aucun projet » dans le secteur.
- **Tooltip** : Radix `Tooltip` ou composant `recharts/Tooltip`-like maison via `onMouseEnter` sur chaque `path`, panneau flottant positionné via state.
- **Export PNG** : déjà géré par `html-to-image` sur `exportRef` parent — fonctionne nativement avec SVG.

## Hors périmètre

- Aucune modification des autres onglets (Heatmap, Treemap) ni des données serveur.
- Pas de migration SQL.
- Pas de clic-vers-projet ni d'étiquettes permanentes (peuvent être ajoutés ensuite).

## Livrables

1. `src/components/portfolio/cartography/CartographyProjectRose.tsx` (nouveau, ~250 l., commenté FR).
2. `src/hooks/useCartographyData.ts` — ajout du champ `priority`.
3. `src/components/portfolio/cartography/PortfolioCartographyTab.tsx` — bascule onglet « Matrice » → « Rose des projets ».
4. `src/components/portfolio/cartography/CartographyLegend.tsx` — légende enrichie.


# Cartographie des projets dans la vue portefeuille

Ajout d'un nouvel onglet **"Cartographie"** dans `PortfolioDetails.tsx`, dédié à la visualisation synthétique des projets du portefeuille. La fonctionnalité s'appuie **uniquement sur les données déjà disponibles** (table `projects`, dernière revue via `latest_reviews`, `project_innovation_scores`, `directions`, `poles`).

## Vue d'ensemble

L'onglet contient **3 visualisations complémentaires** affichées dans des sous-onglets (couvre les 3 objectifs : pilotage, analyse, communication), avec une **barre de filtres commune** en haut et un **bouton d'export PNG** (via `html-to-image` déjà utilisé dans le projet).

```text
┌─ Onglet Cartographie ─────────────────────────────────────┐
│ [Filtres: Direction ▾ Météo ▾ Cycle de vie ▾ Innovation ▾]│
│                                          [⬇ Export PNG]   │
│ ┌─ Sous-onglets ─────────────────────────────────────────┐│
│ │ [Matrice]  [Heatmap directions]  [Treemap]            ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│   ▸ Visualisation sélectionnée (plein largeur)            │
│                                                            │
│ Légende : ☀ Ensoleillé · ☁ Nuageux · ⛈ Orageux · ✨ Inno  │
└────────────────────────────────────────────────────────────┘
```

## Scénario 1 — Matrice bubble (vue principale, pilotage)

Inspirée d'une matrice BCG. Une bulle = un projet.

- **Axe X** : avancement (`completion` 0–100 %)
- **Axe Y** : météo (`weather` — Orageux en haut, Nuageux milieu, Ensoleillé en bas) — perception inversée pour que le risque attire l'œil
- **Couleur** : cycle de vie (`lifecycle_status` — étude, validé, en cours, terminé, suspendu, abandonné)
- **Taille** : nombre de jours depuis la dernière revue (gros = revue ancienne ⇒ attention)
- **Indicateur secondaire innovation** : étoile/halo `✨` autour de la bulle si le projet a un score innovation moyen ≥ seuil (3/5)
- **Tooltip** : titre, chef de projet, direction, avancement, dernière revue, score innovation
- **Clic** : navigation vers `/projects/:id`

Quadrants visuels (lignes pointillées) :
- Haut-gauche : projets en difficulté + peu avancés ⇒ **à risque**
- Haut-droite : difficultés en fin de course ⇒ **à sécuriser**
- Bas-gauche : sereins mais peu avancés ⇒ **à lancer**
- Bas-droite : sereins et avancés ⇒ **à finaliser**

## Scénario 2 — Heatmap directions × statut

Grille pour la **vue analytique**.
- **Lignes** : directions présentes dans le portefeuille
- **Colonnes** : cycle de vie (étude, validé, en cours, terminé, suspendu)
- **Cellule** : nombre de projets + couleur d'intensité selon la météo dominante
- **Clic cellule** : affiche la liste des projets dans un Dialog

Utile pour repérer rapidement les concentrations de projets par entité.

## Scénario 3 — Treemap par direction

Rectangles imbriqués pour la **vue communication**.
- **Groupe** : direction (ou pôle si aucune direction)
- **Taille** : nombre de projets dans la direction
- **Couleur du rectangle projet** : météo
- **Bordure** : épaisse si innovant

Idéal pour présentations : montre l'équilibre du portefeuille en un coup d'œil.

## Filtres communs

Appliqués aux 3 visualisations en temps réel (état React local) :
- Direction (multi-select)
- Météo (multi-select)
- Cycle de vie (multi-select)
- Innovation : tous / innovants seulement / non innovants

## Section technique

### Données
Tout est déjà disponible. Aucune migration nécessaire.
- `portfolio.projects` (déjà chargé par `usePortfolioDetails`) fournit `id`, `title`, `completion`, `weather`, `lifecycle_status`, `direction_id`, `project_manager`, `last_review_date`
- Nouveau hook `usePortfolioInnovationScores(projectIds)` qui interroge `project_innovation_scores` pour calculer un score moyen par projet
- Lookup des noms de directions via `directions` (déjà accessible)

### Composants à créer
```
src/components/portfolio/cartography/
  PortfolioCartographyTab.tsx        // conteneur + filtres + sous-onglets + export
  CartographyFilters.tsx             // barre de filtres
  CartographyBubbleMatrix.tsx        // scénario 1 (Recharts ScatterChart)
  CartographyDirectionHeatmap.tsx    // scénario 2 (grille CSS)
  CartographyTreemap.tsx             // scénario 3 (Recharts Treemap)
  CartographyLegend.tsx              // légende partagée
  useCartographyData.ts              // hook qui agrège projets + scores innovation + filtres
```

### Intégration
- Ajout d'un onglet `<TabsTrigger value="cartography">` dans `PortfolioDetails.tsx` (entre "Vue d'ensemble" et "Projets")
- Recharts est déjà installé (utilisé pour `InnovationRadarChart`) — pas de nouvelle dépendance
- Export PNG via `html-to-image` (déjà présent — mémoire `export-and-screenshot-libraries`)
- Visible pour tous les rôles ayant accès au portefeuille (lecture seule), pas de permission spécifique

### Performance
- Données chargées une seule fois via `usePortfolioDetails` existant + un seul appel scores innovation
- Filtres appliqués côté client (volume limité aux projets du portefeuille)

## Hors scope (pourra venir plus tard)
- Network graph (liens entre projets / managers)
- Timeline / roadmap (déjà couvert par le Gantt consolidé)
- Sauvegarde des filtres en localStorage

---

**Question complémentaire** avant implémentation : préfères-tu que je livre les **3 visualisations d'un coup** (plus complet mais plus lourd), ou un **MVP avec uniquement la matrice bubble** (scénario 1) puis on ajoute les autres ensuite selon retour utilisateur ?

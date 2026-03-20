

# Rendre tous les indicateurs du dashboard cliquables

## Contexte
Le composant `ProjectsSummary` affiche 9 catégories d'indicateurs. Seuls 2 sont cliquables (Total → `/projects`, Portefeuilles → `/portfolios`). L'objectif est de rendre **tous** les indicateurs cliquables pour naviguer vers la liste de projets filtrée.

## Mécanisme de filtrage
La page `/projects` (`Index.tsx`) utilise `localStorage` pour persister les filtres. On réutilise ce mécanisme : avant de naviguer, on écrit les filtres souhaités dans `localStorage`, puis on navigue vers `/projects`. La page les lira automatiquement à l'initialisation.

## Mapping indicateur → filtre

| Indicateur | Action localStorage | Navigation |
|---|---|---|
| **Total** | Reset tous les filtres | `/projects` |
| **Chef de projet** | `showMyProjectsOnly = true` + flag `dashboardRoleFilter = cp` | `/projects` |
| **Membre** | `dashboardRoleFilter = member` | `/projects` |
| **Vue Manager** | `dashboardRoleFilter = manager` | `/projects` |
| **Sans revue récente** | `dashboardWithoutReviewFilter = true` | `/projects` |
| **Badge météo** (sunny/cloudy/stormy) | `dashboardWeatherFilter = <weather>` | `/projects` |
| **Badge cycle de vie** (in_progress, etc.) | `projectLifecycleStatus = <status>` | `/projects` |
| **Portefeuilles** | _(déjà fait)_ | `/portfolios` |

## Modifications

### 1. `src/pages/Index.tsx`
- Ajouter 3 nouveaux états de filtre lus depuis `localStorage` au montage :
  - `dashboardRoleFilter` (`cp` | `member` | `manager` | `null`) — filtre côté client sur les projets chargés
  - `dashboardWeatherFilter` (`sunny` | `cloudy` | `stormy` | `null`)
  - `dashboardWithoutReviewFilter` (`true` | `false`)
- Après lecture au montage, **supprimer** ces clés de `localStorage` (filtres "one-shot" pour ne pas persister entre navigations manuelles).
- Appliquer ces filtres dans la logique de filtrage existante des projets (au même niveau que `showMyProjectsOnly`, `lifecycleStatus`, etc.).
- Afficher un badge récapitulatif dans `ProjectFilters` pour les filtres dashboard actifs, avec possibilité de les réinitialiser.

### 2. `src/components/dashboard/ProjectsSummary.tsx`
- Ajouter une fonction utilitaire `navigateWithFilter(filters: Record<string, string>)` qui écrit dans `localStorage` puis `navigate('/projects')`.
- Brancher `onClick` sur tous les indicateurs :
  - MetricCards "Chef de projet", "Membre", "Vue Manager" : écriture du `dashboardRoleFilter`
  - Badge "Sans revue récente" : écriture du `dashboardWithoutReviewFilter`
  - Badges météo : écriture du `dashboardWeatherFilter`
  - Badges cycle de vie : écriture du `projectLifecycleStatus` (filtre existant)
- Ajouter `cursor-pointer` et effet hover sur les badges météo et cycle de vie.

### 3. `src/components/project/ProjectFilters.tsx`
- Ajouter des props optionnelles pour les filtres dashboard (rôle, météo, sans revue) avec leurs badges et bouton reset.

## Effets de bord identifiés

| Effet de bord | Risque | Résolution |
|---|---|---|
| **Filtres persistants indésirables** : l'utilisateur clique sur un indicateur, va sur `/projects`, puis navigue ailleurs et revient — les filtres dashboard seraient encore actifs | Moyen | Les clés `dashboard*` sont supprimées de `localStorage` dès lecture au montage → filtre "one-shot" |
| **Conflit avec filtres existants** : l'utilisateur a déjà des filtres sauvegardés (lifecycle, org, etc.) qui se cumulent avec le filtre dashboard | Moyen | Lors du clic sur un indicateur, on **réinitialise** les autres filtres localStorage avant d'écrire le filtre dashboard ciblé |
| **Filtre "rôle" non supporté nativement** : la page projets ne filtre pas par rôle (CP/Membre/Manager) actuellement | Faible | Ajout d'un filtrage côté client en réutilisant la même logique que `useDashboardData` (comparaison email CP, memberships, reste = manager) |
| **Filtre "sans revue" non supporté nativement** | Faible | Ajout d'un filtre client : projets `in_progress` sans `last_review_date` ou > 30 jours |
| **Filtre "météo" non supporté nativement** | Faible | Ajout d'un filtre client sur le champ `weather` déjà présent dans `ProjectListItem` |
| **Indicateur à 0** : cliquer sur un indicateur valant 0 affiche une liste vide | Faible | Acceptable — la liste vide avec message "Aucun projet" est déjà gérée. On peut désactiver le clic si valeur = 0 (`onClick={value > 0 ? handler : undefined}`) |

## Fichiers impactés
- `src/components/dashboard/ProjectsSummary.tsx` — ajout onClick sur tous les indicateurs
- `src/pages/Index.tsx` — lecture des filtres dashboard one-shot + logique de filtrage étendue
- `src/components/project/ProjectFilters.tsx` — affichage des badges filtres dashboard + reset


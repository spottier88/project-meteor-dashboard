

# Refonte du suivi d'activités — Plan d'implémentation

## Résumé

Supprimer l'ancien système de suivi horaire, simplifier la navigation (suppression des onglets redondants), rendre la saisie de points plus directe et le dashboard plus lisible, tout en conservant l'import calendrier Microsoft et les deux granularités (hebdomadaire/quotidienne).

## Architecture cible

```text
/activities (utilisateur)
┌─────────────────────────────────────────────┐
│  En-tête : "Mes activités" + nav semaine    │
│  Barre quota : [████████░░] 7/10 points     │
├────────────┬────────────────────────────────┤
│ Vue semaine│  Vue jour (toggle)             │
│ (défaut)   │                                │
├────────────┴────────────────────────────────┤
│  Saisie inline (tableau éditable)           │
│  + Boutons : Saisie rapide / Import cal.    │
├─────────────────────────────────────────────┤
│  Graphiques : répartition + tendance 6 sem  │
│  (intégrés dans la même page, pas un onglet)│
└─────────────────────────────────────────────┘

/team-activities (manager)
┌─────────────────────────────────────────────┐
│  En-tête : "Activités équipe" + nav semaine │
│  Filtres : utilisateur / projet / type      │
├─────────────────────────────────────────────┤
│  KPIs : total / contributeurs / moyenne     │
├─────────────────────────────────────────────┤
│  Graphiques unifiés                         │
└─────────────────────────────────────────────┘
```

## Étapes d'implémentation

### 1. Corriger l'erreur de build existante
- **`supabase/functions/api-gateway/index.ts` ligne 483** : caster `error` en `(error as Error).message` pour résoudre le TS18046.

### 2. Supprimer l'ancien système de suivi horaire
**Composants supprimés** (plus aucune référence) :
- `ActivityEntry.tsx`, `QuickActivityForm.tsx` (formulaire heures)
- `BulkActivityEntry.tsx`, `BulkActivityTable.tsx` (saisie en masse heures)
- `ActivityList.tsx`, `ActivityChart.tsx`, `ActivityTypeChart.tsx`, `ProjectTimeChart.tsx` (graphiques heures)
- `ActivityFilters.tsx`, `TeamActivityFilters.tsx`, `TeamActivityHeader.tsx`, `IndividualActivityHeader.tsx`

**Hooks supprimés** :
- `useActivityData.ts`, `useActivityPeriod.ts`
- Les utilitaires `activityExport.ts` (si dédiés aux heures)

**Types nettoyés dans `activity.ts`** : retirer `Activity`, `ActivityWithDetails`, `BulkActivityEntry`, `CalendarEvent` (si plus utilisés).

### 3. Refondre la page utilisateur (`ActivityManagement.tsx`)
**Supprimer les Tabs** (plus de bascule heures/points/dashboard). Une seule vue unifiée :
- **Section haute** : navigation semaine + barre de quota visuelle (progress bar)
- **Section saisie** : tableau des points distribués avec suppression inline. Boutons "Ajouter" et "Saisie en masse" et "Import calendrier". Toggle hebdo/quotidien intégré comme sous-vue (pas un onglet séparé).
- **Section dashboard** : graphiques de répartition et tendance directement en dessous (fusionner `IndividualPointsDashboard` dans la même page au lieu d'un onglet séparé). Filtres projet/type au-dessus des graphiques.

### 4. Refondre la page manager (`TeamActivities.tsx`)
**Supprimer les Tabs** (plus d'onglet "Suivi horaire ancien"). Une seule vue :
- Navigation semaine + filtres (utilisateur, projet, type d'activité)
- KPIs en cartes (total, contributeurs, moyenne)
- Graphiques (répartition, tendance, détails par type et par projet)
- Export Excel

### 5. Simplifier le formulaire de saisie de points
- `PointsEntryForm` : réduire les champs obligatoires. Projet et type d'activité en sélecteurs inline, description optionnelle.
- Rendre la saisie plus rapide : pré-sélection du projet le plus utilisé, raccourcis clavier.

### 6. Conserver et intégrer l'import calendrier
- Déplacer `CalendarImport` pour qu'il soit accessible directement depuis la page unifiée (bouton dans la section saisie).
- L'import crée des entrées de points (il faudra vérifier/adapter le mapping événement → points si nécessaire).

## Fichiers impactés

| Action | Fichiers |
|---|---|
| Correction build | `supabase/functions/api-gateway/index.ts` |
| Refonte majeure | `src/components/activities/ActivityManagement.tsx` |
| Refonte majeure | `src/pages/TeamActivities.tsx` |
| Conservés/adaptés | `WeeklyPointsEntry.tsx`, `DailyPointsEntry.tsx`, `BulkPointsEntry.tsx`, `PointsEntryForm.tsx`, `CalendarImport.tsx` |
| Conservés tels quels | `WeeklyPointsDistribution.tsx`, `PointsVisualization.tsx`, `ActivityTypeDistributionChart.tsx`, `WeeklyTrendChart.tsx`, `ProjectPointsChart.tsx`, `ActivityTypePointsChart.tsx`, `CookieSlider.tsx`, `PointsCookieSlider.tsx` |
| Supprimés | ~15 composants et ~3 hooks liés au suivi horaire (listés ci-dessus) |
| Nettoyage types | `src/types/activity.ts` |

## Ce qui ne change pas

- Tables Supabase (`activity_points`, `activity_types`, `activity_type_permissions`) : aucune modification de schéma
- Hooks conservés : `useWeeklyPoints`, `useWeeklyPointsData`, `useWeeklyTrend`, `useActivityPointsQuota`, `useActivityTypes`, `useUserActivityTypePermissions`
- RLS et permissions
- La table `activities` (heures) reste en base mais n'est plus utilisée côté front
- L'import calendrier Microsoft (OAuth) est conservé
- Le reste de l'application (projets, portefeuilles, etc.)


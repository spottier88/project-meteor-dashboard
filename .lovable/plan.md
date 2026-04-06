

# Afficher le taux d'avancement réel dans les Gantt projets (panier & portefeuille)

## Situation actuelle

Dans les vues Gantt panier et portefeuille, la progression affichée est **déduite du statut** via `getProgressForStatus()` (todo→0%, in_progress→50%, done→100%). Or, chaque projet possède un **taux d'avancement réel** (`completion`) issu de sa dernière revue, stocké dans la vue `latest_reviews`.

## Correction

### 1. Requêtes Supabase — ajouter `completion` depuis `latest_reviews`

**Fichiers** : `ProjectGanttSheet.tsx` et `PortfolioGanttSheet.tsx`

Modifier la requête pour joindre `latest_reviews` et récupérer `completion` :

```sql
SELECT id, title, start_date, end_date, lifecycle_status
FROM projects WHERE id IN (...)
```

Devient (via Supabase JS) :

```ts
const { data: projects } = await supabase
  .from("projects")
  .select(`id, title, start_date, end_date, lifecycle_status`)
  .in("id", projectIds);

// + requête complémentaire sur latest_reviews
const { data: reviews } = await supabase
  .from("latest_reviews")
  .select("project_id, completion")
  .in("project_id", projectIds);
```

Puis fusionner le `completion` dans chaque projet lors du mapping vers `allTasks`.

### 2. Interface `RawGanttTask` — ajouter le champ `completion`

**Fichier** : `src/utils/gantt-helpers.ts`

Ajouter `completion?: number` à `RawGanttTask`.

### 3. Fonction `mapTasksToSvarFormat` — utiliser `completion` en priorité

**Fichier** : `src/utils/gantt-helpers.ts`

Modifier la ligne de calcul de la progression :

```ts
// Avant
const progress = getProgressForStatus(task.status);

// Après : utiliser completion si disponible, sinon fallback sur le statut
const progress = task.completion !== undefined && task.completion !== null
  ? task.completion
  : getProgressForStatus(task.status);
```

Cela garantit que les tâches individuelles (sans `completion`) continuent d'utiliser le fallback par statut, tandis que les projets affichent leur avancement réel.

### 4. Mapping dans les sheets — transmettre `completion`

**Fichiers** : `ProjectGanttSheet.tsx` et `PortfolioGanttSheet.tsx`

Dans le mapping `allTasks`, ajouter le champ `completion` issu de la jointure :

```ts
const allTasks = projectsData?.map((project) => ({
  ...existingFields,
  completion: reviewsMap.get(project.id) ?? 0,
})) || [];
```

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/utils/gantt-helpers.ts` | Ajout `completion` à `RawGanttTask` + priorité dans le calcul de `progress` |
| `src/components/cart/ProjectGanttSheet.tsx` | Requête `latest_reviews` + transmission `completion` |
| `src/components/portfolio/PortfolioGanttSheet.tsx` | Requête `latest_reviews` + transmission `completion` |

## Risques

Aucun risque identifié : le fallback par statut reste actif pour les tâches sans `completion`, et les vues en lecture seule ne sont pas affectées fonctionnellement.


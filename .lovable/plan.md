

# Analyse approfondie du non-rafraîchissement après réordonnancement

## Cause probable principale

Le problème ne vient pas seulement du `refetchQueries` dans `TaskTable.tsx`. L’analyse du flux montre que le composant affiche des données provenant de plusieurs sources selon le contexte :

- `TaskList.tsx` utilise soit :
  - sa propre query `["tasks", projectId]`
  - soit `preloadedTasks` si elles sont fournies
- `ProjectSummaryContent.tsx` passe justement `preloadedTasks={tasks}`
- `ProjectSummary.tsx` alimente ces `tasks` depuis sa propre query `["tasks", projectId]`
- pour les projets maîtres, l’écran peut aussi utiliser `aggregatedTasks`

En pratique, `TaskTable` refetch bien une query locale, mais l’affichage peut rester figé si la source réellement rendue est un prop déjà résolu plus haut dans l’arbre, sans mise à jour optimiste locale.

## Deuxième cause identifiée

`TaskTable.tsx` calcule `sortedParentTasks` directement depuis les props. Après un drag & drop :

- l’ordre est bien persisté en base
- mais il n’y a pas d’état local de liste réordonnée
- on dépend donc entièrement du retour React Query / du parent
- si le parent ne rerend pas immédiatement avec de nouvelles références, l’utilisateur ne voit aucun changement instantané

## Troisième point à corriger

Dans le `map` des lignes de `TaskTable.tsx`, le retour se fait via un fragment `<>...</>` sans clé au niveau top-level, alors que les lignes internes ont leurs propres clés. Lors d’un changement d’ordre, cela peut perturber la réconciliation React et empêcher un rerendu propre de la séquence parent + sous-tâches.

## Plan de correction

### 1. Rendre `TaskTable` immédiatement réactif après drag

Introduire un état local dédié dans `TaskTable.tsx` pour l’ordre affiché des tâches parentes :

- initialiser cet état depuis `tasks`
- le resynchroniser quand `tasks` change
- lors du `handleDragEnd`, appliquer immédiatement `arrayMove(...)` sur cet état local avant même le refetch

Ainsi, l’utilisateur voit instantanément le nouvel ordre, même si le parent met un peu de temps à recharger.

### 2. Corriger la source de vérité dans `TaskList`

Faire évoluer `TaskList.tsx` pour mieux gérer le cas `preloadedTasks` :

- conserver un état local `displayTasks` quand `preloadedTasks` est utilisé
- exposer un callback `onTasksReordered` vers `TaskTable`
- après drag & drop, mettre à jour cet état local immédiatement
- si `TaskList` utilise sa propre query, continuer à appeler `refetch()`

But : ne plus dépendre uniquement du parent quand les tâches sont injectées par props.

### 3. Gérer explicitement le cas des données préchargées dans l’écran projet

Dans `ProjectSummaryContent.tsx` / `ProjectSummary.tsx`, vérifier le comportement cible :

- si on veut garder `preloadedTasks`, alors il faut propager le nouvel ordre jusqu’au parent
- sinon, simplifier en laissant `TaskList` requêter elle-même les tâches dans l’onglet Tâches

Approche recommandée : conserver `preloadedTasks`, mais ajouter un mécanisme de synchronisation locale dans `TaskList`, plus modulaire et moins risqué pour les autres usages.

### 4. Corriger la réconciliation React sur les lignes

Dans `TaskTable.tsx` :

- remplacer le fragment anonyme `<>...</>` du `map` par un `React.Fragment key={task.id}`
- garantir une clé stable au niveau du bloc parent + sous-tâches

Cela évitera les artefacts de rendu lors du changement d’ordre.

### 5. Uniformiser le rafraîchissement des queries liées

Après réordonnancement, déclencher un rafraîchissement cohérent de toutes les sources susceptibles d’alimenter l’écran :

- `["tasks", projectId]`
- `aggregatedTasks`
- éventuellement `project-tasks-for-parent` si le formulaire est ouvert

Le plus propre est d’utiliser la même stratégie que `useTaskSubmit.ts` : un `refetchQueries` avec `predicate` sur les clés liées aux tâches.

## Fichiers impactés

| Fichier | Correction |
|---|---|
| `src/components/task/TaskTable.tsx` | état local d’ordre, mise à jour optimiste, clé React correcte, refetch élargi |
| `src/components/TaskList.tsx` | gestion locale des `preloadedTasks`, synchronisation après réordonnancement |
| `src/components/project/ProjectSummaryContent.tsx` | adaptation éventuelle du passage des tâches si nécessaire |
| `src/pages/ProjectSummary.tsx` | vérification du flux `tasks` / `aggregatedTasks` pour garantir le rerendu |

## Résultat attendu

Après déplacement d’une tâche :

- la liste se réordonne immédiatement à l’écran
- l’ordre est persisté en base
- le parent est ensuite resynchronisé proprement
- le comportement est identique en affichage standard et dans les écrans utilisant des tâches préchargées

## Détail technique

```text
Etat actuel
TaskTable -> update base -> refetch query locale
             mais l'écran peut afficher preloadedTasks venant du parent
             donc aucun changement visible immédiat

Etat cible
TaskTable -> update optimiste locale immédiate
          -> persistence Supabase
          -> refetch de toutes les queries liées
          -> resynchronisation propre du parent
```



## Plan de correction — Persistance des dates Gantt non exécutée

### Diagnostic retenu

Le problème ne semble plus être côté callback `onUpdate` : il est bien appelé dans `persistTaskDates`.

Les indices lus dans le code et le runtime pointent vers un blocage plus en amont :

1. Dans `TaskGantt.tsx`, l’écriture DB ne part que si `ev.inProgress` est faux :
   ```ts
   if (ev.inProgress) return true;
   ```
2. Le snapshot réseau au moment du problème montre uniquement des `GET /tasks` et aucune requête d’update sur `tasks`.
3. Donc la mise à jour n’atteint probablement jamais Supabase : le souci est dans la capture/finalisation de l’événement SVAR, pas dans l’update SQL elle-même.
4. Le composant dépend aujourd’hui d’un “événement final” implicite du drag, qui n’est manifestement pas fiable pour tous les cas (déplacement complet, resize gauche/droite).
5. En plus, `TaskGantt` reste éditable dès que `isProjectClosed` est faux, même dans des contextes transverses où aucune persistance n’est souhaitée.

Conclusion : l’UI bouge localement, mais le pipeline “fin de drag → persistance DB” n’est pas suffisamment robuste.

---

## Correction proposée

### 1. Rebrancher la persistance sur l’API SVAR, pas uniquement sur la prop JSX
Dans `TaskGantt.tsx`, centraliser l’écoute des mises à jour via `api.on("update-task", ...)` dans `handleInit`, comme c’est déjà fait pour `show-editor`, `add-task` et `drag-task`.

Objectif :
- écouter la vraie source d’événements SVAR ;
- ne plus dépendre d’un comportement ambigu de `onupdatetask`.

### 2. Supprimer la dépendance au seul `inProgress === false`
Remplacer la logique actuelle par une finalisation robuste :

- à chaque update contenant `start` ou `end` :
  - mettre à jour `localTasks` immédiatement pour garder une UI fluide ;
  - stocker la dernière valeur reçue dans une ref par `taskId`.
- lancer un debounce court (ex. 250–400 ms) par tâche ;
- à la fin du drag/resize, persister uniquement la dernière valeur reçue.

Ainsi :
- si SVAR envoie bien un événement final : on flush tout de suite ;
- s’il n’envoie que des événements “in progress” : le debounce sauve quand même la dernière position.

### 3. Sécuriser les contextes réellement éditables
Ajouter une prop explicite de type :
- `canEditTaskDates?: boolean`
ou
- `isReadOnly?: boolean`

Puis l’utiliser pour piloter :
- `readonly` du composant Gantt ;
- le déclenchement ou non de la persistance.

À passer ensuite dans :
- `TaskList.tsx` : édition autorisée ;
- `PortfolioGanttSheet.tsx` : lecture seule ;
- `ProjectGanttSheet.tsx` : lecture seule ;
- `MyTasks.tsx` : à confirmer selon le comportement métier voulu.

Cela évitera des déplacements visuels “non persistables”.

### 4. Fiabiliser la sérialisation des dates
Ne plus utiliser `toISOString().split("T")[0]` pour écrire les dates si la source est locale.

Risque actuel : décalage d’un jour selon le fuseau horaire.

Correction prévue :
- formatter en date locale `yyyy-MM-dd` avant envoi.

### 5. Durcir la gestion d’erreur
En cas d’échec DB :
- logger le `taskId` et le payload réellement envoyé ;
- afficher un toast d’erreur unique ;
- relancer `onUpdate?.()` ou restaurer la valeur précédente pour éviter un affichage faux.

---

## Détail technique

### Fichiers impactés
- `src/components/task/TaskGantt.tsx`  
  Refonte du flux d’update Gantt.
- `src/components/TaskList.tsx`  
  Transmission explicite du droit d’édition des dates.
- `src/components/portfolio/PortfolioGanttSheet.tsx`  
  Passage en lecture seule explicite.
- `src/components/cart/ProjectGanttSheet.tsx`  
  Passage en lecture seule explicite.
- `src/pages/MyTasks.tsx`  
  Alignement avec la règle métier voulue.
- Éventuellement une migration Supabase  
  uniquement si l’audit confirme qu’une policy `UPDATE` sur `tasks` est absente ou trop restrictive.

### Risques principaux et actions de levée

**Risque 1 — Toujours aucun write DB après correction**
- Action : basculer l’écoute sur `api.on("update-task", ...)` et ne plus dépendre du seul handler prop.

**Risque 2 — Multiplication des updates pendant le drag**
- Action : debounce par tâche + persistance de la dernière valeur uniquement.

**Risque 3 — Écart entre affichage local et base si erreur**
- Action : snapshot avant modification + refetch/revert sur erreur.

**Risque 4 — Éditions autorisées dans des vues non persistables**
- Action : introduire un mode lecture seule explicite, indépendant de `isProjectClosed`.

**Risque 5 — Décalage de date d’un jour**
- Action : formatter les dates en local avant envoi, pas en UTC ISO.

**Risque 6 — Blocage RLS silencieux**
- Action : vérifier la policy `UPDATE` de `tasks` avant clôture du correctif ; si nécessaire, l’aligner sur la logique existante de gestion projet.

---

## Ordre d’implémentation recommandé

1. Refondre `TaskGantt.tsx` pour écouter les updates via l’API SVAR.
2. Mettre en place le stockage du dernier état + debounce de persistance.
3. Corriger la sérialisation locale des dates.
4. Introduire une prop explicite de lecture seule / droit d’édition.
5. Propager cette prop aux vues projet / panier / portefeuille / mes tâches.
6. Vérifier ensuite la policy `UPDATE` de `tasks` uniquement comme filet de sécurité.
7. Tester les 3 cas :
   - déplacement complet de barre ;
   - resize gauche ;
   - resize droite ;
   avec confirmation visuelle + confirmation en base après refetch.



# Correction définitive du bug de navigation sur `/projects`

## Diagnostic complété

La configuration de routage n’est probablement plus la cause principale :

- `src/routes.tsx` contient bien une route valide pour `/`, `/admin`, `/projects/:projectId` et les autres cibles concernées.
- une seule instance de `BrowserRouter` est bien présente ;
- le fait que **l’URL change correctement** prouve que `Link` et `navigate()` s’exécutent.

Le symptôme exact est donc plutôt celui-ci :

```text
clic -> navigate()/Link met à jour l'URL
     -> React Router v7 lance une transition
     -> la page /projects continue à produire des mises à jour React synchrones
     -> la transition ne commit pas visuellement
     -> l'ancienne page reste affichée
```

## Cause racine retenue

Le point le plus critique est un **cycle de rendu propre à la page `/projects`**.

### Boucle identifiée
Dans `src/pages/Index.tsx` :

- `handleFilteredProjectsChange` est recréé à chaque rendu ;
- ce callback fait `setAccessibleProjectIds(...)`.

Dans `src/components/ProjectGrid.tsx` et `src/components/ProjectTable.tsx` :

- un `useEffect` dépend de `onFilteredProjectsChange` ;
- cet effet rappelle le parent avec un **nouveau tableau d’IDs**.

Résultat :

```text
Index render
-> nouveau callback onFilteredProjectsChange
-> ProjectGrid/ProjectTable useEffect se relance
-> setAccessibleProjectIds(newArray)
-> Index re-render
-> nouveau callback
-> effet relancé
-> etc.
```

Même si l’écran semble “stable”, cette boucle suffit à saturer `/projects` et à empêcher React Router v7 de finaliser ses transitions.

### Facteur aggravant
`src/components/ProjectTable.tsx` calcule `filteredProjects` via `useQuery`, alors qu’il s’agit d’un **filtrage local pur**.

La `queryKey` inclut des dépendances instables (`userProfile`, `projectAccess`, etc.), ce qui augmente les recalculs et rend le rendu encore plus nerveux sur cette page.

## Pourquoi cela explique parfaitement le bug

Cela colle avec tous les symptômes signalés :

- **bouton Retour** : l’URL passe à `/`, mais la transition ne commit pas ;
- **bouton Administration** : l’URL passe à `/admin`, mais l’écran courant reste affiché ;
- **clic carte projet / ligne tableau** : l’URL passe à `/projects/:id`, mais l’ancienne page reste présente ;
- **bug circonscrit à `/projects`** : c’est la seule page inspectée où cette boucle parent/enfant existe clairement.

Les correctifs précédents sur `ProtectedRoute` et `pointer-events` peuvent rester, mais ils ne traitent pas cette cause racine.

## Plan de correction

### 1. Supprimer la synchronisation enfant -> parent qui crée la boucle
Fichiers :
- `src/pages/Index.tsx`
- `src/components/project/ProjectList.tsx`
- `src/components/ProjectGrid.tsx`
- `src/components/ProjectTable.tsx`

Action :
- supprimer le pattern `onFilteredProjectsChange` tel qu’il existe aujourd’hui ;
- ne plus faire remonter les IDs visibles au parent depuis un `useEffect` enfant.

Objectif :
- casser définitivement la boucle de rendu sur `/projects`.

### 2. Centraliser le calcul des projets réellement visibles
Fichier conseillé :
- nouveau hook partagé, par ex. `src/hooks/useVisibleProjects.ts`

Action :
- calculer en un seul endroit :
  - les filtres métier de `Index.tsx` ;
  - les droits d’accès projet ;
  - la liste finale des projets visibles ;
  - la liste finale des IDs visibles.

Le hook devra réutiliser les briques déjà présentes :
- `usePermissionsContext`
- `useUserProjectMemberships`
- `useManagerProjectAccess`

Objectif :
- éviter que `ProjectGrid` et `ProjectTable` recodent chacun leur logique d’accès ;
- fournir directement à `Index.tsx` :
  - `visibleProjects`
  - `visibleProjectIds`

### 3. Refactorer `Index.tsx` pour devenir la source unique de vérité
Fichier :
- `src/pages/Index.tsx`

Action :
- supprimer l’état `accessibleProjectIds` ;
- supprimer `handleFilteredProjectsChange` ;
- utiliser directement `visibleProjectIds` issus du hook partagé ;
- passer `visibleProjects` à `ProjectList`.

Objectif :
- plus aucun `setState` déclenché en boucle depuis les enfants ;
- `AddFilteredToCartButton` continue de recevoir les bons IDs, mais sans aller-retour parent/enfant.

### 4. Simplifier `ProjectGrid` en composant purement présentatif
Fichier :
- `src/components/ProjectGrid.tsx`

Action :
- retirer :
  - la logique de filtrage d’accès ;
  - l’effet qui notifie le parent ;
  - l’état `isPermissionsLoaded` si non indispensable ;
  - les requêtes qui ne servent qu’à recalculer une visibilité déjà connue du parent.

Le composant doit seulement :
- recevoir la liste finale de projets à afficher ;
- paginer ;
- rendre les cartes.

Objectif :
- réduire fortement les rerenders ;
- rendre la vue grille triviale et stable.

### 5. Simplifier `ProjectTable` et retirer le `useQuery` local inadapté
Fichier :
- `src/components/ProjectTable.tsx`

Action :
- supprimer le `useQuery` utilisé pour `filteredProjects` ;
- remplacer ce calcul par `useMemo` ;
- retirer la logique de remontée d’IDs au parent ;
- conserver uniquement :
  - tri ;
  - pagination ;
  - rendu des lignes.

Objectif :
- éliminer les dépendances instables dans `queryKey` ;
- supprimer une source majeure de rerenders inutiles ;
- éviter que la vue tableau soit plus fragile que la vue grille.

### 6. Nettoyage d’architecture pour éviter une régression
Fichiers :
- `src/components/project/ProjectList.tsx`
- éventuellement hooks liés à la liste projets

Action :
- retirer la prop `onFilteredProjectsChange` de la chaîne de composants ;
- documenter que les composants de liste sont désormais “présentation only” ;
- réserver les calculs d’accès/visibilité au niveau hook/page.

Objectif :
- rendre le bug difficile à réintroduire plus tard.

## Fichiers impactés

### À modifier
- `src/pages/Index.tsx`
- `src/components/project/ProjectList.tsx`
- `src/components/ProjectGrid.tsx`
- `src/components/ProjectTable.tsx`

### À créer
- `src/hooks/useVisibleProjects.ts`  
  ou un hook équivalent de centralisation de la visibilité projets

### À conserver sans re-travailler en priorité
- `src/routes.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/utils/resetInteractionLocks.ts`

Ces fichiers ne semblent plus être le cœur du bug actuel.

## Risques

### Risque principal
La zone sensible est la logique de “projets visibles” utilisée pour :
- l’affichage réel de la liste ;
- les droits manager/membre/admin ;
- l’ajout des projets filtrés au panier.

### Réduction du risque
Le refactor proposé réduit le risque global car il :
- supprime la duplication Grid/Table ;
- supprime les effets de synchronisation fragiles ;
- remplace des calculs répartis par une source unique de vérité.

## Vérifications à réaliser après correction

### Navigation depuis `/projects`
Tester en vue grille et en vue tableau :
- bouton `Retour`
- bouton `Administration`
- clic sur une carte projet
- clic sur une ligne du tableau
- actions du menu projet :
  - tâches
  - risques
  - cadrage
  - équipe

### Régression fonctionnelle
Vérifier aussi :
- filtres texte / statut / organisation / tags
- pagination
- bascule grille/tableau
- ajout au panier des projets filtrés
- respect des droits admin / manager / membre / chef de projet

## Conclusion

La meilleure piste n’est plus un bug de route matching, mais un **render loop local à `/projects`**.  
Le correctif durable consiste à :

1. **supprimer la remontée d’état enfant -> parent via `useEffect`** ;
2. **centraliser le calcul des projets visibles** ;
3. **rendre `ProjectGrid` et `ProjectTable` purement présentatifs** ;
4. **sortir le filtrage local de React Query**.

C’est cette refonte ciblée qui a le plus de chances de résoudre définitivement le fait que l’URL change mais que l’écran reste bloqué sur la liste des projets.

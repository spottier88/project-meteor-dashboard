

# Revue complete de l'application METEOR - Optimisations et ameliorations

## 1. Problemes de duplication de code

### 1.1 Deux fichiers `useProjectPermissions` coexistent

Actuellement, deux hooks avec le meme nom existent dans deux fichiers differents :
- `src/hooks/useProjectPermissions.tsx` (version complete, 192 lignes)
- `src/hooks/use-project-permissions.tsx` (version simplifiee, 99 lignes)

Certains composants importent l'un, d'autres importent l'autre :
- `ProjectForm.tsx`, `ProjectSummaryActions.tsx`, `TaskManagement.tsx`, `RiskManagement.tsx`, `ProjectSummary.tsx`, `ProjectCard.tsx`, `ProjectTeamManagement.tsx` → importent `useProjectPermissions.tsx`
- `ProjectFraming.tsx`, `FramingDetails.tsx`, `ProjectActions.tsx` → importent `use-project-permissions.tsx`

**Risque** : Les deux versions ne retournent pas les memes proprietes (la version simplifiee ne gere pas `isReadOnlyViaPortfolio`, `canReactivateProject`, `canCompleteEvaluation`, `canEditOrganization`, etc.). Cela peut entrainer des comportements incoherents.

**Action** : Supprimer `src/hooks/use-project-permissions.tsx` et migrer tous les imports vers `src/hooks/useProjectPermissions.tsx`.

### 1.2 Duplication `Project` dans les types

L'interface `Project` est definie deux fois :
- `src/types/project.ts` (lignes 17-35)
- `src/types/user.ts` (lignes 77-95)

Les deux definitions ont des champs differents (`lastReviewDate` vs `last_review_date`, `completion` obligatoire vs optionnel). Certains fichiers importent depuis `user.ts`, d'autres depuis `project.ts`.

**Action** : Supprimer la definition dans `user.ts` et ne conserver qu'une seule source dans `project.ts`, en harmonisant les noms de champs.

### 1.3 Hook `useAdminModeAwarePermissions` inutilise

Le fichier `src/hooks/useAdminModeAwarePermissions.ts` wraps `usePermissionsContext` mais ne semble utilise nulle part. Sa methode `toggleAdminRole` est une fonction vide.

**Action** : Verifier les usages et supprimer si non utilise.

---

## 2. Typage faible (`any`)

L'application utilise massivement le type `any` (455 occurrences dans 56 fichiers). Les cas les plus problematiques :

| Fichier | Probleme |
|---------|----------|
| `useProjectFormState.tsx` | `project?: any` - impossible de savoir quelles proprietes sont attendues |
| `useProjectSubmit.tsx` | `project?: any`, `onSubmit?: (projectData: any) => Promise<any>` |
| `useProjectFormSubmit.tsx` | `project?: any`, `onSubmit: (projectData: any) => Promise<any>` |
| `ProjectForm.tsx` | `project?: any`, `onSubmit: (projectData: any) => Promise<any>` |
| `ProjectSummaryContent.tsx` | `project: any`, `lastReview: any` |
| `Dashboard.tsx` | `selectedProject: any` |
| `Index.tsx` | `selectedProject: any` |

**Action** : Creer des interfaces typees pour les objets `project`, `review`, `task` tels qu'ils sont retournes par Supabase, et les utiliser dans toutes les signatures de fonctions. Un fichier `src/types/supabase-models.ts` pourrait centraliser ces types derives.

---

## 3. Nettoyage des logs

### 3.1 Logs actifs en production

Malgre le logger centralize, de nombreux `console.log` directs subsistent dans le code de production :
- `ProtectedRoute.tsx` : 6 `console.log` actifs
- `useProjectsListView.ts` : 3 `console.log` actifs
- `useProjectSubmit.tsx` : 1 `console.log` actif (monitoring)
- `TeamActivityFilters.tsx` : 4 `console.log` actifs

### 3.2 Logs commentes

De nombreux fichiers contiennent des blocs de logs commentes (`// console.log(...)`) qui alourdissent la lecture : `PermissionsContext.tsx`, `HierarchyAssignmentFields.tsx`, `UserInfo.tsx`, etc.

**Action** :
- Remplacer tous les `console.log` actifs par des appels au `logger` existant
- Supprimer tous les logs commentes

---

## 4. Architecture et organisation du code

### 4.1 Convention de nommage des fichiers hooks inconsistante

Deux conventions coexistent pour les fichiers de hooks :
- Format kebab-case : `use-project-permissions.tsx`, `use-dashboard-data.ts`, `use-team-management.tsx`
- Format camelCase : `useProjectPermissions.tsx`, `useAdminModeAwareData.ts`, `useProjectSubmit.tsx`

**Action** : Harmoniser vers une seule convention (camelCase recommande pour les hooks React).

### 4.2 `useProjectFormState` trop volumineux (448 lignes, 30+ etats)

Ce hook gere 30+ useState individuels. C'est difficile a maintenir et source de bugs.

**Action** : Refactoriser en utilisant `useReducer` avec un seul objet d'etat, ou decouper en sous-hooks thematiques :
- `useProjectBasicFields` (titre, description, manager, dates)
- `useProjectOrganization` (pole, direction, service)
- `useProjectInnovation` (novateur, usager, ouverture, agilite, impact)
- `useProjectFraming` (context, objectives, governance, ...)

### 4.3 `useProjectSubmit` trop long et monolithique (309 lignes)

La fonction `submitProject` fait tout dans un seul bloc try/catch : creation du projet, innovation, monitoring, framing, portefeuilles, templates.

**Action** : Extraire des fonctions utilitaires :
- `saveInnovationScores(projectId, formState)`
- `saveMonitoring(projectId, formState)`
- `saveFraming(projectId, formState)`
- `savePortfolios(projectId, formState, ownerId)`

### 4.4 `PermissionsContext` bloque le rendu

Le `PermissionsProvider` retourne `null` pendant le chargement (lignes 145-153), ce qui cause un ecran blanc. Les composants enfants ne s'affichent pas du tout tant que les permissions ne sont pas chargees.

**Action** : Remplacer par un composant de chargement (spinner ou skeleton), ou rendre les enfants avec un contexte en etat "loading" et laisser chaque page gerer son propre etat de chargement.

### 4.5 `organizationAccess.ts` - requetes Supabase en cascade

La fonction `getUserAccessibleOrganizations` effectue de nombreuses requetes Supabase sequentielles (await dans des boucles for). Pour un chef de projet avec plusieurs affectations, cela peut generer 10+ requetes.

**Action** : Regrouper les requetes en utilisant `.in()` plutot que des boucles sequentielles, ou creer une fonction RPC cote base de donnees.

---

## 5. Ameliorations pour les utilisateurs

### 5.1 Feedback utilisateur lors des chargements

Plusieurs pages affichent un simple spinner generique sans texte explicatif. L'utilisateur ne sait pas ce qui se charge.

**Action** : Ajouter des messages contextuels ("Chargement des projets...", "Verification des permissions...") et utiliser des skeletons pour les listes et tableaux.

### 5.2 Gestion d'erreurs insuffisante

Les erreurs Supabase sont souvent loguees mais pas toujours communiquees a l'utilisateur. Par exemple dans `useProjectSubmit.tsx`, les erreurs de cadrage, innovation et monitoring sont loguees (`console.error`) mais le processus continue silencieusement.

**Action** : Afficher un toast d'avertissement meme pour les erreurs non critiques : "Le projet a ete cree mais les scores d'innovation n'ont pas pu etre enregistres."

### 5.3 Formulaire projet en 5 etapes

Le formulaire de projet a 5 etapes. Lors de l'edition, l'utilisateur doit toujours naviguer depuis l'etape 1, meme s'il veut modifier une information a l'etape 4.

**Action** : Rendre les etapes cliquables directement dans la navigation pour permettre un acces direct.

### 5.4 Chargement de `useProjectFormState` non await pour les portefeuilles

La correction recente du chargement des portefeuilles (`portfolio_projects`) n'a pas ete appliquee. Le fichier actuel montre encore :
```typescript
setPortfolioIds(project.portfolio_id ? [project.portfolio_id] : []);
```
au lieu de la requete vers `portfolio_projects`.

**Action** : Verifier que la correction du dernier diff a bien ete deployee.

---

## 6. Securite

### 6.1 Protection des routes admin insuffisante

La verification des routes admin dans `ProtectedRoute.tsx` se fait cote client uniquement :
```typescript
if (isAdminRoute && !isAdmin) {
  navigate("/");
}
```
Un utilisateur pourrait acceder aux donnees admin via les requetes Supabase si les politiques RLS ne sont pas correctement configurees.

**Action** : Verifier que toutes les tables sensibles (user_roles, profiles, etc.) ont des politiques RLS adequates pour bloquer les acces non autorises au niveau de la base de donnees.

---

## 7. Resume des actions prioritaires

| Priorite | Action | Impact |
|----------|--------|--------|
| Haute | Unifier `useProjectPermissions` (supprimer le doublon) | Coherence des permissions |
| Haute | Corriger le chargement des portefeuilles dans `useProjectFormState` | Bug fonctionnel |
| Haute | Unifier l'interface `Project` (supprimer le doublon dans `user.ts`) | Maintenabilite |
| Moyenne | Remplacer les `console.log` par le logger | Proprete du code |
| Moyenne | Typer les objets `project: any` avec des interfaces reelles | Robustesse |
| Moyenne | Refactoriser `useProjectFormState` (useReducer ou sous-hooks) | Maintenabilite |
| Moyenne | Extraire des fonctions utilitaires de `useProjectSubmit` | Lisibilite |
| Moyenne | Harmoniser la convention de nommage des hooks | Coherence |
| Basse | Ameliorer les feedbacks de chargement (skeletons, messages) | UX |
| Basse | Rendre les etapes du formulaire cliquables | UX |
| Basse | Supprimer le hook inutilise `useAdminModeAwarePermissions` | Nettoyage |


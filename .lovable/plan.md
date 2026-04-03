

# Résolution des problèmes de navigation après migration React Router v7

## Analyse du problème

Trois causes probables identifiées, de la plus critique à la moins critique :

### Cause 1 (principale) — Deux instances distinctes de `BrowserRouter`

`routes.tsx` rend **deux `<Router>` séparés** selon l'état de la session :

```text
AppRoutes
├── if (!session) → <Router> [routes login]     ← instance 1
└── if (session)  → <Router> [routes protégées] ← instance 2
```

En React Router v7, `BrowserRouter` utilise `React.startTransition` pour les mises à jour d'état (comportement `v7_startTransition` activé par défaut). Quand la session change, l'instance 1 est démontée et l'instance 2 est montée avec une **nouvelle instance d'historique**. Ce pattern de double Router peut provoquer des conflits d'historique et des mises à jour de navigation perdues dans la transition.

**Solution** : Consolider en une **unique instance `BrowserRouter`** englobant les deux cas (authentifié/non authentifié).

### Cause 2 — `ProtectedRoute` utilise `window.location.pathname` au lieu de `useLocation()`

```typescript
// Actuel (ligne 10 de ProtectedRoute.tsx)
const pathname = window.location.pathname;
```

En v7 avec `startTransition`, `window.location.pathname` est mis à jour immédiatement par `history.pushState`, mais le re-render React est **différé** via `startTransition`. Cela crée un décalage : le `useEffect` se déclenche avec le nouveau `pathname` avant que React Router ait fini sa transition, ce qui peut interférer avec la navigation en cours (relance de `initializeAuth()`, vérification d'admin...).

**Solution** : Utiliser `useLocation()` de React Router qui reste synchronisé avec l'état interne du Router.

### Cause 3 — Pattern `navigate()` dans les callbacks d'événements

En v7, `navigate()` retourne `Promise<void>` au lieu de `void`. Dans les gestionnaires `onClick` des `DropdownMenuItem` (Radix UI), la Promise retournée peut interférer avec la gestion interne des événements du composant.

---

## Plan de modifications

### Fichier 1 : `src/routes.tsx` — Consolidation du Router (CRITIQUE)

Passer d'un pattern à deux Routers conditionnels vers un **unique Router** :

```tsx
export const AppRoutes = () => {
  const session = useSession();

  return (
    <Router>
      {!session ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <PermissionsProvider>
          <Routes>
            {/* ...toutes les routes authentifiées existantes... */}
          </Routes>
          <FeedbackButton />
          <VersionBadge />
        </PermissionsProvider>
      )}
      <Toaster />
    </Router>
  );
};
```

Le `Router` est instancié une seule fois. Le contenu change selon la session mais l'historique reste stable.

### Fichier 2 : `src/components/ProtectedRoute.tsx` — Remplacer `window.location.pathname` par `useLocation()`

```typescript
// Avant
const pathname = window.location.pathname;

// Après
import { useNavigate, useLocation } from "react-router";
const { pathname } = useLocation();
```

### Fichier 3 : `src/components/project/ProjectActions.tsx` — Préfixer `navigate()` avec `void`

Dans les callbacks `DropdownMenuItem` (lignes 132, 136, 140, 149), préfixer les appels `navigate()` :

```tsx
// Avant
onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${projectId}`); }}

// Après
onClick={(e) => { e.stopPropagation(); void navigate(`/tasks/${projectId}`); }}
```

### Fichiers 4-29 : Préfixer `void navigate()` dans tous les callbacks `onClick`

~29 fichiers utilisent `onClick={() => navigate(...)}`. Ajouter `void` pour éviter toute interférence du retour Promise :

| Catégorie | Fichiers concernés |
|---|---|
| Pages | `AdminDashboard`, `UserManagement`, `ProjectTemplateManagement`, `EmailTemplateManagement`, `NotificationManagement`, `APITokenManagement`, `RiskManagement`, `TaskManagement`, `ProjectFraming`, `ProjectTeamManagement`, `MyTasks`, `EvaluationsManagement`, `PortfolioPresentation` |
| Composants | `UserInfo`, `ProjectActions`, `LinkedProjectsSection`, `FavoriteProjects`, `ProjectsSummary`, `QuickActions`, `ProjectCart`, `LinkedProjectRedirect`, `DeleteProjectDialog`, `PortfolioCard`, `PortfolioReviewsTab`, `ReviewHistory`, `ActivityManagement` |
| Hooks | `useProjectNavigation` |

Transformation mécanique : `navigate(...)` → `void navigate(...)` dans les callbacks `onClick`.

---

## Résumé des impacts

| Modification | Fichiers | Risque |
|---|---|---|
| Consolidation Router unique | `routes.tsx` | Élevé (correctif critique) |
| `useLocation()` dans ProtectedRoute | `ProtectedRoute.tsx` | Moyen |
| `void navigate()` | ~30 fichiers | Faible (mécanique) |

## Aucun autre composant affecté

Les composants `Link` (14 fichiers), `useParams`, `useSearchParams` et `useLocation` fonctionnent identiquement en v7. Aucune modification nécessaire pour ceux-ci.


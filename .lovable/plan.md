

# Migration React Router v6 → v7

## Contexte

Le projet utilise `react-router-dom@^6.11.2` avec le pattern classique `BrowserRouter` + `Routes` + `Route`. **53 fichiers** importent depuis `react-router-dom`. Aucun usage de data routers, loaders ou actions — la migration est donc simple.

## Stratégie en 2 étapes

### Étape 1 — Activer les future flags sur v6 (filet de sécurité)

Mettre à jour vers la dernière v6 (`6.30.x`) et activer les future flags dans `routes.tsx` sur le `<Router>` :

```tsx
<Router future={{
  v7_relativeSplatPath: true,
  v7_startTransition: true,
}}>
```

Cela permet de valider la compatibilité avant la montée.

### Étape 2 — Monter en v7

1. **Dépendances** : remplacer `react-router-dom` par `react-router` dans `package.json`
   ```bash
   bun remove react-router-dom
   bun add react-router
   ```

2. **Imports** : dans les **53 fichiers**, remplacer :
   ```typescript
   // Avant
   import { ... } from "react-router-dom";
   // Après
   import { ... } from "react-router";
   ```
   C'est un find-and-replace global. Tous les hooks (`useNavigate`, `useParams`, `useLocation`, `useSearchParams`) et composants (`BrowserRouter`, `Routes`, `Route`, `Link`) restent identiques en v7.

3. **`routes.tsx`** : retirer les future flags devenues le comportement par défaut :
   ```tsx
   <Router> // plus besoin de future={{...}}
   ```

4. **Type `navigate`** : en v7, `navigate()` retourne `Promise<void>` au lieu de `void`. Ajouter `void navigate(...)` dans les cas où TypeScript se plaint (callbacks `onClick` etc.) — impact mineur.

## Fichiers impactés

| Catégorie | Fichiers | Modification |
|---|---|---|
| Routes principal | `src/routes.tsx` | Future flags → suppression |
| Pages | ~20 fichiers (`pages/*.tsx`) | Import path |
| Composants | ~25 fichiers (`components/**/*.tsx`) | Import path |
| Hooks | ~8 fichiers (`hooks/*.ts`) | Import path |
| Utils/contexts | ~3 fichiers | Import path |
| `package.json` | 1 | Swap dépendance |

**Total : 53 fichiers** — modification identique partout (changement d'import), aucun changement de logique.

## Risques

- **Aucun breaking change fonctionnel** pour un projet utilisant le pattern BrowserRouter classique sans data routers
- Le seul point d'attention est le type de retour de `navigate()` (`Promise<void>`) qui peut générer des warnings TypeScript

## Impact

Migration transparente pour les utilisateurs. Aucun changement de comportement, bundle légèrement réduit, accès aux futures améliorations de React Router.


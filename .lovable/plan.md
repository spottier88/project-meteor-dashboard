

# Résolution du bug de navigation sur la page `/projects`

## Analyse de la cause racine

Après inspection approfondie du code, la cause la plus probable est dans `ProtectedRoute.tsx`. Le premier `useEffect` a `[navigate, pathname]` comme dépendances :

```tsx
useEffect(() => {
    const initializeAuth = async () => {
      cleanupOldNavigationData();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRedirectUrl(pathname);
        navigate("/login");
      }
      setSessionChecked(true);
    };
    initializeAuth();
}, [navigate, pathname]);  // ← problème ici
```

En React Router v7, **toutes les navigations sont wrappées dans `React.startTransition`**. Quand l'utilisateur clique sur une carte projet :

1. `navigate('/projects/123')` est appelé, React Router démarre une transition
2. Le `useLocation()` du ProtectedRoute actuel change de `pathname`
3. Cela relance `initializeAuth()` avec un appel async `getSession()`
4. Le `setSessionChecked(true)` qui en résulte déclenche un state update **pendant la transition**
5. React peut abandonner ou différer la transition de navigation en cours

Le même problème touche le deuxième `useEffect` (listener `onAuthStateChange`) qui a aussi `pathname` en dépendance, recréant l'abonnement à chaque changement de route.

De plus, `useNavigate()` en v7 peut retourner une référence instable (dépendant de l'état interne du Router), ce qui amplifie le problème.

## Pourquoi c'est limité à `/projects`

Le Dashboard utilise des `Link` sans ProtectedRoute entre les composants et la navigation. Sur `/projects`, chaque clic passe par `navigateToProject()` ou `void navigate()` dans des composants enfants profondément imbriqués dans le ProtectedRoute, ce qui accentue le conflit entre transition et effects.

## Plan de correction

### 1. `src/components/ProtectedRoute.tsx` — Stabiliser les effects

- **Effect 1 (initializeAuth)** : exécuter uniquement au montage (dépendances vides). Utiliser une ref pour `pathname` et `navigate` afin d'éviter les re-exécutions.
- **Effect 2 (onAuthStateChange)** : monter le listener une seule fois au montage. Utiliser des refs pour les valeurs dynamiques (`pathname`, `sessionChecked`).
- **Effect 3 (admin check)** : garder tel quel (synchrone, pas d'interférence avec les transitions).

```tsx
const navigateRef = useRef(navigate);
const pathnameRef = useRef(pathname);

useEffect(() => {
  navigateRef.current = navigate;
  pathnameRef.current = pathname;
});

// Effect 1 : vérification initiale, une seule fois au montage
useEffect(() => {
  const initializeAuth = async () => {
    cleanupOldNavigationData();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const p = pathnameRef.current;
      if (p !== '/login' && p !== '/auth/callback') {
        setRedirectUrl(p);
      }
      navigateRef.current("/login");
    }
    setSessionChecked(true);
  };
  initializeAuth();
}, []); // ← montage uniquement

// Effect 2 : listener auth, monté une seule fois
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!session && event === 'SIGNED_OUT') {
        const p = pathnameRef.current;
        if (p !== '/login' && p !== '/auth/callback') {
          setRedirectUrl(p);
        }
        navigateRef.current("/login");
      }
    }
  );
  return () => subscription.unsubscribe();
}, []); // ← montage uniquement
```

### 2. `src/hooks/useProjectNavigation.ts` — Ajouter `void` au navigate

La ligne 58 appelle `navigate(projectUrl)` sans `void`, ce qui est le seul fichier manqué lors du correctif précédent :

```tsx
// Avant
navigate(projectUrl);
// Après
void navigate(projectUrl);
```

### 3. `src/components/cart/ProjectCart.tsx` — Ajouter `void` au navigate

Ligne 329 :
```tsx
// Avant
navigate("/presentation");
// Après
void navigate("/presentation");
```

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/ProtectedRoute.tsx` | Stabilisation des effects avec refs |
| `src/hooks/useProjectNavigation.ts` | Ajout `void navigate()` |
| `src/components/cart/ProjectCart.tsx` | Ajout `void navigate()` |

## Risque

Faible. Les refs préservent le comportement existant tout en éliminant les re-exécutions parasites. La vérification de session au montage suffit car le listener `onAuthStateChange` couvre les changements de session post-montage.

